// Core game loop — drives time forward via requestAnimationFrame

import { CONFIG } from '../data/config.ts';
import type { GameStore } from '../store/gameStore.ts';

let lastTimestamp = 0;
let tickAccumulator = 0;

/**
 * Start the main game loop. Uses requestAnimationFrame to drive
 * the game tick at a rate determined by the current speed setting.
 *
 * Implements a fixed timestep with accumulator pattern to ensure
 * consistent tick rates regardless of frame rate. A "spiral of death"
 * guard resets the accumulator if it falls too far behind.
 */
export function startGameLoop(store: { getState: () => GameStore }) {
  lastTimestamp = 0;
  tickAccumulator = 0;

  const loop = (timestamp: number) => {
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    const delta = (timestamp - lastTimestamp) / 1000; // seconds
    lastTimestamp = timestamp;

    const state = store.getState();
    if (!state.time.isPaused && state.time.speed > 0) {
      const ticksPerSecond = CONFIG.TICKS_PER_SECOND[state.time.speed];
      if (ticksPerSecond) {
        const tickInterval = 1 / ticksPerSecond;
        tickAccumulator += delta;

        let ticksThisFrame = 0;
        while (
          tickAccumulator >= tickInterval &&
          ticksThisFrame < CONFIG.MAX_TICKS_PER_FRAME
        ) {
          store.getState().tick();
          tickAccumulator -= tickInterval;
          ticksThisFrame++;
        }

        // Prevent spiral of death
        if (tickAccumulator > tickInterval * 3) {
          tickAccumulator = 0;
        }
      }
    }

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
}
