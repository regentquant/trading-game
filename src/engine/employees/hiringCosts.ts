import type { Employee } from '../../types';

// ─── Types ──────────────────────────────────────────────────────────────

export type HiringChannel = 'campus' | 'job_market' | 'headhunter' | 'poach';

export interface HiringCostBreakdown {
  signingBonus: number;
  headhunterFee: number;
  reputationCost: number;
  total: number;
}

export interface FiringCostBreakdown {
  severance: number;
  total: number;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Calculate the full hiring cost for an employee based on the channel.
 *
 * - Campus:      1x salary signing bonus
 * - Job market:  2x salary signing bonus
 * - Headhunter:  5x salary signing bonus + 20% of first year salary (12 * monthly)
 * - Poach:       8x salary signing bonus + reputation hit of 2 points
 */
export function calculateHiringCost(
  employee: Employee,
  channel: HiringChannel,
): HiringCostBreakdown {
  const salary = employee.salary;

  switch (channel) {
    case 'campus':
      return {
        signingBonus: salary * 1,
        headhunterFee: 0,
        reputationCost: 0,
        total: salary * 1,
      };

    case 'job_market':
      return {
        signingBonus: salary * 2,
        headhunterFee: 0,
        reputationCost: 0,
        total: salary * 2,
      };

    case 'headhunter': {
      const signingBonus = salary * 5;
      const headhunterFee = salary * 12 * 0.2;
      return {
        signingBonus,
        headhunterFee,
        reputationCost: 0,
        total: signingBonus + headhunterFee,
      };
    }

    case 'poach': {
      const signingBonus = salary * 8;
      return {
        signingBonus,
        headhunterFee: 0,
        reputationCost: 2,
        total: signingBonus,
      };
    }
  }
}

/**
 * Calculate the cost of firing an employee.
 *
 * Firing cost: 3x monthly salary severance.
 */
export function calculateFiringCost(employee: Employee): FiringCostBreakdown {
  const severance = employee.salary * 3;
  return {
    severance,
    total: severance,
  };
}

/**
 * Convenience: check whether the company can afford to hire an employee
 * through a given channel.
 */
export function canAffordHire(
  employee: Employee,
  channel: HiringChannel,
  companyCash: number,
): boolean {
  return companyCash >= calculateHiringCost(employee, channel).total;
}
