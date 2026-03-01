// Revenue Stream Engine — calculates monthly revenue for all 12 streams
//
// Each stream has a unique formula driven by employee skills, market conditions,
// company reputation, and random events. Revenue ticks once per month (30 days).

import type {
  ActiveRevenueStream,
  Employee,
  EmployeeRole,
  EmployeeStats,
  GameState,
  RevenueStreamDefinition,
  RevenueStreamId,
  UnlockRequirement,
} from '../../types/index.ts';
import type { RNG } from '../../utils/random.ts';
import { CONFIG } from '../../data/config.ts';
import { REVENUE_STREAM_DEFINITIONS } from '../../data/revenue.ts';

// ─── Helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Get all employees that match a given role. */
function getEmployeesByRole(state: GameState, role: EmployeeRole): Employee[] {
  return Object.values(state.employees).filter((e) => e.role === role);
}

/** Get the average value of a specific stat across a set of employees. */
function getAverageStat(
  employees: Employee[],
  stat: keyof EmployeeStats,
): number {
  if (employees.length === 0) return 0;
  const total = employees.reduce((sum, e) => sum + e.stats[stat], 0);
  return total / employees.length;
}

/** Get total employee count. */
function getEmployeeCount(state: GameState): number {
  return Object.keys(state.employees).length;
}

/** Get the highest value of a stat among all employees with a given role. */
export function getMaxStatForRole(
  state: GameState,
  role: EmployeeRole,
  stat: keyof EmployeeStats,
): number {
  const emps = getEmployeesByRole(state, role);
  if (emps.length === 0) return 0;
  return Math.max(...emps.map((e) => e.stats[stat]));
}

/** Get the stream definition by id. */
function getStreamDef(
  streamId: RevenueStreamId,
): RevenueStreamDefinition | undefined {
  return REVENUE_STREAM_DEFINITIONS.find((d) => d.id === streamId);
}

/** Get the average morale of assigned employees for a stream, or all employees if none assigned. */
function getStreamMoraleMultiplier(
  state: GameState,
  stream: ActiveRevenueStream,
): number {
  const assignedEmps = stream.assignedEmployeeIds
    .map((id) => state.employees[id])
    .filter((e): e is Employee => e !== undefined);

  const emps =
    assignedEmps.length > 0 ? assignedEmps : Object.values(state.employees);
  if (emps.length === 0) return 0.5;

  const avgMorale =
    emps.reduce((sum, e) => sum + e.morale, 0) / emps.length;
  // Morale multiplier: 0.5 at 0 morale, 1.0 at 70 morale, 1.2 at 100 morale
  return 0.5 + (avgMorale / 100) * 0.7;
}

// ─── Unlock Requirements ────────────────────────────────────────────────

/**
 * Check whether all unlock requirements for a revenue stream definition
 * are satisfied by the current game state.
 */
export function checkUnlockRequirements(
  def: RevenueStreamDefinition,
  state: GameState,
): boolean {
  for (const req of def.unlockRequirements) {
    if (!checkSingleRequirement(req, state)) {
      return false;
    }
  }
  return true;
}

function checkSingleRequirement(
  req: UnlockRequirement,
  state: GameState,
): boolean {
  switch (req.type) {
    case 'reputation':
      return state.company.reputation >= req.value;

    case 'cash':
      return state.company.cash >= req.value;

    case 'employee_count':
      return getEmployeeCount(state) >= req.value;

    case 'employee_skill': {
      // Check if any employee has the target stat >= value
      if (!req.target) return false;
      const statKey = req.target as keyof EmployeeStats;
      return Object.values(state.employees).some(
        (e) => e.stats[statKey] >= req.value,
      );
    }

    case 'revenue_stream': {
      // Check if a specific revenue stream is already unlocked and active
      if (!req.target) return false;
      const targetStream =
        state.revenueStreams[req.target as RevenueStreamId];
      return targetStream !== undefined && targetStream.unlocked;
    }

    case 'day':
      return state.time.day >= req.value;

    default:
      return false;
  }
}

// ─── Per-Stream Revenue Calculations ────────────────────────────────────

