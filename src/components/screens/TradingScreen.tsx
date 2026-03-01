import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useGameStore } from '../../store/gameStore.ts';
import { PALETTE } from '../../styles/palette.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { formatCurrency, formatPercent, formatGameDate } from '../../utils/format.ts';
import {
  getPositionSummaries,
  calculatePortfolioValue,
  calculateUnrealizedPnL,
} from '../../engine/revenue/portfolioManager.ts';
import { CONFIG } from '../../data/config.ts';
import { PixelPanel } from '../ui/PixelPanel.tsx';
import { PixelButton } from '../ui/PixelButton.tsx';

export function TradingScreen() {
  const portfolio = useGameStore((s) => s.portfolio);
  const assets = useGameStore((s) => s.market.assets);
  const cash = useGameStore((s) => s.company.cash);
  const statistics = useGameStore((s) => s.statistics);
  const executeBuy = useGameStore((s) => s.executeBuy);
  const executeSell = useGameStore((s) => s.executeSell);

  const [tradeAssetId, setTradeAssetId] = useState<string>(ASSET_DEFINITIONS[0]?.id ?? '');
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeQty, setTradeQty] = useState<string>('1');

  // Position summaries
  const summaries = useMemo(
    () => getPositionSummaries(portfolio, assets),
    [portfolio, assets],
  );

  const totalValue = useMemo(
    () => calculatePortfolioValue(portfolio, assets),
    [portfolio, assets],
  );

  const totalUnrealized = useMemo(
    () => calculateUnrealizedPnL(portfolio, assets),
    [portfolio, assets],
  );

  const totalInvested = portfolio.totalInvested;

  // Trade history (last 50)
  const recentTrades = useMemo(
    () => portfolio.tradeHistory.slice(-50).reverse(),
    [portfolio.tradeHistory],
  );

  // Trade execution preview
  const selectedAssetState = assets[tradeAssetId];
  const tradePrice = selectedAssetState?.price ?? 0;
  const qty = parseInt(tradeQty, 10) || 0;
  const commission = tradePrice * qty * CONFIG.BROKERAGE_COMMISSION_RATE;
  const totalCost = tradeType === 'buy'
    ? tradePrice * qty + commission
    : tradePrice * qty - commission;
  const currentPosition = portfolio.positions[tradeAssetId];
  const canExecute = tradeType === 'buy'
    ? qty > 0 && totalCost <= cash
    : qty > 0 && currentPosition !== undefined && currentPosition.quantity >= qty;

  // P&L Summary
  const bestTrade = statistics.totalProfitEarned;
  const worstTrade = statistics.totalLossIncurred;

  const vtFont: CSSProperties = {
    fontFamily: "'VT323', monospace",
    fontSize: '20px',
    color: PALETTE.text,
  };

  const tdStyle: CSSProperties = {
    padding: '6px 12px',
    borderBottom: `1px solid ${PALETTE.panelLight}`,
    whiteSpace: 'nowrap',
    ...vtFont,
    fontSize: '16px',
  };

  const thStyle: CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: `3px solid ${PALETTE.gold}`,
    fontFamily: "'Press Start 2P', cursive",
    fontSize: '7px',
    color: PALETTE.gold,
    whiteSpace: 'nowrap',
  };

  const getAssetTicker = (id: string) => {
    const def = ASSET_DEFINITIONS.find((d) => d.id === id);
    return def?.ticker ?? id;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Row 1: Portfolio Positions + Trade Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <PixelPanel title="Portfolio Positions">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...vtFont }}>
              <thead>
                <tr>
                  <th style={thStyle}>Asset</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Avg Cost</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>P&L</th>
                  <th style={thStyle}>P&L %</th>
                  <th style={thStyle}>Alloc %</th>
                </tr>
              </thead>
              <tbody>
                {summaries.length > 0 ? (
                  <>
                    {summaries.map((s) => {
                      const allocation = totalValue > 0
                        ? (s.currentPrice * s.quantity / totalValue) * 100
                        : 0;
                      return (
                        <tr
                          key={s.assetId}
                          style={{
                            backgroundColor: PALETTE.panel,
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ ...tdStyle, color: PALETTE.gold }}>{getAssetTicker(s.assetId)}</td>
                          <td style={tdStyle}>{s.quantity}</td>
                          <td style={tdStyle}>{formatCurrency(s.avgCost)}</td>
                          <td style={tdStyle}>{formatCurrency(s.currentPrice)}</td>
                          <td style={{
                            ...tdStyle,
                            color: s.pnl >= 0 ? PALETTE.green : PALETTE.red,
                          }}>
                            {formatCurrency(s.pnl)}
                          </td>
                          <td style={{
                            ...tdStyle,
                            color: s.pnlPercent >= 0 ? PALETTE.green : PALETTE.red,
                          }}>
                            {formatPercent(s.pnlPercent / 100)}
                          </td>
                          <td style={tdStyle}>{allocation.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                    {/* Totals Row */}
                    <tr style={{ backgroundColor: PALETTE.bgLight }}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: PALETTE.gold }}>TOTAL</td>
                      <td style={tdStyle}>-</td>
                      <td style={tdStyle}>{formatCurrency(totalInvested)}</td>
                      <td style={tdStyle}>{formatCurrency(totalValue)}</td>
                      <td style={{
                        ...tdStyle,
                        color: totalUnrealized >= 0 ? PALETTE.green : PALETTE.red,
                        fontWeight: 'bold',
                      }}>
                        {formatCurrency(totalUnrealized)}
                      </td>
                      <td style={tdStyle}>-</td>
                      <td style={tdStyle}>100%</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={7} style={{ ...tdStyle, color: PALETTE.textDim, textAlign: 'center' }}>
                      No positions. Buy assets to start trading!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PixelPanel>

        {/* Trade Execution Panel */}
        <PixelPanel title="Execute Trade">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Asset Selector */}
            <div>
              <label style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>Asset:</label>
              <select
                value={tradeAssetId}
                onChange={(e) => setTradeAssetId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px',
                  backgroundColor: PALETTE.bg,
                  color: PALETTE.text,
                  border: `2px solid ${PALETTE.panelLight}`,
                  fontFamily: "'VT323', monospace",
                  fontSize: '16px',
                  marginTop: '4px',
                }}
              >
                {ASSET_DEFINITIONS.map((def) => (
                  <option key={def.id} value={def.id}>
                    {def.ticker} - {def.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Buy/Sell Toggle */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: tradeType === 'buy' ? PALETTE.green : 'transparent',
                  color: tradeType === 'buy' ? PALETTE.black : PALETTE.textDim,
                  border: `2px solid ${tradeType === 'buy' ? PALETTE.green : PALETTE.panelLight}`,
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '9px',
                  cursor: 'pointer',
                }}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: tradeType === 'sell' ? PALETTE.red : 'transparent',
                  color: tradeType === 'sell' ? PALETTE.white : PALETTE.textDim,
                  border: `2px solid ${tradeType === 'sell' ? PALETTE.red : PALETTE.panelLight}`,
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '9px',
                  cursor: 'pointer',
                }}
              >
                SELL
              </button>
            </div>

            {/* Quantity Input */}
            <div>
              <label style={{ ...vtFont, fontSize: '14px', color: PALETTE.textDim }}>Quantity:</label>
              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <input
                  type="number"
                  min="1"
                  value={tradeQty}
                  onChange={(e) => setTradeQty(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    backgroundColor: PALETTE.bg,
                    color: PALETTE.text,
                    border: `2px solid ${PALETTE.panelLight}`,
                    fontFamily: "'VT323', monospace",
                    fontSize: '18px',
                  }}
                />
                {tradeType === 'sell' && currentPosition && (
                  <button
                    type="button"
                    style={{
                      padding: '4px 8px',
                      backgroundColor: PALETTE.bgLight,
                      color: PALETTE.cyan,
                      border: `1px solid ${PALETTE.cyan}`,
                      fontFamily: "'VT323', monospace",
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setTradeQty(String(currentPosition.quantity))}
                  >
                    Max
                  </button>
                )}
              </div>
            </div>

            {/* Preview */}
            <div style={{
              backgroundColor: PALETTE.bg,
              border: `2px solid ${PALETTE.panelLight}`,
              padding: '8px',
              ...vtFont,
              fontSize: '14px',
            }}>
              <div><span style={{ color: PALETTE.textDim }}>Price: </span>{formatCurrency(tradePrice)}</div>
              <div><span style={{ color: PALETTE.textDim }}>Commission: </span>{formatCurrency(commission)}</div>
              <div style={{ borderTop: `1px solid ${PALETTE.panelLight}`, paddingTop: '4px', marginTop: '4px' }}>
                <span style={{ color: PALETTE.textDim }}>{tradeType === 'buy' ? 'Total Cost' : 'Total Revenue'}: </span>
                <span style={{ color: PALETTE.gold }}>{formatCurrency(totalCost)}</span>
              </div>
              {currentPosition && (
                <div style={{ marginTop: '4px' }}>
                  <span style={{ color: PALETTE.textDim }}>Held: </span>
                  {currentPosition.quantity} shares
                </div>
              )}
            </div>

            {/* Execute Button */}
            <PixelButton
              variant={canExecute ? (tradeType === 'buy' ? 'success' : 'error') : 'disabled'}
              onClick={() => {
                if (!canExecute) return;
                if (tradeType === 'buy') {
                  executeBuy(tradeAssetId, qty);
                } else {
                  executeSell(tradeAssetId, qty);
                }
                setTradeQty('1');
              }}
            >
              {tradeType === 'buy' ? 'EXECUTE BUY' : 'EXECUTE SELL'}
            </PixelButton>
          </div>
        </PixelPanel>
      </div>

      {/* Row 2: Trade History + P&L Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
        <PixelPanel title="Trade History">
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...vtFont }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Asset</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Qty</th>
                  <th style={thStyle}>Price</th>
                  <th style={thStyle}>Total</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.length > 0 ? (
                  recentTrades.map((trade, idx) => (
                    <tr
                      key={trade.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? PALETTE.panel : PALETTE.bgLight,
                      }}
                    >
                      <td style={{ ...tdStyle, fontSize: '14px' }}>
                        {formatGameDate(trade.executedOnDay)}
                      </td>
                      <td style={{ ...tdStyle, color: PALETTE.gold }}>{getAssetTicker(trade.assetId)}</td>
                      <td style={{
                        ...tdStyle,
                        color: trade.type === 'buy' ? PALETTE.green : PALETTE.red,
                      }}>
                        {trade.type.toUpperCase()}
                      </td>
                      <td style={tdStyle}>{trade.quantity}</td>
                      <td style={tdStyle}>{formatCurrency(trade.price)}</td>
                      <td style={tdStyle}>{formatCurrency(trade.quantity * trade.price)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, color: PALETTE.textDim, textAlign: 'center' }}>
                      No trades yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </PixelPanel>

        <PixelPanel title="P&L Summary">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              backgroundColor: PALETTE.bgLight,
              border: `2px solid ${PALETTE.panelLight}`,
              padding: '12px',
              ...vtFont,
              fontSize: '16px',
            }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: PALETTE.textDim }}>Realized P&L: </span>
                <span style={{
                  color: portfolio.totalRealized >= 0 ? PALETTE.green : PALETTE.red,
                  fontSize: '22px',
                }}>
                  {formatCurrency(portfolio.totalRealized)}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: PALETTE.textDim }}>Unrealized P&L: </span>
                <span style={{
                  color: totalUnrealized >= 0 ? PALETTE.green : PALETTE.red,
                  fontSize: '22px',
                }}>
                  {formatCurrency(totalUnrealized)}
                </span>
              </div>
              <div style={{
                borderTop: `2px solid ${PALETTE.panelLight}`,
                paddingTop: '8px',
                marginTop: '8px',
              }}>
                <span style={{ color: PALETTE.textDim }}>Total P&L: </span>
                <span style={{
                  color: (portfolio.totalRealized + totalUnrealized) >= 0 ? PALETTE.green : PALETTE.red,
                  fontSize: '24px',
                }}>
                  {formatCurrency(portfolio.totalRealized + totalUnrealized)}
                </span>
              </div>
            </div>

            <div style={{ ...vtFont, fontSize: '16px' }}>
              <div>
                <span style={{ color: PALETTE.textDim }}>Total Trades: </span>
                <span>{statistics.totalTradesMade}</span>
              </div>
              <div>
                <span style={{ color: PALETTE.textDim }}>Largest Trade: </span>
                <span>{formatCurrency(statistics.largestSingleTrade)}</span>
              </div>
              <div>
                <span style={{ color: PALETTE.textDim }}>Total Profit: </span>
                <span style={{ color: PALETTE.green }}>{formatCurrency(bestTrade)}</span>
              </div>
              <div>
                <span style={{ color: PALETTE.textDim }}>Total Loss: </span>
                <span style={{ color: PALETTE.red }}>{formatCurrency(worstTrade)}</span>
              </div>
            </div>
          </div>
        </PixelPanel>
      </div>
    </div>
  );
}
