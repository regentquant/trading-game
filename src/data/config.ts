export const CONFIG = {
  TICKS_PER_SECOND: { 1: 0.5, 2: 1, 5: 2.5 } as Record<number, number>,
  MAX_TICKS_PER_FRAME: 10,
  DAYS_PER_MONTH: 30,
  AUTOSAVE_INTERVAL_SECONDS: 60,
  MAX_PRICE_HISTORY: 365,
  MAX_MONTHLY_HISTORY: 60,
  MAX_TRADE_HISTORY: 200,
  MAX_FINANCIAL_HISTORY: 24,

  // Market
  REGIME_DURATION: {
    bull: { min: 40, max: 100 },
    bear: { min: 20, max: 60 },
    sideways: { min: 30, max: 80 },
  },
  REGIME_TRANSITION: {
    bull: { bull: 0.6, bear: 0.15, sideways: 0.25 },
    bear: { bull: 0.2, bear: 0.5, sideways: 0.3 },
    sideways: { bull: 0.35, bear: 0.25, sideways: 0.4 },
  },
  GARCH: {
    large_cap: { omega: 0.000002, alpha: 0.1, beta: 0.85 },
    small_cap: { omega: 0.000005, alpha: 0.12, beta: 0.83 },
    crypto: { omega: 0.00001, alpha: 0.15, beta: 0.8 },
    commodity: { omega: 0.000003, alpha: 0.08, beta: 0.87 },
    real_estate: { omega: 0.000001, alpha: 0.05, beta: 0.9 },
    bond: { omega: 0.0000005, alpha: 0.05, beta: 0.9 },
  },

  // Employees
  SALARY_BY_LEVEL: {
    analyst_level: 5000,
    associate: 8000,
    vp: 12000,
    director: 18000,
    managing_director: 30000,
  },
  XP_TO_LEVEL: {
    analyst_level: 100,
    associate: 250,
    vp: 500,
    director: 1000,
    managing_director: Infinity,
  },
  MAX_BURNOUT: 100,
  BURNOUT_QUIT_THRESHOLD: 90,
  BASE_BURNOUT_RATE: 0.5,
  MORALE_DECAY_RATE: 0.1,

  // Company
  STARTING_CASH: 500000,
  OFFICE_COSTS: [5000, 12000, 25000, 50000, 100000],
  OFFICE_MAX_EMPLOYEES: [10, 25, 50, 100, 250],
  OFFICE_UPGRADE_COSTS: [50000, 150000, 400000, 1000000],
  LOAN_INTEREST_RATE: 0.08,
  BANKRUPTCY_MONTHS: 3,

  // Revenue
  BROKERAGE_COMMISSION_RATE: 0.005,
  ASSET_MGMT_FEE: 0.02,
  ASSET_MGMT_PERFORMANCE_FEE: 0.2,
  MARKET_MAKING_SPREAD: 0.002,
} as const;