/**
 * Calculate monthly revenue for a single revenue stream.
 * Each stream uses a unique formula driven by employee skills,
 * market conditions, company stats, and RNG.
 */
export function calculateStreamRevenue(
  streamId: RevenueStreamId,
  state: GameState,
  rng: RNG,
): number {
  const stream = state.revenueStreams[streamId];
  if (!stream || !stream.unlocked || !stream.active) return 0;

  const def = getStreamDef(streamId);
  if (!def) return 0;

  const moraleMultiplier = getStreamMoraleMultiplier(state, stream);

  switch (streamId) {
    case 'brokerage':
      return calcBrokerage(state, stream, moraleMultiplier);
    case 'consulting':
      return calcConsulting(state, stream, moraleMultiplier);
    case 'research':
      return calcResearch(state, stream, moraleMultiplier);
    case 'asset_management':
      return calcAssetManagement(state, stream, rng, moraleMultiplier);
    case 'market_making':
      return calcMarketMaking(state, stream, moraleMultiplier);
    case 'ma_advisory':
      return calcMAAdvisory(state, rng, moraleMultiplier);
    case 'lending':
      return calcLending(state, moraleMultiplier);
    case 'wealth_management':
      return calcWealthManagement(state, stream, moraleMultiplier);
    case 'real_estate_invest':
      return calcRealEstate(state, stream, rng, moraleMultiplier);
    case 'ipo_underwriting':
      return calcIPOUnderwriting(state, rng, moraleMultiplier);
    case 'prop_trading':
      return calcPropTrading(state, stream, rng, moraleMultiplier);
    case 'insurance':
      return calcInsurance(state, stream, rng, moraleMultiplier);
    default:
      return 0;
  }
}

// ── Brokerage ──
// clientCount * avgTradesPerClient * tradeValue * commissionRate * employeeEfficiency
// Client count grows with reputation and broker count
function calcBrokerage(
  state: GameState,
  stream: ActiveRevenueStream,
  moraleMultiplier: number,
): number {
  const brokers = getEmployeesByRole(state, 'broker');
  const brokerCount = Math.max(1, brokers.length);

  // Client count: base from reputation + broker scaling
  const reputationClients = Math.floor(state.company.reputation * 2);
  const brokerClients = brokerCount * 15;
  const clientCount = stream.clientCount ?? (reputationClients + brokerClients);

  // Average trades per client per month (5-20 range based on market activity)
  const avgTradesPerClient = 8 + (state.company.reputation / 100) * 12;

  // Average trade value ($1,000 - $10,000)
  const tradeValue = 2000 + stream.level * 500;

  // Employee efficiency from broker salesmanship
  const avgSalesmanship = getAverageStat(brokers, 'salesmanship');
  const employeeEfficiency = 0.6 + (avgSalesmanship / 10) * 0.6;

  const revenue =
    clientCount *
    avgTradesPerClient *
    tradeValue *
    CONFIG.BROKERAGE_COMMISSION_RATE *
    employeeEfficiency *
    moraleMultiplier;

  return Math.max(0, Math.round(revenue));
}

// ── Consulting ──
// projectCount * projectFee * qualityMultiplier
// Projects available = analyst count, fee scales with analytics stat
function calcConsulting(
  state: GameState,
  _stream: ActiveRevenueStream,
  moraleMultiplier: number,
): number {
  const analysts = getEmployeesByRole(state, 'analyst');
  const analystCount = Math.max(1, analysts.length);

  // Each analyst can handle 1-2 projects per month
  const projectCount = Math.floor(analystCount * 1.5);

  // Project fee: $5,000 base, scales with average analytics skill
  const avgAnalytics = getAverageStat(analysts, 'analytics');
  const projectFee = 5000 + avgAnalytics * 1000;

  // Quality multiplier from reputation
  const qualityMultiplier = 0.8 + (state.company.reputation / 100) * 0.5;

  const revenue =
    projectCount * projectFee * qualityMultiplier * moraleMultiplier;
  return Math.max(0, Math.round(revenue));
}

