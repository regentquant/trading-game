import type {
  Employee,
  EmployeeLevel,
  EmployeeRole,
  EmployeeStats,
  GameState,
  HiringPool,
  PersonalityTrait,
} from '../../types';
import { CONFIG } from '../../data/config';
import { NAME_POOL, type RNG } from '../../data/employees';

// ─── Constants ──────────────────────────────────────────────────────────

/** Base stat ranges per level: [min, max] (inclusive). */
const LEVEL_STAT_RANGE: Record<EmployeeLevel, [number, number]> = {
  analyst_level: [2, 4],
  associate: [3, 6],
  vp: [5, 7],
  director: [6, 8],
  managing_director: [7, 10],
};

/** The primary stat(s) for each role that receive a +2 bonus. */
const ROLE_PRIMARY_STAT: Record<EmployeeRole, (keyof EmployeeStats)[]> = {
  trader: ['riskManagement'],
  analyst: ['analytics'],
  broker: ['salesmanship'],
  investment_banker: ['salesmanship'],
  fund_manager: ['riskManagement'],
  quant: ['quantSkill'],
  compliance: ['riskManagement'],
  support: ['salesmanship'],
};

const ALL_TRAITS: PersonalityTrait[] = [
  'risk_taker',
  'conservative',
  'networker',
  'workaholic',
  'quant_mind',
  'silver_tongue',
  'burnout_prone',
  'mentor',
];

/** Weighted probabilities for trait selection. workaholic and burnout_prone are rarer. */
const TRAIT_WEIGHTS: Record<PersonalityTrait, number> = {
  risk_taker: 10,
  conservative: 10,
  networker: 10,
  workaholic: 4,
  quant_mind: 10,
  silver_tongue: 10,
  burnout_prone: 4,
  mentor: 10,
};

const ALL_ROLES: EmployeeRole[] = [
  'trader',
  'analyst',
  'broker',
  'investment_banker',
  'fund_manager',
  'quant',
  'compliance',
  'support',
];

const LEVEL_ORDER: EmployeeLevel[] = [
  'analyst_level',
  'associate',
  'vp',
  'director',
  'managing_director',
];

/** Days between hiring-pool refreshes. */
const HIRING_POOL_REFRESH_INTERVAL = 30;

// ─── Helpers ────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

function pickRandom<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng.next() * arr.length)];
}

/** Weighted random selection from a pool, removing the picked item from `available`. */
function pickWeightedTrait(rng: RNG, available: PersonalityTrait[]): PersonalityTrait {
  const totalWeight = available.reduce((sum, t) => sum + TRAIT_WEIGHTS[t], 0);
  let roll = rng.next() * totalWeight;
  for (const trait of available) {
    roll -= TRAIT_WEIGHTS[trait];
    if (roll <= 0) return trait;
  }
  // Fallback (should never happen due to float precision)
  return available[available.length - 1];
}

function makeId(rng: RNG): string {
  return `emp_${Date.now()}_${Math.floor(rng.next() * 100000)}`;
}

// ─── Public API ─────────────────────────────────────────────────────────

/**
 * Generate an employee with stats, traits, and salary appropriate
 * for their role and level.
 *
 * Stat generation:
 *   base = random in LEVEL_STAT_RANGE, then +2 for primary stat(s), +-1 random variation.
 *
 * Traits:
 *   2 random traits (3 for director+), no duplicates, with weighted probabilities.
 *
 * Salary:
 *   CONFIG.SALARY_BY_LEVEL[level] * (0.9 + rng.next() * 0.2)
 */
