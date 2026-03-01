// Event system — storytellers, event processing, and event engine

export { shouldFireEvent, selectEvent } from './storyteller.ts';
export { processEventChoice, processEventChains } from './eventProcessor.ts';
export {
  tickEvents,
  resolvePlayerChoice,
  applyEventTickResult,
} from './eventEngine.ts';
export type { EventTickResult, PlayerChoiceResult } from './eventEngine.ts';