// ── Research ──
// subscriberCount * subscriptionFee
// Subscribers grow when research quality (analyst analytics average) is high
function calcResearch(
  state: GameState,
  stream: ActiveRevenueStream,
  moraleMultiplier: number,
): number {
  const analysts = getEmployeesByRole(state, 'analyst');
  const avgAnalytics = getAverageStat(analysts, 'analytics');

  // Subscribers: base from level + quality-driven growth
  const qualityFactor = analysts.length > 0 ? avgAnalytics / 10 : 0; // 0.0 to 1.0
  const baseSubscribers = 50 + stream.level * 30;
  const qualitySubscribers = Math.floor(
    state.company.reputation * qualityFactor * 3,
  );
  const subscriberCount =
    stream.clientCount ?? (baseSubscribers + qualitySubscribers);

  // Subscription fee: $100-$500/month based on quality
  const subscriptionFee = 100 + avgAnalytics * 40;

  const revenue = subscriberCount * subscriptionFee * moraleMultiplier;
  return Math.max(0, Math.round(revenue));
}

// ── Asset Management ──
// aum * managementFee/12 + max(0, aumReturn - hurdleRate) * performanceFee
// AUM grows when fund performance is good; shrinks during drawdowns
function calcAssetManagement(
  state: GameState,
  stream: ActiveRevenueStream,
  rng: RNG,
  moraleMultiplier: number,
): number {
  const fundManagers = getEmployeesByRole(state, 'fund_manager');
  const avgRiskMgmt = getAverageStat(fundManagers, 'riskManagement');
  const avgAnalytics = getAverageStat(fundManagers, 'analytics');

  // AUM: stored on the stream or default
  const aum = stream.aum ?? 500000;

  // Management fee: 2% annual / 12
  const managementFeeRevenue = aum * (CONFIG.ASSET_MGMT_FEE / 12);

  // Monthly return: based on fund manager skill + market conditions
  const skillBonus = fundManagers.length > 0 ? (avgRiskMgmt + avgAnalytics) / 20 : 0; // 0.0 to 1.0
  const regimeReturn =
    state.market.globalRegime === 'bull'
      ? 0.02
      : state.market.globalRegime === 'bear'
        ? -0.015
        : 0.005;

  const monthlyReturn = regimeReturn + skillBonus * 0.01 + rng.nextGaussian() * 0.02;
  const aumReturn = aum * monthlyReturn;

  // Performance fee: 20% of returns above hurdle rate (0.5% monthly)
  const hurdleRate = 0.005;
  const excessReturn = Math.max(0, monthlyReturn - hurdleRate);
  const performanceFeeRevenue =
    aum * excessReturn * CONFIG.ASSET_MGMT_PERFORMANCE_FEE;

  const revenue =
    (managementFeeRevenue + performanceFeeRevenue + Math.max(0, aumReturn * 0.1)) *
    moraleMultiplier;
  return Math.round(revenue);
}

// ── Market Making ──
// tradingVolume * spread * efficiency - inventoryRisk
// Efficiency from trader/quant skills; inventoryRisk proportional to volatility
function calcMarketMaking(
  state: GameState,
  _stream: ActiveRevenueStream,
  moraleMultiplier: number,
): number {
  const traders = getEmployeesByRole(state, 'trader');
  const quants = getEmployeesByRole(state, 'quant');
  const avgTraderSkill = getAverageStat(traders, 'riskManagement');
  const avgQuantSkill = getAverageStat(quants, 'quantSkill');

  // Trading volume scales with number of market makers and reputation
  const tradingVolume =
    (traders.length + quants.length) * 500000 +
    state.company.reputation * 10000;

  // Spread
  const spread = CONFIG.MARKET_MAKING_SPREAD;

  // Efficiency: 0.5 base + skill bonus
  const efficiency = 0.5 + ((avgTraderSkill + avgQuantSkill) / 20) * 0.5;

  // Inventory risk: proportional to average market volatility
  const assetStates = Object.values(state.market.assets);
  const avgVolatility =
    assetStates.length > 0
      ? assetStates.reduce((sum, a) => sum + a.volatility, 0) /
        assetStates.length
      : 0.2;
  const inventoryRisk = tradingVolume * spread * avgVolatility * 0.3;

  const revenue =
    (tradingVolume * spread * efficiency - inventoryRisk) * moraleMultiplier;
  return Math.round(revenue);
}

