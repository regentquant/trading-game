import type {
  Department,
  Employee,
  EmployeeLevel,
  EmployeeStats,
  GameState,
  PersonalityTrait,
} from '../../types';
import type { RNG } from '../../utils/random';
import { CONFIG } from '../../data/config';
import { TRAIT_COMPATIBILITY, TRAIT_EFFECTS } from '../../data/employees';

// ─── Constants ──────────────────────────────────────────────────────────

const LEVEL_ORDER: EmployeeLevel[] = [
  'analyst_level',
  'associate',
  'vp',
  'director',
  'managing_director',
];

const STAT_KEYS: (keyof EmployeeStats)[] = [
  'analytics',
  'salesmanship',
  'riskManagement',
  'quantSkill',
  'leadership',
];

// ─── Helpers ────────────────────────────────────────────────────────────

/** Build a canonical trait-pair key (alphabetically sorted, joined by '|'). */
function traitPairKey(a: PersonalityTrait, b: PersonalityTrait): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Sum all stat values for an employee, applying trait stat effects. */
function effectiveStatSum(employee: Employee): number {
  let total = 0;
  for (const key of STAT_KEYS) {
    let value = employee.stats[key];
    // Apply trait stat modifiers
    for (const trait of employee.traits) {
      const fx = TRAIT_EFFECTS[trait];
      if (fx[key] !== undefined) {
        value += fx[key];
      }
    }
    total += Math.max(0, value);
  }
  return total;
}

/**
 * Compute the pairwise trait-compatibility multiplier across all employees
 * in the department. For every unique employee pair, we look up synergy
 * for each cross-trait combination and combine them multiplicatively.
 */
