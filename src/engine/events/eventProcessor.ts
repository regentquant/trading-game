// Event resolution — applies effects from player choices and rolls chain events

import type {
  GameState,
  ActiveEvent,
  AssetDefinition,
  AssetState,
  GameEventTemplate,
  EventEffect,
  PriceShock,
  EventSeverity,
  Employee,
  ActiveRevenueStream,
  RevenueStreamId,
  Upgrade,
} from '../../types/index.ts';
import type { RNG } from '../../utils/random.ts';
import { ASSET_DEFINITIONS } from '../../data/assets.ts';
import { clamp } from '../../utils/math.ts';

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

/** Shock decay rate per day (how quickly the shock fades). */
const DEFAULT_SHOCK_DECAY_RATE = 0.15;

/** Cross-asset correlation multipliers for market_shock propagation. */
const SAME_SECTOR_MAGNITUDE = 0.6;
const DIFFERENT_SECTOR_MAGNITUDE = 0.2;
const BOND_INVERSE_MAGNITUDE = 0.15;

/** Chain event base probability, modified by severity. */
const CHAIN_BASE_PROBABILITY = 0.30;
const CHAIN_SEVERITY_MODIFIERS: Record<EventSeverity, number> = {
  catastrophic: 0.60,
  major: 0.40,
  moderate: 0.25,
  minor: 0.10,
};

// ────────────────────────────────────────────────────────────
// processEventChoice — apply all effects from the chosen option
// ────────────────────────────────────────────────────────────

/**
 * Apply all effects from the player's chosen option for an active event.
 * Returns a partial GameState with the modified fields.
 */
export function processEventChoice(
  state: GameState,
  event: ActiveEvent,
  choiceIndex: number,
  templates: GameEventTemplate[],
): Partial<GameState> {
  const template = templates.find((t) => t.id === event.templateId);
  if (!template) return {};

  const choice = template.choices[choiceIndex];
  if (!choice) return {};

  // We accumulate all changes into a partial state
  let cash = state.company.cash;
  let reputation = state.company.reputation;
  const employees = { ...state.employees };
  const marketAssets = { ...state.market.assets };
  const revenueStreams = { ...state.revenueStreams };
  const upgrades = { ...state.upgrades };

  // Build lookup maps for assets
  const assetsBySector = new Map<string, string[]>();
  const assetsByClass = new Map<string, string[]>();
  for (const def of ASSET_DEFINITIONS) {
    // By sector
    const sectorList = assetsBySector.get(def.sector) ?? [];
    sectorList.push(def.id);
    assetsBySector.set(def.sector, sectorList);

    // By class
    const classList = assetsByClass.get(def.class) ?? [];
    classList.push(def.id);
    assetsByClass.set(def.class, classList);
  }

  const assetDefMap = new Map(ASSET_DEFINITIONS.map((d) => [d.id, d]));

  for (const effect of choice.effects) {
    switch (effect.type) {
      case 'cash': {
        cash += effect.value;
        break;
      }

      case 'reputation': {
        reputation = clamp(reputation + effect.value, 0, 100);
        break;
      }

      case 'employee_morale': {
        for (const empId of Object.keys(employees)) {
          const emp = employees[empId];
          employees[empId] = {
            ...emp,
            morale: clamp(emp.morale + effect.value, 0, 100),
          } as Employee;
        }
        break;
      }

      case 'market_shock': {
        applyMarketShock(
          effect,
          event.id,
          marketAssets,
          assetsBySector,
          assetsByClass,
          assetDefMap,
        );
        break;
      }

      case 'client_change': {
        applyClientChange(effect, revenueStreams);
        break;
      }

      case 'unlock': {
        applyUnlock(effect, revenueStreams, upgrades);
        break;
      }
    }
  }

  return {
    company: {
      ...state.company,
      cash,
      reputation,
    },
    employees,
    market: {
      ...state.market,
      assets: marketAssets,
    },
    revenueStreams,
    upgrades,
  };
}

// ────────────────────────────────────────────────────────────
// Market shock application with cascading correlation
// ────────────────────────────────────────────────────────────

