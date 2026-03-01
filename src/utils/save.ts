// Save/load with LZString compression

import LZString from 'lz-string';
import type { GameState } from '../types/index.ts';

const SAVE_KEY = 'trading-tycoon-save';

/**
 * Compress a GameState to a UTF-16 string for localStorage.
 */
export function compressSave(state: GameState): string {
  const json = JSON.stringify(state);
  return LZString.compressToUTF16(json);
}

/**
 * Decompress a UTF-16 string back to a GameState.
 */
export function decompressSave(compressed: string): GameState {
  const json = LZString.decompressFromUTF16(compressed);
  if (!json) throw new Error('Failed to decompress save data');
  return JSON.parse(json) as GameState;
}

/**
 * Save the current game state to localStorage under the standard key.
 */
export function saveToLocalStorage(state: GameState): void {
  const compressed = compressSave(state);
  localStorage.setItem(SAVE_KEY, compressed);
}

/**
 * Load a game state from localStorage. Returns null if no save found or if
 * decompression fails.
 */
export function loadFromLocalStorage(): GameState | null {
  const compressed = localStorage.getItem(SAVE_KEY);
  if (!compressed) return null;

  try {
    return decompressSave(compressed);
  } catch {
    console.warn('Failed to load save from localStorage');
    return null;
  }
}

/**
 * Export the game state as a Base64-encoded compressed string for sharing.
 */
export function exportSave(state: GameState): string {
  const json = JSON.stringify(state);
  return LZString.compressToBase64(json);
}

/**
 * Import a game state from a Base64-encoded compressed string.
 */
export function importSave(base64: string): GameState {
  const json = LZString.decompressFromBase64(base64);
  if (!json) throw new Error('Failed to decompress imported save data');
  return JSON.parse(json) as GameState;
}
