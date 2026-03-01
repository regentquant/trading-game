// Core 7-layer price simulation engine
//
// Layer 1: GBM (Geometric Brownian Motion) base step
// Layer 2: Regime switching (bull / bear / sideways)
// Layer 3: Mean reversion (Ornstein-Uhlenbeck process)
// Layer 4: Jump diffusion (Poisson jumps)
// Layer 5: GARCH(1,1) volatility clustering
// Layer 6: Cross-asset correlation (Cholesky)
// Layer 7: Event shock overlay

import type {
  AssetDefinition,
  AssetClass,
  AssetState,
  MarketRegime,
  MarketState,
  PriceShock,
} from '../../types/index.ts';
import type { RNG } from '../../utils/random.ts';
import { CONFIG } from '../../data/config.ts';
import { choleskyDecompose, correlatedNormals, clamp, poissonSample } from '../../utils/math.ts';
import { buildCorrelationMatrix } from './correlationMatrix.ts';

// ────────────────────────────────────────────────────────────
// Internal per-asset state that extends what's stored in MarketState.
// We track GARCH variance and last return alongside AssetState.
// ────────────────────────────────────────────────────────────

interface GarchState {
  currentVariance: number;
  lastReturn: number;
}

// Module-level GARCH states — keyed by asset id.
// Initialized alongside MarketState and updated each tick.
const garchStates: Map<string, GarchState> = new Map();

// Cached Cholesky lower-triangular matrix (recomputed on regime change).
let cachedCholesky: number[][] | null = null;

// ────────────────────────────────────────────────────────────
// Layer 2 helpers — Regime switching
// ────────────────────────────────────────────────────────────

const REGIME_MULTIPLIERS: Record<MarketRegime, { drift: number; vol: number }> = {
  bull: { drift: 1.5, vol: 0.8 },
  bear: { drift: -1.0, vol: 1.5 },
  sideways: { drift: 0.3, vol: 0.6 },
};

function sampleNextRegime(current: MarketRegime, rng: RNG): MarketRegime {
  const transitions = CONFIG.REGIME_TRANSITION[current];
  const r = rng.next();
  let cumulative = 0;
  for (const regime of ['bull', 'bear', 'sideways'] as MarketRegime[]) {
    cumulative += transitions[regime];
    if (r < cumulative) return regime;
  }
  return 'sideways'; // fallback
}

function sampleRegimeDuration(regime: MarketRegime, rng: RNG): number {
  const range = CONFIG.REGIME_DURATION[regime];
  return Math.floor(rng.next() * (range.max - range.min + 1)) + range.min;
}

// ────────────────────────────────────────────────────────────
// Layer 5 helper — GARCH(1,1)
// ────────────────────────────────────────────────────────────

function garchParams(assetClass: AssetClass) {
  return CONFIG.GARCH[assetClass];
}

function updateGarch(
  assetId: string,
  assetClass: AssetClass,
  lastReturn: number,
  baseAnnualVariance: number,
): number {
  let gs = garchStates.get(assetId);
  if (!gs) {
    // Initialize with unconditional variance (daily)
    gs = {
      currentVariance: baseAnnualVariance / 252,
      lastReturn: 0,
    };
    garchStates.set(assetId, gs);
  }

  const { omega, alpha, beta } = garchParams(assetClass);
  const newVariance = omega + alpha * gs.lastReturn * gs.lastReturn + beta * gs.currentVariance;

  // Clamp to [0.5x, 3x] of base daily variance
  const baseDailyVar = baseAnnualVariance / 252;
  const clamped = clamp(newVariance, baseDailyVar * 0.5, baseDailyVar * 3);

  gs.currentVariance = clamped;
  gs.lastReturn = lastReturn;

  return Math.sqrt(clamped);
}

// ────────────────────────────────────────────────────────────
// Main tick — runs one full market day for all assets
// ────────────────────────────────────────────────────────────

