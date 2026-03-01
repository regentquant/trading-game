import type { RevenueStreamDefinition } from '../types';

export const REVENUE_STREAM_DEFINITIONS: RevenueStreamDefinition[] = [
  // ===== EARLY GAME =====
  {
    id: 'brokerage',
    name: 'Brokerage',
    description: 'Earn commissions on every client trade executed through your platform. The bread and butter of any trading firm.',
    phase: 'early',
    unlockRequirements: [],
    baseRevenue: 500,
    riskLevel: 2,
    requiredRoles: [],
  },
  {
    id: 'consulting',
    name: 'Consulting',
    description: 'Provide project-based financial advisory services to businesses seeking strategic guidance.',
    phase: 'early',
    unlockRequirements: [
      { type: 'employee_count', value: 1 },
    ],
    baseRevenue: 800,
    riskLevel: 1,
    requiredRoles: [
      { role: 'analyst', minCount: 1, minSkill: 0 },
    ],
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Publish subscription-based market analytics and investment research reports.',
    phase: 'early',
    unlockRequirements: [
      { type: 'employee_count', value: 2 },
      { type: 'employee_skill', target: 'analytics', value: 4 },
    ],
    baseRevenue: 600,
    riskLevel: 1,
    requiredRoles: [
      { role: 'analyst', minCount: 2, minSkill: 4 },
    ],
  },

  // ===== MID GAME =====
  {
    id: 'asset_management',
    name: 'Asset Management',
    description: 'Manage client portfolios for a 2% annual management fee plus 20% performance fee on returns.',
    phase: 'mid',
    unlockRequirements: [
      { type: 'reputation', value: 30 },
      { type: 'cash', value: 100000 },
      { type: 'employee_count', value: 1 },
    ],
    baseRevenue: 2000,
    riskLevel: 5,
    requiredRoles: [
      { role: 'fund_manager', minCount: 1, minSkill: 0 },
    ],
  },
  {
    id: 'market_making',
    name: 'Market Making',
    description: 'Profit from the bid-ask spread by providing liquidity to the market. Requires quantitative expertise.',
    phase: 'mid',
    unlockRequirements: [
      { type: 'reputation', value: 35 },
      { type: 'employee_count', value: 2 },
      { type: 'employee_skill', target: 'quantSkill', value: 5 },
    ],
    baseRevenue: 3000,
    riskLevel: 7,
    requiredRoles: [
      { role: 'trader', minCount: 1, minSkill: 5 },
      { role: 'quant', minCount: 1, minSkill: 0 },
    ],
  },
  {
    id: 'ma_advisory',
    name: 'M&A Advisory',
    description: 'Advise corporations on mergers, acquisitions, and divestitures for substantial deal fees.',
    phase: 'mid',
    unlockRequirements: [
      { type: 'reputation', value: 40 },
      { type: 'employee_count', value: 2 },
    ],
    baseRevenue: 5000,
    riskLevel: 4,
    requiredRoles: [
      { role: 'investment_banker', minCount: 2, minSkill: 0 },
    ],
  },
  {
    id: 'lending',
    name: 'Lending',
    description: 'Extend loans to NPC businesses and individuals, earning interest income over time.',
    phase: 'mid',
    unlockRequirements: [
      { type: 'cash', value: 500000 },
      { type: 'reputation', value: 25 },
      { type: 'employee_count', value: 1 },
    ],
    baseRevenue: 1500,
    riskLevel: 6,
    requiredRoles: [
      { role: 'compliance', minCount: 1, minSkill: 0 },
    ],
  },
  {
    id: 'wealth_management',
    name: 'Wealth Management',
    description: 'Serve high-net-worth individuals with personalized investment and financial planning services.',
    phase: 'mid',
    unlockRequirements: [
      { type: 'reputation', value: 45 },
      { type: 'employee_count', value: 2 },
      { type: 'employee_skill', target: 'salesmanship', value: 6 },
    ],
    baseRevenue: 2500,
    riskLevel: 3,
    requiredRoles: [
      { role: 'broker', minCount: 2, minSkill: 6 },
    ],
  },
  {
    id: 'real_estate_invest',
    name: 'Real Estate Investing',
    description: 'Generate rental income and capital appreciation through direct real estate investments.',
    phase: 'mid',
    unlockRequirements: [
      { type: 'cash', value: 300000 },
      { type: 'employee_count', value: 1 },
    ],
    baseRevenue: 1800,
    riskLevel: 5,
    requiredRoles: [
      { role: 'analyst', minCount: 1, minSkill: 0 },
    ],
  },

  // ===== LATE GAME =====
  {
    id: 'ipo_underwriting',
    name: 'IPO Underwriting',
    description: 'Lead initial public offerings for private companies, earning substantial underwriting and placement fees.',
    phase: 'late',
    unlockRequirements: [
      { type: 'reputation', value: 60 },
      { type: 'employee_count', value: 3 },
      { type: 'employee_skill', target: 'salesmanship', value: 7 },
      { type: 'day', value: 180 },
    ],
    baseRevenue: 10000,
    riskLevel: 8,
    requiredRoles: [
      { role: 'investment_banker', minCount: 2, minSkill: 7 },
      { role: 'compliance', minCount: 1, minSkill: 0 },
    ],
  },
  {
    id: 'prop_trading',
    name: 'Proprietary Trading',
    description: 'Trade the firm\'s own capital using advanced quantitative strategies for direct profit.',
    phase: 'late',
    unlockRequirements: [
      { type: 'reputation', value: 50 },
      { type: 'cash', value: 1000000 },
      { type: 'employee_count', value: 3 },
      { type: 'employee_skill', target: 'quantSkill', value: 8 },
    ],
    baseRevenue: 8000,
    riskLevel: 10,
    requiredRoles: [
      { role: 'trader', minCount: 2, minSkill: 0 },
      { role: 'quant', minCount: 1, minSkill: 8 },
    ],
  },
  {
    id: 'insurance',
    name: 'Insurance',
    description: 'Underwrite and sell risk products including derivatives, credit default swaps, and structured products.',
    phase: 'late',
    unlockRequirements: [
      { type: 'reputation', value: 55 },
      { type: 'employee_count', value: 3 },
    ],
    baseRevenue: 4000,
    riskLevel: 7,
    requiredRoles: [
      { role: 'quant', minCount: 1, minSkill: 0 },
      { role: 'compliance', minCount: 1, minSkill: 0 },
      { role: 'analyst', minCount: 1, minSkill: 0 },
    ],
  },
];