// ── M&A Advisory ──
// Roll for deals each month. Deal value = random $1M-$50M. Fee = 1.5%.
function calcMAAdvisory(
  state: GameState,
  rng: RNG,
  moraleMultiplier: number,
): number {
  const bankers = getEmployeesByRole(state, 'investment_banker');
  const bankerCount = bankers.length;
  if (bankerCount === 0) return 0;

  const avgSalesmanship = getAverageStat(bankers, 'salesmanship');
  const avgLeadership = getAverageStat(bankers, 'leadership');

  // Probability of landing a deal: 20% base per banker, boosted by skill
  const dealProbPerBanker =
    0.2 + (avgSalesmanship / 10) * 0.15 + (avgLeadership / 10) * 0.1;

  let totalRevenue = 0;

  for (let i = 0; i < bankerCount; i++) {
    if (rng.next() < dealProbPerBanker) {
      // Deal value: $1M to $50M (log-uniform for realism)
      const logMin = Math.log(1_000_000);
      const logMax = Math.log(50_000_000);
      const dealValue = Math.exp(logMin + rng.next() * (logMax - logMin));

      // Advisory fee: 1.5% of deal value
      const fee = dealValue * 0.015;
      totalRevenue += fee;
    }
  }

  // Reputation bonus
  const reputationBonus = 1 + (state.company.reputation / 100) * 0.3;

  return Math.max(0, Math.round(totalRevenue * reputationBonus * moraleMultiplier));
}

// ── Lending ──
// totalLoansOut * interestRate / 12 - defaultRate * totalLoansOut
// Default rate increases in bear markets
function calcLending(
  state: GameState,
  moraleMultiplier: number,
): number {
  const totalLoans = state.company.totalLoans;
  if (totalLoans <= 0) return 0;

  const interestRate = state.company.loanInterestRate;

  // Monthly interest income
  const interestIncome = totalLoans * (interestRate / 12);

  // Default rate: base 0.2% monthly, increases in bear market
  let defaultRate = 0.002;
  if (state.market.globalRegime === 'bear') {
    defaultRate = 0.005; // 2.5x default rate in bear market
  } else if (state.market.globalRegime === 'sideways') {
    defaultRate = 0.003;
  }

  // Compliance officers reduce default rate
  const complianceOfficers = getEmployeesByRole(state, 'compliance');
  const complianceSkill = getAverageStat(
    complianceOfficers,
    'riskManagement',
  );
  const defaultReduction = 1 - (complianceSkill / 10) * 0.3; // up to 30% reduction
  const adjustedDefaultRate = defaultRate * defaultReduction;

  const defaultLosses = adjustedDefaultRate * totalLoans;

  const revenue = (interestIncome - defaultLosses) * moraleMultiplier;
  return Math.round(revenue);
}

// ── Wealth Management ──
// hnwClientCount * avgAUM * feeRate
// Client count based on broker relationships and reputation
function calcWealthManagement(
  state: GameState,
  stream: ActiveRevenueStream,
  moraleMultiplier: number,
): number {
  const brokers = getEmployeesByRole(state, 'broker');
  const avgSalesmanship = getAverageStat(brokers, 'salesmanship');

  // HNW client count: reputation-driven + broker relationships
  const reputationClients = Math.floor(state.company.reputation / 5);
  const brokerClients = Math.floor(
    brokers.length * (avgSalesmanship / 10) * 5,
  );
  const hnwClientCount =
    stream.clientCount ?? Math.max(1, reputationClients + brokerClients);

  // Average AUM per HNW client: $200K - $2M
  const avgAUM = 200000 + stream.level * 100000 + state.company.reputation * 5000;

  // Fee rate: 1% annual / 12
  const feeRate = 0.01 / 12;

  const revenue = hnwClientCount * avgAUM * feeRate * moraleMultiplier;
  return Math.max(0, Math.round(revenue));
}