export function tickMarket(
  marketState: MarketState,
  assetDefs: AssetDefinition[],
  rng: RNG,
): MarketState {
  // --- Layer 2: Check for regime transition ---
  let { globalRegime, regimeDaysRemaining, correlationMatrix } = marketState;
  let regimeChanged = false;

  regimeDaysRemaining -= 1;
  if (regimeDaysRemaining <= 0) {
    globalRegime = sampleNextRegime(globalRegime, rng);
    regimeDaysRemaining = sampleRegimeDuration(globalRegime, rng);
    regimeChanged = true;
  }

  // --- Layer 6: Correlated normals ---
  // Recompute Cholesky if regime changed or not yet cached
  if (regimeChanged || !cachedCholesky) {
    cachedCholesky = choleskyDecompose(correlationMatrix);
  }

  const Z = correlatedNormals(cachedCholesky, rng);

  // Build an ordered asset list for consistent indexing
  const assetIdOrder = assetDefs.map((d) => d.id);
  const defMap = new Map(assetDefs.map((d) => [d.id, d]));

  const regimeMult = REGIME_MULTIPLIERS[globalRegime];

  // Process each asset
  const newAssets: Record<string, AssetState> = {};

  for (let idx = 0; idx < assetIdOrder.length; idx++) {
    const assetId = assetIdOrder[idx];
    const def = defMap.get(assetId)!;
    const prev = marketState.assets[assetId];

    // Per-asset regime (currently we use the global regime for all;
    // individual regimes could override later)
    const currentPrice = prev.price;
    const logPrice = Math.log(currentPrice);

    // --- Layer 1: GBM base ---
    const mu = def.annualDrift * regimeMult.drift;
    const sigma = def.annualVolatility * regimeMult.vol;

    const dailyDrift = (mu - (sigma * sigma) / 2) / 252;

    // --- Layer 3: Mean reversion (OU) ---
    let driftAdjustment = 0;
    if (def.meanReversionSpeed > 0) {
      const theta = def.meanReversionSpeed;
      const meanLevel = def.meanReversionLevel;
      driftAdjustment = (theta * (meanLevel - logPrice)) / 252;
    }

    // --- Layer 5: GARCH volatility ---
    // Use GARCH-adjusted sigma (daily) for the diffusion term
    const baseAnnualVariance = sigma * sigma;
    const garchSigmaDaily = updateGarch(assetId, def.class, garchStates.get(assetId)?.lastReturn ?? 0, baseAnnualVariance);

    // --- Layer 1 continued: Compute log return with correlated Z ---
    const zVal = Z[idx]; // Layer 6 correlated normal
    let logReturn = dailyDrift + driftAdjustment + garchSigmaDaily * zVal;

    // --- Layer 4: Jump diffusion ---
    const numJumps = poissonSample(def.jumpFrequency / 252, rng);
    for (let j = 0; j < numJumps; j++) {
      const jumpStdDev = Math.abs(def.jumpMeanSize) * 0.5; // use half of mean as std dev
      const jump = def.jumpMeanSize + jumpStdDev * rng.nextGaussian();
      logReturn += jump;
    }

    // --- Layer 7: Event shock overlay ---
    let shockContribution = 0;
    const updatedShocks: PriceShock[] = [];
    for (const shock of prev.activeShocks) {
      shockContribution += shock.magnitude;
      const decayedMagnitude = shock.magnitude * (1 - shock.decayRate);
      if (Math.abs(decayedMagnitude) >= 0.0001) {
        updatedShocks.push({ ...shock, magnitude: decayedMagnitude });
      }
    }
    // Clamp total shock contribution to prevent unrealistic price moves
    shockContribution = clamp(shockContribution, -0.3, 0.3);
    logReturn += shockContribution;

    // --- Compute new price ---
    const newLogPrice = logPrice + logReturn;
    const newPrice = Math.max(Math.exp(newLogPrice), 0.001); // floor at 0.001

    // --- Update price history ---
    const priceHistory = [...prev.priceHistory, newPrice];
    if (priceHistory.length > CONFIG.MAX_PRICE_HISTORY) {
      priceHistory.shift();
    }

    // Monthly history: add to monthlyHistory every 30 days
    let monthlyHistory = prev.monthlyHistory;
    if (priceHistory.length % CONFIG.DAYS_PER_MONTH === 0) {
      monthlyHistory = [...monthlyHistory, newPrice];
      if (monthlyHistory.length > CONFIG.MAX_MONTHLY_HISTORY) {
        monthlyHistory = monthlyHistory.slice(1);
      }
    }

    // Update GARCH with the realized return
    updateGarch(assetId, def.class, logReturn, baseAnnualVariance);

    newAssets[assetId] = {
      id: assetId,
      price: newPrice,
      previousPrice: currentPrice,
      priceHistory,
      monthlyHistory,
      volatility: garchSigmaDaily * Math.sqrt(252), // annualized
      regime: globalRegime,
      activeShocks: updatedShocks,
    };
  }

  return {
    assets: newAssets,
    globalRegime,
    regimeDaysRemaining,
    correlationMatrix,
    storytellerMode: marketState.storytellerMode,
  };
}

// ────────────────────────────────────────────────────────────
// Initialization — create starting market state and warm up
// ────────────────────────────────────────────────────────────

export function initializeMarketState(
  assetDefs: AssetDefinition[],
  rng: RNG,
): MarketState {
  // Reset module-level caches
  garchStates.clear();
  cachedCholesky = null;

  // Build initial correlation matrix
  const correlationMatrix = buildCorrelationMatrix(assetDefs);

  // Pick starting regime
  const globalRegime: MarketRegime = 'sideways';
  const regimeDaysRemaining = sampleRegimeDuration(globalRegime, rng);

  // Build initial asset states
  const assets: Record<string, AssetState> = {};
  for (const def of assetDefs) {
    assets[def.id] = {
      id: def.id,
      price: def.basePrice,
      previousPrice: def.basePrice,
      priceHistory: [def.basePrice],
      monthlyHistory: [def.basePrice],
      volatility: def.annualVolatility,
      regime: globalRegime,
      activeShocks: [],
    };

    // Initialize GARCH state
    garchStates.set(def.id, {
      currentVariance: (def.annualVolatility * def.annualVolatility) / 252,
      lastReturn: 0,
    });
  }

  let state: MarketState = {
    assets,
    globalRegime,
    regimeDaysRemaining,
    correlationMatrix,
    storytellerMode: 'steady_growth',
  };

  // Warm-up: run 30 ticks silently to build initial history and GARCH state
  for (let i = 0; i < 30; i++) {
    state = tickMarket(state, assetDefs, rng);
  }

  return state;
}