export function generateEmployee(
  role: EmployeeRole,
  level: EmployeeLevel,
  rng: RNG,
): Employee {
  const [statMin, statMax] = LEVEL_STAT_RANGE[level];
  const primaryStats = ROLE_PRIMARY_STAT[role];

  // Generate each stat: base + role bonus + random variation
  const makeStat = (statKey: keyof EmployeeStats): number => {
    const base = randomInt(rng, statMin, statMax);
    const roleBonus = primaryStats.includes(statKey) ? 2 : 0;
    const variation = randomInt(rng, -1, 1);
    return clamp(base + roleBonus + variation, 1, 10);
  };

  const stats: EmployeeStats = {
    analytics: makeStat('analytics'),
    salesmanship: makeStat('salesmanship'),
    riskManagement: makeStat('riskManagement'),
    quantSkill: makeStat('quantSkill'),
    leadership: makeStat('leadership'),
  };

  // Traits: 2 normally, 3 for director+
  const levelIdx = LEVEL_ORDER.indexOf(level);
  const traitCount = levelIdx >= 3 ? 3 : 2; // director(3) or managing_director(4)
  const availableTraits = [...ALL_TRAITS];
  const traits: PersonalityTrait[] = [];
  for (let i = 0; i < traitCount && availableTraits.length > 0; i++) {
    const picked = pickWeightedTrait(rng, availableTraits);
    traits.push(picked);
    availableTraits.splice(availableTraits.indexOf(picked), 1);
  }

  // Salary with slight randomness
  const baseSalary = CONFIG.SALARY_BY_LEVEL[level];
  const salary = Math.round(baseSalary * (0.9 + rng.next() * 0.2));

  // Morale: 70 + rng.next() * 30
  const morale = Math.round(70 + rng.next() * 30);

  return {
    id: makeId(rng),
    name: pickRandom(rng, NAME_POOL),
    role,
    level,
    stats,
    traits,
    salary,
    morale,
    burnout: 0,
    experience: 0,
    hiredOnDay: 0,
    departmentId: '',
  };
}

/**
 * Refresh (or create) the hiring pool based on company state.
 *
 * - Campus: 5 analyst_level employees across random roles
 * - Job Market: 8 employees, mix of analyst_level to vp
 * - Headhunter: 3 employees, vp to managing_director
 *   (only if company has headhunter upgrade OR reputation >= 40)
 *
 * Refresh every 30 game days.
 */
export function refreshHiringPool(state: GameState, rng: RNG): HiringPool {
  // Campus: 5 analyst-level
  const campus: Employee[] = [];
  for (let i = 0; i < 5; i++) {
    const role = pickRandom(rng, ALL_ROLES);
    const emp = generateEmployee(role, 'analyst_level', rng);
    emp.hiredOnDay = state.time.day;
    campus.push(emp);
  }

  // Job Market: 8 employees, analyst_level to vp
  const jobMarketLevels: EmployeeLevel[] = ['analyst_level', 'associate', 'vp'];
  const jobMarket: Employee[] = [];
  for (let i = 0; i < 8; i++) {
    const role = pickRandom(rng, ALL_ROLES);
    const level = pickRandom(rng, jobMarketLevels);
    const emp = generateEmployee(role, level, rng);
    emp.hiredOnDay = state.time.day;
    jobMarket.push(emp);
  }

  // Headhunter: 3 employees, vp to managing_director
  // Only available if company has headhunter upgrade or reputation >= 40
  const hasHeadhunter =
    (state.upgrades['headhunter'] && state.upgrades['headhunter'].purchased) ||
    state.company.reputation >= 40;

  const headhunter: Employee[] = [];
  if (hasHeadhunter) {
    const headhunterLevels: EmployeeLevel[] = ['vp', 'director', 'managing_director'];
    for (let i = 0; i < 3; i++) {
      const role = pickRandom(rng, ALL_ROLES);
      const level = pickRandom(rng, headhunterLevels);
      const emp = generateEmployee(role, level, rng);
      emp.hiredOnDay = state.time.day;
      headhunter.push(emp);
    }
  }

  return { campus, jobMarket, headhunter };
}

/**
 * Check whether the hiring pool should be refreshed this tick.
 * Returns true if current day is a multiple of the refresh interval
 * or if the pool is completely empty.
 */
export function shouldRefreshHiringPool(state: GameState): boolean {
  const isEmpty =
    state.hiringPool.campus.length === 0 &&
    state.hiringPool.jobMarket.length === 0 &&
    state.hiringPool.headhunter.length === 0;

  return isEmpty || state.time.day % HIRING_POOL_REFRESH_INTERVAL === 0;
}