// ── Real Estate Investing ──
// propertiesOwned * rentalYield + appreciation
function calcRealEstate(
  state: GameState,
  stream: ActiveRevenueStream,
  rng: RNG,
  moraleMultiplier: number,
): number {
  // Properties scale with level and investment
  const propertiesOwned = Math.max(1, stream.level * 2);

  // Monthly rental yield per property: $2,000 - $8,000
  const baseRentalYield = 3000 + stream.level * 1000;

  // Analyst skill helps with property selection
  const analysts = getEmployeesByRole(state, 'analyst');
  const avgAnalytics = getAverageStat(analysts, 'analytics');
  const yieldMultiplier = 0.8 + (avgAnalytics / 10) * 0.4;

  const rentalIncome =
    propertiesOwned * baseRentalYield * yieldMultiplier;

  // Appreciation: small random monthly gain/loss
  const appreciationRate = 0.003 + rng.nextGaussian() * 0.005;
  const propertyValue = propertiesOwned * 200000; // $200K per property
  const appreciation = propertyValue * appreciationRate;

  // Real estate regime sensitivity (bear = less appreciation)
  const regimeMultiplier =
    state.market.globalRegime === 'bull'
      ? 1.2
      : state.market.globalRegime === 'bear'
        ? 0.7
        : 1.0;

  const revenue =
    (rentalIncome + appreciation * regimeMultiplier) * moraleMultiplier;
  return Math.round(revenue);
}

// ── IPO Underwriting ──
// Roll for IPO opportunities (rare). Revenue = dealSize * underwritingFee.
// Risk: if IPO priced wrong (random based on analyst skill), take a loss.
function calcIPOUnderwriting(
  state: GameState,
  rng: RNG,
  moraleMultiplier: number,
): number {
  const bankers = getEmployeesByRole(state, 'investment_banker');
  const analysts = getEmployeesByRole(state, 'analyst');
  if (bankers.length < 2) return 0;

  const avgBankerSalesmanship = getAverageStat(bankers, 'salesmanship');
  const avgAnalystSkill = getAverageStat(analysts, 'analytics');

  // IPO opportunity probability: rare (10-25% per month based on banker count and skill)
  const ipoProbability =
    0.1 +
    bankers.length * 0.03 +
    (avgBankerSalesmanship / 10) * 0.1;

  if (rng.next() > ipoProbability) {
    return 0; // No IPO this month
  }

  // Deal size: $10M to $200M
  const logMin = Math.log(10_000_000);
  const logMax = Math.log(200_000_000);
  const dealSize = Math.exp(logMin + rng.next() * (logMax - logMin));

  // Underwriting fee: 5-7% of deal size
  const baseFee = dealSize * (0.05 + rng.next() * 0.02);

  // Mispricing risk: probability of loss based on analyst skill gap
  // Higher analytics = lower chance of mispricing
  const mispricingChance = Math.max(0.05, 0.4 - (avgAnalystSkill / 10) * 0.35);

  if (rng.next() < mispricingChance) {
    // IPO mispriced — firm takes a loss (25-75% of fee as penalty)
    const lossFraction = 0.25 + rng.next() * 0.5;
    const loss = baseFee * lossFraction;
    return Math.round(
      (baseFee - loss * 2) * moraleMultiplier,
    ); // Can be negative
  }

  // Reputation bonus for successful IPOs
  const reputationBonus = 1 + (state.company.reputation / 100) * 0.2;

  return Math.round(baseFee * reputationBonus * moraleMultiplier);
}

