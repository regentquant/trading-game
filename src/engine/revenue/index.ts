// Revenue stream calculations & portfolio management

export {
  checkUnlockRequirements,
  calculateStreamRevenue,
  tickRevenue,
} from './revenueEngine.ts';

export {
  executeTrade,
  calculatePortfolioValue,
  calculateUnrealizedPnL,
  getPositionSummaries,
} from './portfolioManager.ts';

export type { PositionSummary } from './portfolioManager.ts';
