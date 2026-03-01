// Save schema migrations
//
// Each time the save schema changes, add a migration function that
// transforms version N to version N+1. `migrateState` applies all
// pending migrations in sequence so saves from any prior version
// are brought up to the current schema.

import type { GameState } from '../types/index.ts';

/** The current save schema version. Bump this whenever you add a migration. */
export const CURRENT_SAVE_VERSION = 1;

/**
 * Apply all necessary migrations to bring a loaded save up to the current
 * schema version. If the state is already current, it is returned as-is.
 */
export function migrateState(state: unknown): GameState {
  const s = state as Record<string, unknown>;

  // Ensure meta exists
  if (!s.meta || typeof s.meta !== 'object') {
    return state as GameState;
  }

  const meta = s.meta as Record<string, unknown>;
  const version = (meta.saveVersion as number) ?? 1;

  // Future migrations would go here:
  // if (version < 2) { state = migrateV1toV2(state); }
  // if (version < 3) { state = migrateV2toV3(state); }

  // Ensure ui state exists (added in Phase 8)
  if (!s.ui || typeof s.ui !== 'object') {
    s.ui = {
      activeScreen: 'dashboard',
      showEventPopup: false,
      selectedAssetId: null,
      selectedEmployeeId: null,
      tutorialSeen: {},
      crtEnabled: false,
      newGameModalShown: false,
    };
  } else {
    const ui = s.ui as Record<string, unknown>;
    if (ui.tutorialSeen === undefined) ui.tutorialSeen = {};
    if (ui.crtEnabled === undefined) ui.crtEnabled = false;
    if (ui.newGameModalShown === undefined) ui.newGameModalShown = false;
  }

  // Ensure company has new bankruptcy fields (Phase 10)
  if (s.company && typeof s.company === 'object') {
    const company = s.company as Record<string, unknown>;
    if (company.consecutiveNegativeCashMonths === undefined) company.consecutiveNegativeCashMonths = 0;
    if (company.gameOver === undefined) company.gameOver = false;
  }

  // Stamp current version
  if (version < CURRENT_SAVE_VERSION) {
    meta.saveVersion = CURRENT_SAVE_VERSION;
  }

  return state as GameState;
}
