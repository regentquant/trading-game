// ===== TIME & META =====
export interface GameMeta {
  saveVersion: number;
  totalPlayTime: number;
  saveTimestamp: number;
}

export interface GameTime {
  day: number;
  speed: 0 | 1 | 2 | 5;
  tickCount: number;
  isPaused: boolean;
}

// ===== MARKET =====
export type AssetClass =
  | 'large_cap'
  | 'small_cap'
  | 'crypto'
  | 'commodity'
  | 'real_estate'
  | 'bond';

export type MarketRegime = 'bull' | 'bear' | 'sideways';

export type StorytellerMode = 'steady_growth' | 'calm_markets' | 'volatile';

export interface AssetDefinition {
  id: string;
  name: string;
  ticker: string;
  class: AssetClass;
  sector: string;
  basePrice: number;
  annualDrift: number;
  annualVolatility: number;
  meanReversionSpeed: number;
  meanReversionLevel: number;
  jumpFrequency: number;
  jumpMeanSize: number;
  description: string;
}

export interface AssetState {
  id: string;
  price: number;
  previousPrice: number;
  priceHistory: number[];
  monthlyHistory: number[];
  volatility: number;
  regime: MarketRegime;
  activeShocks: PriceShock[];
}

export interface PriceShock {
  id: string;
  magnitude: number;
  initialMagnitude: number;
  decayRate: number;
  sourceEventId: string;
}

export interface MarketState {
  assets: Record<string, AssetState>;
  globalRegime: MarketRegime;
  regimeDaysRemaining: number;
  correlationMatrix: number[][];
  storytellerMode: StorytellerMode;
}

// ===== EVENTS =====
export type EventFamily =
  | 'macroeconomic'
  | 'regulatory'
  | 'geopolitical'
  | 'natural_disaster'
  | 'company_specific'
  | 'market_structure'
  | 'industry_disruption';

export type EventSeverity = 'minor' | 'moderate' | 'major' | 'catastrophic';

export interface GameEventTemplate {
  id: string;
  name: string;
  family: EventFamily;
  severity: EventSeverity;
  description: string;
  choices: EventChoice[];
  baseWeight: number;
  cooldownDays: number;
  affectedSectors: string[];
  affectedAssetClasses: AssetClass[];
  priceImpact: { min: number; max: number };
  chainEvents?: string[];
  requiresProgression?: number;
}

export interface EventChoice {
  label: string;
  description: string;
  effects: EventEffect[];
}

export interface EventEffect {
  type:
    | 'cash'
    | 'reputation'
    | 'employee_morale'
    | 'market_shock'
    | 'unlock'
    | 'client_change';
  target?: string;
  value: number;
  duration?: number;
}

export interface ActiveEvent {
  id: string;
  templateId: string;
  triggeredOnDay: number;
  choiceMade?: number;
  resolved: boolean;
  chainedFrom?: string;
}

// ===== EMPLOYEES =====
export type EmployeeRole =
  | 'trader'
  | 'analyst'
  | 'broker'
  | 'investment_banker'
  | 'fund_manager'
  | 'quant'
  | 'compliance'
  | 'support';

export type EmployeeLevel =
  | 'analyst_level'
  | 'associate'
  | 'vp'
  | 'director'
  | 'managing_director';

export type PersonalityTrait =
  | 'risk_taker'
  | 'conservative'
  | 'networker'
  | 'workaholic'
  | 'quant_mind'
  | 'silver_tongue'
  | 'burnout_prone'
  | 'mentor';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  level: EmployeeLevel;
  stats: EmployeeStats;
  traits: PersonalityTrait[];
  salary: number;
  morale: number;
  burnout: number;
  experience: number;
  hiredOnDay: number;
  departmentId: string;
}

export interface EmployeeStats {
  analytics: number;
  salesmanship: number;
  riskManagement: number;
  quantSkill: number;
  leadership: number;
}

export interface Department {
  id: string;
  name: string;
  employeeIds: string[];
  headId?: string;
  workIntensity: number;
}

export interface HiringPool {
  campus: Employee[];
  jobMarket: Employee[];
  headhunter: Employee[];
}

// ===== COMPANY =====
export interface Company {
  name: string;
  cash: number;
  reputation: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  totalLoans: number;
  loanInterestRate: number;
  officeLevel: number;
  financialHistory: MonthlyReport[];
  consecutiveNegativeCashMonths: number;
  gameOver: boolean;
}

export interface MonthlyReport {
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
  revenueByStream: Record<string, number>;
}

// ===== REVENUE STREAMS =====
export type RevenueStreamId =
  | 'brokerage'
  | 'consulting'
  | 'research'
  | 'asset_management'
  | 'market_making'
  | 'ma_advisory'
  | 'lending'
  | 'wealth_management'
  | 'real_estate_invest'
  | 'ipo_underwriting'
  | 'prop_trading'
  | 'insurance';

export interface RevenueStreamDefinition {
  id: RevenueStreamId;
  name: string;
  description: string;
  phase: 'early' | 'mid' | 'late';
  unlockRequirements: UnlockRequirement[];
  baseRevenue: number;
  riskLevel: number;
  requiredRoles: { role: EmployeeRole; minCount: number; minSkill: number }[];
}

export interface UnlockRequirement {
  type:
    | 'reputation'
    | 'cash'
    | 'employee_count'
    | 'employee_skill'
    | 'revenue_stream'
    | 'day';
  target?: string;
  value: number;
}

export interface ActiveRevenueStream {
  id: RevenueStreamId;
  unlocked: boolean;
  active: boolean;
  level: number;
  assignedEmployeeIds: string[];
  performance: number;
  clientCount?: number;
  aum?: number;
}

// ===== PORTFOLIO & TRADING =====
export interface Position {
  assetId: string;
  quantity: number;
  averageCost: number;
  openedOnDay: number;
}

export interface TradeOrder {
  id: string;
  assetId: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  executedOnDay: number;
}

export interface Portfolio {
  positions: Record<string, Position>;
  tradeHistory: TradeOrder[];
  totalInvested: number;
  totalRealized: number;
}

// ===== UPGRADES =====
export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  purchased: boolean;
  effects: Record<string, number>;
  requires?: string[];
}

// ===== STATISTICS =====
export interface GameStatistics {
  totalTradesMade: number;
  totalProfitEarned: number;
  totalLossIncurred: number;
  largestSingleTrade: number;
  employeesHired: number;
  employeesFired: number;
  eventsEncountered: number;
  bestMonthProfit: number;
  worstMonthLoss: number;
  achievements: string[];
}

// ===== UI STATE =====
export interface UIState {
  activeScreen: string;
  showEventPopup: boolean;
  selectedAssetId: string | null;
  selectedEmployeeId: string | null;
  tutorialSeen: Record<string, boolean>;
  crtEnabled: boolean;
  newGameModalShown: boolean;
}

// ===== ROOT STATE =====
export interface GameState {
  meta: GameMeta;
  time: GameTime;
  company: Company;
  market: MarketState;
  employees: Record<string, Employee>;
  departments: Record<string, Department>;
  hiringPool: HiringPool;
  revenueStreams: Record<RevenueStreamId, ActiveRevenueStream>;
  portfolio: Portfolio;
  events: {
    active: ActiveEvent[];
    history: ActiveEvent[];
    cooldowns: Record<string, number>;
  };
  upgrades: Record<string, Upgrade>;
  statistics: GameStatistics;
  ui: UIState;
}
