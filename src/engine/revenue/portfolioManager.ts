// Portfolio Manager — trade execution, valuation, and P&L tracking
//
// Handles buying/selling assets with commission costs, tracks positions
// with weighted-average cost basis, and provides portfolio analytics.

import type {
  AssetState,
  GameState,
  Portfolio,
  Position,
  TradeOrder,
} from '../../types/index.ts';
import { CONFIG } from '../../data/config.ts';

// ─── Types ──────────────────────────────────────────────────────────────

export interface PositionSummary {
  assetId: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Counter-based trade ID generation to avoid non-seeded Math.random(). */
let tradeIdCounter = 0;

function makeTradeId(): string {
  tradeIdCounter += 1;
  return `trade_${Date.now()}_${tradeIdCounter}`;
}

// ─── Trade Execution ────────────────────────────────────────────────────

/**
 * Execute a buy or sell trade on the player's portfolio.
 *
 * Buy: deduct `quantity * currentPrice * (1 + commissionRate)` from cash,
 *      add/update position with weighted-average cost basis.
 *
 * Sell: add `quantity * currentPrice * (1 - commissionRate)` to cash,
 *       reduce position quantity, calculate realized P&L.
 *
 * Trade is recorded in history (capped at MAX_TRADE_HISTORY).
 *
 * Returns a new GameState with updated portfolio and company cash.
 */
export function executeTrade(
  state: GameState,
  assetId: string,
  type: 'buy' | 'sell',
  quantity: number,
): GameState {
  if (quantity <= 0) return state;

  const assetState = state.market.assets[assetId];
  if (!assetState) return state;

  const currentPrice = assetState.price;
  const commissionRate = CONFIG.BROKERAGE_COMMISSION_RATE;

  if (type === 'buy') {
    return executeBuy(state, assetId, quantity, currentPrice, commissionRate);
  } else {
    return executeSell(state, assetId, quantity, currentPrice, commissionRate);
  }
}

function executeBuy(
  state: GameState,
  assetId: string,
  quantity: number,
  currentPrice: number,
  commissionRate: number,
): GameState {
  const totalCost = quantity * currentPrice * (1 + commissionRate);

  // Check if player can afford it
  if (totalCost > state.company.cash) {
    return state; // Cannot afford — return unchanged state
  }

  // Update or create position with weighted-average cost basis
  const existingPosition = state.portfolio.positions[assetId];
  let newPosition: Position;

  if (existingPosition && existingPosition.quantity > 0) {
    // Weighted average cost = (oldQty * oldAvgCost + newQty * newPrice) / (oldQty + newQty)
    const totalQty = existingPosition.quantity + quantity;
    const totalCostBasis =
      existingPosition.quantity * existingPosition.averageCost +
      quantity * currentPrice;
    newPosition = {
      assetId,
      quantity: totalQty,
      averageCost: totalCostBasis / totalQty,
      openedOnDay: existingPosition.openedOnDay,
    };
  } else {
    newPosition = {
      assetId,
      quantity,
      averageCost: currentPrice,
      openedOnDay: state.time.day,
    };
  }

  // Create trade record
  const trade: TradeOrder = {
    id: makeTradeId(),
    assetId,
    type: 'buy',
    quantity,
    price: currentPrice,
    executedOnDay: state.time.day,
  };

  // Trim trade history to max
  const tradeHistory = [...state.portfolio.tradeHistory, trade];
  if (tradeHistory.length > CONFIG.MAX_TRADE_HISTORY) {
    tradeHistory.splice(0, tradeHistory.length - CONFIG.MAX_TRADE_HISTORY);
  }

  // Update statistics
  const tradeAmount = quantity * currentPrice;
  const newStatistics = {
    ...state.statistics,
    totalTradesMade: state.statistics.totalTradesMade + 1,
    largestSingleTrade: Math.max(
      state.statistics.largestSingleTrade,
      tradeAmount,
    ),
  };

  return {
    ...state,
    company: {
      ...state.company,
      cash: state.company.cash - totalCost,
    },
    portfolio: {
      ...state.portfolio,
      positions: {
        ...state.portfolio.positions,
        [assetId]: newPosition,
      },
      tradeHistory,
      totalInvested: state.portfolio.totalInvested + tradeAmount,
    },
    statistics: newStatistics,
  };
}

function executeSell(
  state: GameState,
  assetId: string,
  quantity: number,
  currentPrice: number,
  commissionRate: number,
): GameState {
  const existingPosition = state.portfolio.positions[assetId];
  if (!existingPosition || existingPosition.quantity <= 0) {
    return state; // Nothing to sell
  }

  // Clamp quantity to what we actually hold
  const sellQuantity = Math.min(quantity, existingPosition.quantity);

  // Revenue from sale (minus commission)
  const saleRevenue = sellQuantity * currentPrice * (1 - commissionRate);

  // Calculate realized P&L for this trade
  const costBasis = sellQuantity * existingPosition.averageCost;
  const grossRevenue = sellQuantity * currentPrice;
  const realizedPnL = grossRevenue - costBasis;

  // Update position
  const remainingQty = existingPosition.quantity - sellQuantity;
  const newPositions = { ...state.portfolio.positions };

  if (remainingQty <= 0) {
    // Position fully closed — remove it
    delete newPositions[assetId];
  } else {
    // Position partially closed — keep same average cost
    newPositions[assetId] = {
      ...existingPosition,
      quantity: remainingQty,
    };
  }

  // Create trade record
  const trade: TradeOrder = {
    id: makeTradeId(),
    assetId,
    type: 'sell',
    quantity: sellQuantity,
    price: currentPrice,
    executedOnDay: state.time.day,
  };

  // Trim trade history to max
  const tradeHistory = [...state.portfolio.tradeHistory, trade];
  if (tradeHistory.length > CONFIG.MAX_TRADE_HISTORY) {
    tradeHistory.splice(0, tradeHistory.length - CONFIG.MAX_TRADE_HISTORY);
  }

  // Update statistics
  const tradeAmount = sellQuantity * currentPrice;
  const newStatistics = {
    ...state.statistics,
    totalTradesMade: state.statistics.totalTradesMade + 1,
    largestSingleTrade: Math.max(
      state.statistics.largestSingleTrade,
      tradeAmount,
    ),
    totalProfitEarned:
      state.statistics.totalProfitEarned + Math.max(0, realizedPnL),
    totalLossIncurred:
      state.statistics.totalLossIncurred + Math.abs(Math.min(0, realizedPnL)),
  };

  return {
    ...state,
    company: {
      ...state.company,
      cash: state.company.cash + saleRevenue,
    },
    portfolio: {
      ...state.portfolio,
      positions: newPositions,
      tradeHistory,
      totalRealized: state.portfolio.totalRealized + realizedPnL,
    },
    statistics: newStatistics,
  };
}

// ─── Portfolio Analytics ────────────────────────────────────────────────

/**
 * Calculate the total current market value of all positions in the portfolio.
 */
export function calculatePortfolioValue(
  portfolio: Portfolio,
  assets: Record<string, AssetState>,
): number {
  let totalValue = 0;

  for (const [assetId, position] of Object.entries(portfolio.positions)) {
    const assetState = assets[assetId];
    if (assetState && position.quantity > 0) {
      totalValue += position.quantity * assetState.price;
    }
  }

  return totalValue;
}

/**
 * Calculate total unrealized P&L across all open positions.
 * Unrealized P&L = sum of (currentPrice - avgCost) * quantity for each position.
 */
export function calculateUnrealizedPnL(
  portfolio: Portfolio,
  assets: Record<string, AssetState>,
): number {
  let totalPnL = 0;

  for (const [assetId, position] of Object.entries(portfolio.positions)) {
    const assetState = assets[assetId];
    if (assetState && position.quantity > 0) {
      const pnl =
        (assetState.price - position.averageCost) * position.quantity;
      totalPnL += pnl;
    }
  }

  return totalPnL;
}

/**
 * Get a summary of each position including current price, P&L, and P&L percentage.
 */
export function getPositionSummaries(
  portfolio: Portfolio,
  assets: Record<string, AssetState>,
): PositionSummary[] {
  const summaries: PositionSummary[] = [];

  for (const [assetId, position] of Object.entries(portfolio.positions)) {
    if (position.quantity <= 0) continue;

    const assetState = assets[assetId];
    if (!assetState) continue;

    const currentPrice = assetState.price;
    const pnl = (currentPrice - position.averageCost) * position.quantity;
    const pnlPercent =
      position.averageCost > 0
        ? (currentPrice - position.averageCost) / position.averageCost
        : 0;

    summaries.push({
      assetId,
      quantity: position.quantity,
      avgCost: position.averageCost,
      currentPrice,
      pnl,
      pnlPercent,
    });
  }

  return summaries;
}