// ── Proprietary Trading ──
// firmCapitalAllocated * returnRate
// returnRate from quant/trader skill + market conditions. Can be negative!
function calcPropTrading(
  state: GameState,
  stream: ActiveRevenueStream,
  rng: RNG,
  moraleMultiplier: number,
): number {
  const traders = getEmployeesByRole(state, 'trader');
  const quants = getEmployeesByRole(state, 'quant');
  const avgTraderRisk = getAverageStat(traders, 'riskManagement');
  const avgQuantSkill = getAverageStat(quants, 'quantSkill');

  // Capital allocated: based on cash and stream level
  const firmCapitalAllocated = Math.min(
    state.company.cash * 0.3,
    (stream.level + 1) * 200000,
  );

  if (firmCapitalAllocated <= 0) return 0;

  // Skill-based expected return: higher skill = higher alpha
  const skillAlpha = ((avgTraderRisk + avgQuantSkill) / 20) * 0.03; // up to 3% monthly

  // Market regime contribution
  const regimeReturn =
    state.market.globalRegime === 'bull'
      ? 0.02
      : state.market.globalRegime === 'bear'
        ? -0.025
        : 0.005;

  // Random component (significant — prop trading is volatile)
  const randomReturn = rng.nextGaussian() * 0.04;

  const returnRate = skillAlpha + regimeReturn + randomReturn;

  const revenue = firmCapitalAllocated * returnRate * moraleMultiplier;
  return Math.round(revenue); // CAN be negative!
}

// ── Insurance ──
// premiumsCollected - claimsPaid
// Claims spike during negative events. Premiums scale with client count.
function calcInsurance(
  state: GameState,
  stream: ActiveRevenueStream,
  rng: RNG,
  moraleMultiplier: number,
): number {
  const quants = getEmployeesByRole(state, 'quant');
  const complianceOfficers = getEmployeesByRole(state, 'compliance');
  const avgQuantSkill = getAverageStat(quants, 'quantSkill');
  const avgComplianceSkill = getAverageStat(
    complianceOfficers,
    'riskManagement',
  );

  // Client count for insurance (driven by reputation and existing clients)
  const clientCount =
    stream.clientCount ??
    Math.floor(50 + state.company.reputation * 2 + stream.level * 20);

  // Premium per client: $500-$2,000/month based on pricing skill
  const premiumPerClient = 500 + avgQuantSkill * 100 + stream.level * 100;
  const premiumsCollected = clientCount * premiumPerClient;

  // Base claims ratio: 60-80% of premiums
  let claimsRatio = 0.7 - (avgComplianceSkill / 10) * 0.1; // Better compliance = lower claims

  // Claims spike during active negative events
  const hasNegativeEvent = state.events.active.some((e) => !e.resolved);
  if (hasNegativeEvent) {
    claimsRatio += 0.15;
  }

  // Bear market increases claims
  if (state.market.globalRegime === 'bear') {
    claimsRatio += 0.1;
  }

  // Random claims variance
  claimsRatio += rng.nextGaussian() * 0.05;
  claimsRatio = clamp(claimsRatio, 0.4, 1.2);

  const claimsPaid = premiumsCollected * claimsRatio;

  const revenue = (premiumsCollected - claimsPaid) * moraleMultiplier;
  return Math.round(revenue); // Can be negative if claims spike
}

// ─── Main Tick Function ─────────────────────────────────────────────────

/**
 * Calculate revenue for all active streams. Intended to run monthly
 * (every 30 ticks / DAYS_PER_MONTH).
 *
 * Returns revenue broken down by stream and a total.
 */
export function tickRevenue(
  state: GameState,
  rng: RNG,
): { revenueByStream: Record<string, number>; totalRevenue: number } {
  const revenueByStream: Record<string, number> = {};
  let totalRevenue = 0;

  // Check and auto-unlock streams whose requirements are now met
  for (const def of REVENUE_STREAM_DEFINITIONS) {
    const stream = state.revenueStreams[def.id];
    if (stream && !stream.unlocked && checkUnlockRequirements(def, state)) {
      stream.unlocked = true;
    }
  }

  // Calculate revenue for each active stream
  for (const streamId of Object.keys(state.revenueStreams) as RevenueStreamId[]) {
    const stream = state.revenueStreams[streamId];
    if (!stream || !stream.unlocked || !stream.active) {
      revenueByStream[streamId] = 0;
      continue;
    }

    const revenue = calculateStreamRevenue(streamId, state, rng);
    revenueByStream[streamId] = revenue;
    totalRevenue += revenue;

    // Update stream performance tracking
    stream.performance = revenue;
  }

  return { revenueByStream, totalRevenue };
}
