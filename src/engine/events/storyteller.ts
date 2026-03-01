// Storyteller AI — controls event frequency and severity curves
//
// Three modes:
// - Steady Growth (Cassandra): events scale with player success
// - Calm Markets (Phoebe): low frequency, catastrophic events 2x more likely
// - Volatile (Randy): high frequency, all severities equally weighted

import type {
  GameState,
  GameEventTemplate,
  StorytellerMode,
  EventSeverity,
} from '../../types/index.ts';
import type { RNG } from '../../utils/random.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';

// ────────────────────────────────────────────────────────────
// Storyteller configuration constants
// ────────────────────────────────────────────────────────────

interface StorytellerConfig {
  baseEventChance: number; // per day
  cooldownMultiplier: number; // multiply cooldowns
  severityWeights: Record<EventSeverity, number>;
  catastrophicMinDay: number; // earliest day for catastrophic events (0 = no restriction)
}

const STORYTELLER_CONFIGS: Record<StorytellerMode, StorytellerConfig> = {
  steady_growth: {
    baseEventChance: 0.018,
    cooldownMultiplier: 1.0,
    severityWeights: {
      minor: 1.0,
      moderate: 1.2,
      major: 0.8,
      catastrophic: 0.4,
    },
    catastrophicMinDay: 60,
  },
  calm_markets: {
    baseEventChance: 0.007,
    cooldownMultiplier: 1.0,
    severityWeights: {
      minor: 0.6,
      moderate: 0.8,
      major: 1.0,
      catastrophic: 2.0,
    },
    catastrophicMinDay: 0,
  },
  volatile: {
    baseEventChance: 0.035,
    cooldownMultiplier: 0.5,
    severityWeights: {
      minor: 1.0,
      moderate: 1.0,
      major: 1.0,
      catastrophic: 1.0,
    },
    catastrophicMinDay: 0,
  },
};

// ────────────────────────────────────────────────────────────
// shouldFireEvent — determine if an event triggers this tick
// ────────────────────────────────────────────────────────────

export function shouldFireEvent(state: GameState, rng: RNG): boolean {
  const mode = state.market.storytellerMode;
  const config = STORYTELLER_CONFIGS[mode];

  let chance = config.baseEventChance;

  // Steady Growth (Cassandra): scale chance with reputation
  if (mode === 'steady_growth') {
    chance *= 1 + state.company.reputation / 100;
  }

  return rng.next() < chance;
}

// ────────────────────────────────────────────────────────────
// selectEvent — weighted random selection from eligible pool
// ────────────────────────────────────────────────────────────

/**
 * Compute the set of sectors the player is concentrated in based on
 * portfolio positions and asset definitions.
 */
function getPlayerSectorExposure(state: GameState): Set<string> {
  const sectorValue: Record<string, number> = {};
  let totalValue = 0;

  const assetDefMap = new Map(ASSET_DEFINITIONS.map((d) => [d.id, d]));

  for (const [assetId, position] of Object.entries(state.portfolio.positions)) {
    if (position.quantity <= 0) continue;
    const assetState = state.market.assets[assetId];
    if (!assetState) continue;
    const def = assetDefMap.get(assetId);
    if (!def) continue;

    const value = position.quantity * assetState.price;
    sectorValue[def.sector] = (sectorValue[def.sector] ?? 0) + value;
    totalValue += value;
  }

  // A sector is "concentrated" if it represents >25% of total portfolio value
  const concentratedSectors = new Set<string>();
  if (totalValue > 0) {
    for (const [sector, value] of Object.entries(sectorValue)) {
      if (value / totalValue > 0.25) {
        concentratedSectors.add(sector);
      }
    }
  }

  return concentratedSectors;
}

/**
 * Check whether a template's cooldown has expired.
 */
function isCooldownExpired(
  template: GameEventTemplate,
  state: GameState,
  cooldownMultiplier: number,
): boolean {
  const lastFired = state.events.cooldowns[template.id];
  if (lastFired === undefined) return true;

  const effectiveCooldown = Math.floor(template.cooldownDays * cooldownMultiplier);
  return state.time.day - lastFired >= effectiveCooldown;
}

/**
 * Check whether the template's progression requirement is met.
 */
function isProgressionMet(template: GameEventTemplate, state: GameState): boolean {
  if (template.requiresProgression === undefined) return true;
  return state.time.day >= template.requiresProgression;
}

/**
 * Determine whether a given event family benefits from the current market regime.
 * Bull markets boost bubble/upward events; bear markets boost crash events.
 */
function getRegimeMultiplier(template: GameEventTemplate, regime: string): number {
  const avgImpact = (template.priceImpact.min + template.priceImpact.max) / 2;

  if (regime === 'bull') {
    // Bull markets boost bubble-type events (positive average impact)
    // and also boost crash events slightly (market excess leads to corrections)
    if (avgImpact > 0.03) return 1.4;
    if (avgImpact < -0.05) return 1.2; // crash events slightly more likely during euphoria
    return 1.0;
  }

  if (regime === 'bear') {
    // Bear markets boost crash/negative events
    if (avgImpact < -0.03) return 1.4;
    if (avgImpact > 0.05) return 1.2; // recovery events slightly more likely during fear
    return 1.0;
  }

  // Sideways: neutral
  return 1.0;
}

/**
 * Compute concentration bonus: +50% weight if event targets sectors
 * where the player is heavily invested.
 */
function getConcentrationMultiplier(
  template: GameEventTemplate,
  concentratedSectors: Set<string>,
): number {
  if (concentratedSectors.size === 0) return 1.0;

  for (const sector of template.affectedSectors) {
    if (concentratedSectors.has(sector)) {
      return 1.5;
    }
  }

  return 1.0;
}

export function selectEvent(
  state: GameState,
  templates: GameEventTemplate[],
  rng: RNG,
): GameEventTemplate | null {
  const mode = state.market.storytellerMode;
  const config = STORYTELLER_CONFIGS[mode];
  const concentratedSectors = getPlayerSectorExposure(state);

  // Step 1: Filter eligible templates
  const eligible: { template: GameEventTemplate; weight: number }[] = [];

  for (const template of templates) {
    // Skip templates with zero base weight
    if (template.baseWeight <= 0) continue;

    // Skip if cooldown hasn't expired
    if (!isCooldownExpired(template, state, config.cooldownMultiplier)) continue;

    // Skip if progression requirement not met
    if (!isProgressionMet(template, state)) continue;

    // Skip catastrophic events before the minimum day for this storyteller
    if (
      template.severity === 'catastrophic' &&
      config.catastrophicMinDay > 0 &&
      state.time.day < config.catastrophicMinDay
    ) {
      continue;
    }

    // Step 2: Compute modified weight
    let weight = template.baseWeight;

    // Apply storyteller severity curve
    weight *= config.severityWeights[template.severity];

    // Apply market regime multiplier
    weight *= getRegimeMultiplier(template, state.market.globalRegime);

    // Apply player portfolio concentration bonus
    weight *= getConcentrationMultiplier(template, concentratedSectors);

    if (weight > 0) {
      eligible.push({ template, weight });
    }
  }

  if (eligible.length === 0) return null;

  // Step 3: Weighted random selection
  const totalWeight = eligible.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng.next() * totalWeight;

  for (const entry of eligible) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.template;
    }
  }

  // Fallback (floating point edge case)
  return eligible[eligible.length - 1].template;
}
