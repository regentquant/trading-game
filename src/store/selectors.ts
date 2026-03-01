// Derived value selectors for the Zustand store

import type { GameState } from '../types/index.ts';
import { calculatePortfolioValue } from '../engine/revenue/portfolioManager.ts';
import { calculateDepartmentOutput } from '../engine/employees/departmentManager.ts';

/**
 * Net worth = cash + portfolio market value + a portion of AUM from
 * asset management revenue stream.
 */
export function selectNetWorth(state: GameState): number {
  const portfolioValue = calculatePortfolioValue(
    state.portfolio,
    state.market.assets,
  );

  // AUM portion: if asset_management stream has AUM, count 2% of it
  // as the firm's "management value"
  let aumPortion = 0;
  const assetMgmt = state.revenueStreams.asset_management;
  if (assetMgmt?.active && assetMgmt.aum) {
    aumPortion = assetMgmt.aum * 0.02; // management fee as value proxy
  }

  return state.company.cash + portfolioValue + aumPortion;
}

/**
 * Monthly P&L from the latest financial report.
 * Returns 0 if no reports exist.
 */
export function selectMonthlyPnL(state: GameState): number {
  const history = state.company.financialHistory;
  if (history.length === 0) return 0;
  const latest = history[history.length - 1];
  return latest.revenue - latest.expenses;
}

/**
 * Current total market value of the portfolio.
 */
export function selectPortfolioValue(state: GameState): number {
  return calculatePortfolioValue(state.portfolio, state.market.assets);
}

/**
 * Total number of employees currently employed.
 */
export function selectTotalEmployees(state: GameState): number {
  return Object.keys(state.employees).length;
}

/**
 * Number of revenue streams currently active and unlocked.
 */
export function selectActiveStreamCount(state: GameState): number {
  let count = 0;
  for (const stream of Object.values(state.revenueStreams)) {
    if (stream.unlocked && stream.active) count += 1;
  }
  return count;
}

/**
 * Returns a selector function for a specific department's efficiency
 * (output score from calculateDepartmentOutput).
 */
export function selectDepartmentEfficiency(deptId: string) {
  return (state: GameState): number => {
    const dept = state.departments[deptId];
    if (!dept) return 0;
    return calculateDepartmentOutput(dept, state.employees);
  };
}