function applyMarketShock(
  effect: EventEffect,
  eventId: string,
  marketAssets: Record<string, AssetState>,
  assetsBySector: Map<string, string[]>,
  assetsByClass: Map<string, string[]>,
  assetDefMap: Map<string, AssetDefinition>,
): void {
  const target = effect.target;
  if (!target) return;

  const magnitude = effect.value;
  const decayRate = effect.duration
    ? 1 / effect.duration // duration in days => decay per day
    : DEFAULT_SHOCK_DECAY_RATE;

  // Determine which assets are the primary targets.
  // The target can be a sector name (e.g. "tech", "energy") or an asset class
  // (e.g. "bond", "commodity"). We check both.
  const primaryAssetIds = new Set<string>();

  // Check if target matches a sector
  const sectorAssets = assetsBySector.get(target);
  if (sectorAssets) {
    for (const id of sectorAssets) {
      primaryAssetIds.add(id);
    }
  }

  // Check if target matches an asset class
  const classAssets = assetsByClass.get(target);
  if (classAssets) {
    for (const id of classAssets) {
      primaryAssetIds.add(id);
    }
  }

  // If no assets found for the target, skip
  if (primaryAssetIds.size === 0) return;

  // Build a set of sectors that contain primary targets
  const primarySectors = new Set<string>();
  for (const id of primaryAssetIds) {
    const def = assetDefMap.get(id);
    if (def) primarySectors.add(def.sector);
  }

  // Apply shocks
  for (const [assetId, assetState] of Object.entries(marketAssets)) {
    const def = assetDefMap.get(assetId);
    if (!def) continue;

    let shockMagnitude = 0;

    if (primaryAssetIds.has(assetId)) {
      // Primary target: full magnitude
      shockMagnitude = magnitude;
    } else if (def.class === 'bond') {
      // Bonds: inverse correlation (negative of 15% of magnitude)
      shockMagnitude = -magnitude * BOND_INVERSE_MAGNITUDE;
    } else if (primarySectors.has(def.sector)) {
      // Same sector but not primary: 60% magnitude
      shockMagnitude = magnitude * SAME_SECTOR_MAGNITUDE;
    } else {
      // Different sector: 20% magnitude
      shockMagnitude = magnitude * DIFFERENT_SECTOR_MAGNITUDE;
    }

    if (Math.abs(shockMagnitude) < 0.0001) continue;

    const newShock: PriceShock = {
      id: `${eventId}_${assetId}_${Date.now()}`,
      magnitude: shockMagnitude,
      initialMagnitude: shockMagnitude,
      decayRate,
      sourceEventId: eventId,
    };

    marketAssets[assetId] = {
      ...assetState,
      activeShocks: [...assetState.activeShocks, newShock],
    };
  }
}

// ────────────────────────────────────────────────────────────
// Client change application
// ────────────────────────────────────────────────────────────

function applyClientChange(
  effect: EventEffect,
  revenueStreams: Record<RevenueStreamId, ActiveRevenueStream>,
): void {
  // Apply client count change to all active revenue streams that have clientCount
  // If a specific target is given, only apply to that stream
  const targetId = effect.target as RevenueStreamId | undefined;

  for (const [streamId, stream] of Object.entries(revenueStreams) as [
    RevenueStreamId,
    ActiveRevenueStream,
  ][]) {
    if (!stream.active) continue;
    if (targetId && streamId !== targetId) continue;

    if (stream.clientCount !== undefined) {
      revenueStreams[streamId] = {
        ...stream,
        clientCount: Math.max(0, stream.clientCount + effect.value),
      };
    }
  }
}

// ────────────────────────────────────────────────────────────
// Unlock application
// ────────────────────────────────────────────────────────────

function applyUnlock(
  effect: EventEffect,
  revenueStreams: Record<RevenueStreamId, ActiveRevenueStream>,
  upgrades: Record<string, Upgrade>,
): void {
  const target = effect.target;
  if (!target) return;

  // Check if the target is a revenue stream
  if (target in revenueStreams) {
    const streamId = target as RevenueStreamId;
    revenueStreams[streamId] = {
      ...revenueStreams[streamId],
      unlocked: true,
    };
    return;
  }

  // Check if the target is an upgrade
  if (target in upgrades) {
    upgrades[target] = {
      ...upgrades[target],
      purchased: true,
    };
  }
}

// ────────────────────────────────────────────────────────────
// processEventChains — roll for chain events
// ────────────────────────────────────────────────────────────

/**
 * After an event is resolved, roll to see if any chain events fire.
 * Returns an array of new ActiveEvents spawned from chains.
 */
export function processEventChains(
  state: GameState,
  event: ActiveEvent,
  templates: GameEventTemplate[],
  rng: RNG,
): ActiveEvent[] {
  const template = templates.find((t) => t.id === event.templateId);
  if (!template) return [];
  if (!template.chainEvents || template.chainEvents.length === 0) return [];

  // Base probability modified by severity
  const probability = CHAIN_SEVERITY_MODIFIERS[template.severity] ?? CHAIN_BASE_PROBABILITY;

  const roll = rng.next();
  if (roll >= probability) return [];

  // Pick one chain event from the list (could randomize if multiple)
  const chainTemplateId =
    template.chainEvents.length === 1
      ? template.chainEvents[0]
      : template.chainEvents[Math.floor(rng.next() * template.chainEvents.length)];

  const chainTemplate = templates.find((t) => t.id === chainTemplateId);
  if (!chainTemplate) return [];

  // Check if the chain event is eligible (progression met, not on active cooldown)
  if (chainTemplate.requiresProgression !== undefined && state.time.day < chainTemplate.requiresProgression) {
    return [];
  }

  const chainEvent: ActiveEvent = {
    id: `${chainTemplateId}_chain_${state.time.day}`,
    templateId: chainTemplateId,
    triggeredOnDay: state.time.day,
    resolved: false,
    chainedFrom: event.id,
  };

  return [chainEvent];
}
