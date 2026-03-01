import type {
  Employee,
  EmployeeLevel,
  EmployeeRole,
  EmployeeStats,
  PersonalityTrait,
} from '../types';

/** Stat modifiers applied when an employee has a given trait. */
export const TRAIT_EFFECTS: Record<PersonalityTrait, Partial<EmployeeStats>> = {
  risk_taker: { riskManagement: -1, salesmanship: 1 },
  conservative: { riskManagement: 2, salesmanship: -1 },
  networker: { salesmanship: 2, leadership: 1 },
  workaholic: { analytics: 1, quantSkill: 1 },
  quant_mind: { quantSkill: 2, analytics: 1 },
  silver_tongue: { salesmanship: 2, leadership: 1 },
  burnout_prone: { analytics: 1, riskManagement: -1 },
  mentor: { leadership: 2, analytics: 1 },
};

/**
 * Pair-wise synergy multipliers between traits.
 * Key format: alphabetically sorted trait pair joined by '|'.
 * Values above 1.0 indicate positive synergy, below 1.0 indicate friction.
 */
export const TRAIT_COMPATIBILITY: Record<string, number> = {
  // All keys are alphabetically sorted trait pairs joined by '|'
  'burnout_prone|conservative': 0.9,
  'burnout_prone|mentor': 1.1,
  'burnout_prone|networker': 0.85,
  'burnout_prone|quant_mind': 0.95,
  'burnout_prone|risk_taker': 0.8,
  'burnout_prone|silver_tongue': 0.9,
  'burnout_prone|workaholic': 0.85,
  'conservative|mentor': 1.05,
  'conservative|networker': 1.0,
  'conservative|quant_mind': 1.1,
  'conservative|risk_taker': 0.8,
  'conservative|silver_tongue': 0.95,
  'conservative|workaholic': 1.05,
  'mentor|networker': 1.15,
  'mentor|quant_mind': 1.15,
  'mentor|risk_taker': 1.0,
  'mentor|silver_tongue': 1.1,
  'mentor|workaholic': 1.2,
  'networker|quant_mind': 1.0,
  'networker|risk_taker': 1.1,
  'networker|silver_tongue': 1.3,
  'networker|workaholic': 0.9,
  'quant_mind|risk_taker': 1.05,
  'quant_mind|silver_tongue': 0.95,
  'quant_mind|workaholic': 1.25,
  'risk_taker|silver_tongue': 1.15,
  'risk_taker|workaholic': 1.05,
  'silver_tongue|workaholic': 0.95,
};

/** 50 realistic first+last name combos for procedural employee generation. */
export const NAME_POOL: string[] = [
  'James Chen',
  'Sarah Mitchell',
  'Michael O\'Brien',
  'Emily Zhang',
  'David Nakamura',
  'Jessica Torres',
  'Robert Kim',
  'Amanda Patel',
  'Christopher Lee',
  'Lauren Anderson',
  'William Hayes',
  'Rachel Goldman',
  'Daniel Park',
  'Stephanie Russo',
  'Thomas Wright',
  'Maria Gonzalez',
  'Andrew Blackwell',
  'Nicole Yamamoto',
  'Jonathan Rivera',
  'Katherine Novak',
  'Marcus Thompson',
  'Elena Petrova',
  'Brandon Walker',
  'Samantha Collins',
  'Kevin Morales',
  'Olivia Hartman',
  'Ryan Fitzgerald',
  'Natalie Larsson',
  'Patrick O\'Connor',
  'Diana Kovacs',
  'Alexander Volkov',
  'Catherine Dubois',
  'Vincent Caruso',
  'Hannah Bergstrom',
  'Joshua Reeves',
  'Sophia Tanaka',
  'Eric Johansson',
  'Megan Sullivan',
  'Nathan Abrams',
  'Victoria Sinclair',
  'Gregory Huang',
  'Lisa Fernandez',
  'Tyler Ashworth',
  'Rebecca Strauss',
  'Derek Morimoto',
  'Allison Crawford',
  'Sean Fitzpatrick',
  'Priya Sharma',
  'Adam Kowalski',
  'Caroline Bishop',
];

/** Simple seeded-ish RNG interface expected by the generator. */
export interface RNG {
  /** Returns a float in [0, 1). */
  next(): number;
}

/**
 * Base stat ranges by role.
 * Each role has a "primary" stat that gets boosted.
 */
const ROLE_STAT_BIAS: Record<EmployeeRole, Partial<EmployeeStats>> = {
  trader: { riskManagement: 2, salesmanship: 1 },
  analyst: { analytics: 3 },
  broker: { salesmanship: 3 },
  investment_banker: { salesmanship: 2, leadership: 1 },
  fund_manager: { analytics: 1, riskManagement: 1, leadership: 1 },
  quant: { quantSkill: 3, analytics: 1 },
  compliance: { riskManagement: 2, analytics: 1 },
  support: { salesmanship: 1 },
};

const LEVEL_STAT_BONUS: Record<EmployeeLevel, number> = {
  analyst_level: 0,
  associate: 1,
  vp: 2,
  director: 3,
  managing_director: 4,
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

function clampStat(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function randomInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

function pickRandom<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng.next() * arr.length)];
}

/**
 * Generate a random employee with stats appropriate for their role and level.
 * The `rng` parameter should be a seeded RNG for reproducibility.
 */
export function generateRandomEmployee(
  role: EmployeeRole,
  level: EmployeeLevel,
  rng: RNG,
): Employee {
  const levelBonus = LEVEL_STAT_BONUS[level];
  const roleBias = ROLE_STAT_BIAS[role];

  const baseStat = (): number => randomInt(rng, 2, 5) + levelBonus;

  const stats: EmployeeStats = {
    analytics: clampStat(baseStat() + (roleBias.analytics ?? 0)),
    salesmanship: clampStat(baseStat() + (roleBias.salesmanship ?? 0)),
    riskManagement: clampStat(baseStat() + (roleBias.riskManagement ?? 0)),
    quantSkill: clampStat(baseStat() + (roleBias.quantSkill ?? 0)),
    leadership: clampStat(baseStat() + (roleBias.leadership ?? 0)),
  };

  // Pick 1-2 personality traits (no duplicates)
  const traitCount = randomInt(rng, 1, 2);
  const traits: PersonalityTrait[] = [];
  const available = [...ALL_TRAITS];
  for (let i = 0; i < traitCount && available.length > 0; i++) {
    const idx = Math.floor(rng.next() * available.length);
    traits.push(available[idx]);
    available.splice(idx, 1);
  }

  const name = pickRandom(rng, NAME_POOL);

  const SALARY_BY_LEVEL: Record<EmployeeLevel, number> = {
    analyst_level: 5000,
    associate: 8000,
    vp: 12000,
    director: 18000,
    managing_director: 30000,
  };

  // Add some salary variance (+/- 15%)
  const baseSalary = SALARY_BY_LEVEL[level];
  const salaryVariance = 1 + (rng.next() * 0.3 - 0.15);
  const salary = Math.round(baseSalary * salaryVariance);

  return {
    id: `emp_${Date.now()}_${Math.floor(rng.next() * 100000)}`,
    name,
    role,
    level,
    stats,
    traits,
    salary,
    morale: randomInt(rng, 60, 85),
    burnout: randomInt(rng, 0, 15),
    experience: 0,
    hiredOnDay: 0,
    departmentId: '',
  };
}
