// Employee system (hiring, traits, departments, burnout)
export {
  generateEmployee,
  refreshHiringPool,
  shouldRefreshHiringPool,
} from './employeeGenerator';

export {
  calculateDepartmentOutput,
  tickEmployees,
} from './departmentManager';

export {
  calculateHiringCost,
  calculateFiringCost,
  canAffordHire,
} from './hiringCosts';

export type {
  HiringChannel,
  HiringCostBreakdown,
  FiringCostBreakdown,
} from './hiringCosts';
