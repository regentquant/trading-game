// Event engine — orchestrates event lifecycle per game tick
//
// Responsibilities:
// - Check if storyteller fires a new event
// - Create ActiveEvent from selected template
// - Check for chain events from recently resolved events
// - Auto-resolve events after 5 days with no player choice

import type { GameState, ActiveEvent, GameEventTemplate } from '../../types/index.ts';
import type { RNG } from '../../utils/random.ts';
import { shouldFireEvent, selectEvent } from './storyteller.ts';
import { processEventChoice, processEventChains } from './eventProcessor.ts';

// ────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────

/** Number of days before an unresolved event auto-resolves with the default (first) choice. */
const AUTO_RESOLVE_DAYS = 5;

// ────────────────────────────────────────────────────────────
// tickEvents — main entry point called once per game day
// ────────────────────────────────────────────────────────────

export interface EventTickResult {
  newEvents: ActiveEvent[];
  resolvedEvents: ActiveEvent[];
  statePatches: Partial<GameState>[];
}

export function tickEvents(
  state: GameState,
  templates: GameEventTemplate[],
  rng: RNG,
): EventTickResult {
  const newEvents: ActiveEvent[] = [];
  const resolvedEvents: ActiveEvent[] = [];
  const statePatches: Partial<GameState>[] = [];

  // ── 1. Auto-resolve stale events ──────────────────────────
  for (const event of state.events.active) {
    if (event.resolved) continue;

    const daysPending = state.time.day - event.triggeredOnDay;
    if (daysPending >= AUTO_RESOLVE_DAYS && event.choiceMade === undefined) {
      // Auto-resolve with the first (default) option
      const patch = processEventChoice(state, event, 0, templates);
      statePatches.push(patch);

      const resolved: ActiveEvent = {
        ...event,
        choiceMade: 0,
        resolved: true,
      };
      resolvedEvents.push(resolved);

      // Check for chain events from auto-resolved event
      const chains = processEventChains(state, resolved, templates, rng);
      newEvents.push(...chains);
    }
  }

  // ── 2. Check for chain events from recently resolved events ─
  // Look at events resolved in the previous tick (those in history
  // that were resolved on the current day or the day before)
  for (const histEvent of state.events.history) {
    if (!histEvent.resolved) continue;
    if (histEvent.triggeredOnDay < state.time.day - 1) continue;

    // Only chain from events that haven't already been chained
    // (we use a simple heuristic: chain events have chainedFrom set)
    const chains = processEventChains(state, histEvent, templates, rng);
    newEvents.push(...chains);
  }

  // ── 3. Fire new storyteller event (auto-resolve immediately) ──
  if (shouldFireEvent(state, rng)) {
    const template = selectEvent(state, templates, rng);
    if (template) {
      // Auto-resolve with the first choice — no player interaction needed
      const activeEvent: ActiveEvent = {
        id: `${template.id}_${state.time.day}`,
        templateId: template.id,
        triggeredOnDay: state.time.day,
        choiceMade: 0,
        resolved: true,
      };

      const patch = processEventChoice(state, activeEvent, 0, templates);
      statePatches.push(patch);
      resolvedEvents.push(activeEvent);

      // Check for chain events
      const chains = processEventChains(state, activeEvent, templates, rng);
      // Auto-resolve chain events too
      for (const chainEvent of chains) {
        const resolvedChain: ActiveEvent = {
          ...chainEvent,
          choiceMade: 0,
          resolved: true,
        };
        const chainPatch = processEventChoice(state, resolvedChain, 0, templates);
        statePatches.push(chainPatch);
        resolvedEvents.push(resolvedChain);
      }
    }
  }

  return { newEvents, resolvedEvents, statePatches };
}

// ────────────────────────────────────────────────────────────
// resolvePlayerChoice — called when the player picks an option
// ────────────────────────────────────────────────────────────

export interface PlayerChoiceResult {
  resolvedEvent: ActiveEvent;
  statePatch: Partial<GameState>;
  chainEvents: ActiveEvent[];
}

/**
 * Process the player's choice for a specific active event.
 * Returns the resolved event, state changes, and any chain events.
 */
export function resolvePlayerChoice(
  state: GameState,
  eventId: string,
  choiceIndex: number,
  templates: GameEventTemplate[],
  rng: RNG,
): PlayerChoiceResult | null {
  const event = state.events.active.find((e) => e.id === eventId && !e.resolved);
  if (!event) return null;

  // Apply the chosen effects
  const statePatch = processEventChoice(state, event, choiceIndex, templates);

  // Mark the event as resolved
  const resolvedEvent: ActiveEvent = {
    ...event,
    choiceMade: choiceIndex,
    resolved: true,
  };

  // Roll for chain events
  const chainEvents = processEventChains(state, resolvedEvent, templates, rng);

  return { resolvedEvent, statePatch, chainEvents };
}

// ────────────────────────────────────────────────────────────
// applyEventTickResult — helper to merge tick results into state
// ────────────────────────────────────────────────────────────

/**
 * Merge the results of tickEvents into the game state.
 * This is a pure function that returns a new GameState.
 */
export function applyEventTickResult(
  state: GameState,
  result: EventTickResult,
  _templates: GameEventTemplate[],
): GameState {
  const resolvedIds = new Set(result.resolvedEvents.map((e) => e.id));

  // Move resolved events from active to history
  const remainingActive = state.events.active.filter((e) => !resolvedIds.has(e.id));

  // Update history with newly resolved events
  const updatedHistory = [...state.events.history, ...result.resolvedEvents];

  // Add new events to active list
  const newActive = [...remainingActive, ...result.newEvents];

  // Update cooldowns for newly created events
  const updatedCooldowns = { ...state.events.cooldowns };
  for (const newEvent of result.newEvents) {
    updatedCooldowns[newEvent.templateId] = state.time.day;
  }

  // Merge all state patches
  let mergedState: GameState = {
    ...state,
    events: {
      active: newActive,
      history: updatedHistory,
      cooldowns: updatedCooldowns,
    },
    statistics: {
      ...state.statistics,
      eventsEncountered:
        state.statistics.eventsEncountered + result.newEvents.length,
    },
  };

  // Apply all state patches from resolved events
  for (const patch of result.statePatches) {
    mergedState = mergeStatePatch(mergedState, patch);
  }

  return mergedState;
}

/**
 * Deep-merge a partial GameState patch into the full state.
 */
function mergeStatePatch(state: GameState, patch: Partial<GameState>): GameState {
  const merged = { ...state };

  if (patch.company) {
    merged.company = { ...state.company, ...patch.company };
  }
  if (patch.employees) {
    merged.employees = { ...state.employees, ...patch.employees };
  }
  if (patch.market) {
    merged.market = { ...state.market, ...patch.market };
    if (patch.market.assets) {
      merged.market = {
        ...merged.market,
        assets: { ...state.market.assets, ...patch.market.assets },
      };
    }
  }
  if (patch.revenueStreams) {
    merged.revenueStreams = { ...state.revenueStreams, ...patch.revenueStreams };
  }
  if (patch.upgrades) {
    merged.upgrades = { ...state.upgrades, ...patch.upgrades };
  }

  return merged;
}