function traitCompatibilityMultiplier(employees: Employee[]): number {
  let multiplier = 1.0;

  for (let i = 0; i < employees.length; i++) {
    for (let j = i + 1; j < employees.length; j++) {
      const a = employees[i];
      const b = employees[j];
      for (const traitA of a.traits) {
        for (const traitB of b.traits) {
          const key = traitPairKey(traitA, traitB);
          const compat = TRAIT_COMPATIBILITY[key];
          if (compat !== undefined) {
            multiplier *= compat;
          }
        }
      }
    }
  }

  return multiplier;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Calculate the total output of a department based on employee stats,
 * trait compatibility, work intensity, and department head leadership.
 *
 * Formula:
 *   output = sumEffectiveStats
 *          * traitCompatibility
 *          * workIntensityFactor  (0.5 at 0% to 1.3 at 100%)
 *          * headBonus            (+15% if head has leadership >= 7)
 */
export function calculateDepartmentOutput(
  dept: Department,
  employees: Record<string, Employee>,
): number {
  const deptEmployees = dept.employeeIds
    .map((id) => employees[id])
    .filter((e): e is Employee => e !== undefined);

  if (deptEmployees.length === 0) return 0;

  // 1. Sum effective stats
  let totalStats = 0;
  for (const emp of deptEmployees) {
    totalStats += effectiveStatSum(emp);
  }

  // 2. Trait compatibility multiplier
  const compatMultiplier = traitCompatibilityMultiplier(deptEmployees);

  // 3. Work intensity factor: 0.5 + (workIntensity / 100) * 0.8
  const workFactor = 0.5 + (dept.workIntensity / 100) * 0.8;

  // 4. Head bonus: +15% if department head has leadership >= 7
  let headBonus = 1.0;
  if (dept.headId) {
    const head = employees[dept.headId];
    if (head && head.stats.leadership >= 7) {
      headBonus = 1.15;
    }
  }

  return totalStats * compatMultiplier * workFactor * headBonus;
}

/**
 * Process one day's worth of employee updates:
 *   - XP gain and level-ups
 *   - Burnout accumulation
 *   - Morale changes
 *   - Employee quits (burnout >= threshold)
 *
 * Returns a partial GameState with updated employees, departments, and statistics.
 */
export function tickEmployees(state: GameState, rng?: RNG): Partial<GameState> {
  const employees = { ...state.employees };
  const departments = { ...state.departments };
  const statistics = { ...state.statistics };
  const quitEvents: string[] = [];

  for (const empId of Object.keys(employees)) {
    let emp = { ...employees[empId] };
    const dept = emp.departmentId ? departments[emp.departmentId] : undefined;
    const workIntensity = dept ? dept.workIntensity : 50; // default 50 if unassigned

    // ── XP gain ──
    const xpGain = 1 + workIntensity / 50;
    emp.experience += xpGain;

    // ── Level up ──
    const xpThreshold = CONFIG.XP_TO_LEVEL[emp.level];
    if (emp.experience >= xpThreshold && xpThreshold !== Infinity) {
      const currentIdx = LEVEL_ORDER.indexOf(emp.level);
      if (currentIdx < LEVEL_ORDER.length - 1) {
        const newLevel = LEVEL_ORDER[currentIdx + 1];
        emp.level = newLevel;
        emp.experience = 0;
        emp.salary = CONFIG.SALARY_BY_LEVEL[newLevel];

        // Increase 2 random stats by 1 (Fisher-Yates shuffle with seeded RNG)
        const shuffled = [...STAT_KEYS];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor((rng ? rng.next() : Math.random()) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const stat1 = shuffled[0];
        const stat2 = shuffled[1];
        emp.stats = { ...emp.stats };
        emp.stats[stat1] = Math.min(10, emp.stats[stat1] + 1);
        emp.stats[stat2] = Math.min(10, emp.stats[stat2] + 1);
      }
    }

    // ── Burnout ──
    const burnoutTraitMultiplier = emp.traits.includes('burnout_prone') ? 1.5 : 1.0;
    const workaholicReduction = emp.traits.includes('workaholic') ? 0.8 : 1.0;
    const burnoutDelta =
      CONFIG.BASE_BURNOUT_RATE *
        (workIntensity / 50) *
        burnoutTraitMultiplier *
        workaholicReduction -
      emp.morale / 200;
    emp.burnout = Math.max(0, Math.min(CONFIG.MAX_BURNOUT, emp.burnout + burnoutDelta));

    // ── Morale ──
    // Slowly decays, boosted by high company cash and low burnout, reduced by overwork
    let moraleDelta = -CONFIG.MORALE_DECAY_RATE;

    // Cash boost: if company cash > 1M, small morale uplift
    if (state.company.cash > 1_000_000) {
      moraleDelta += 0.05;
    } else if (state.company.cash > 500_000) {
      moraleDelta += 0.02;
    }

    // Burnout penalty on morale
    if (emp.burnout > 60) {
      moraleDelta -= 0.15;
    } else if (emp.burnout > 30) {
      moraleDelta -= 0.05;
    }

    // Overwork penalty
    if (workIntensity > 80) {
      moraleDelta -= 0.1;
    }

    emp.morale = Math.max(0, Math.min(100, emp.morale + moraleDelta));

    // ── Quit check ──
    if (emp.burnout >= CONFIG.BURNOUT_QUIT_THRESHOLD) {
      quitEvents.push(emp.id);
      statistics.employeesFired += 1; // counted as attrition in stats
      delete employees[empId];
      continue;
    }

    employees[empId] = emp;
  }

  // Remove quitting employees from departments
  if (quitEvents.length > 0) {
    for (const deptId of Object.keys(departments)) {
      const dept = { ...departments[deptId] };
      const before = dept.employeeIds.length;
      dept.employeeIds = dept.employeeIds.filter((id) => !quitEvents.includes(id));
      if (dept.headId && quitEvents.includes(dept.headId)) {
        dept.headId = undefined;
      }
      if (dept.employeeIds.length !== before) {
        departments[deptId] = dept;
      }
    }
  }

  const result: Partial<GameState> = { employees, statistics };
  // Only return departments when employees quit — avoids unnecessary state replacement
  if (quitEvents.length > 0) {
    result.departments = departments;
  }
  return result;
}
