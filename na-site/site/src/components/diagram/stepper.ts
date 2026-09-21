// Pure step logic for the Stepper island. It lives next to the component,
// because src/lib/ belongs to another packet in Phase 2.

// The key logic moved to the shared motion clock. The simulators still import it from here.
export { clampStep, stepForKey } from '../motion/timeline';

export interface Lane {
  label: string;
  /** The boxes in this lane, left to right. An empty list shows "empty". */
  chunks: string[];
}

export interface Step {
  caption: string;
  /** A question to answer before the learner presses Next (PEDAGOGY rule 7). */
  ask?: string;
  /** The full state at this step. Keep the same lanes, in the same order, in every step. */
  lanes: Lane[];
}

/** A chunk is new when the step before has no chunk with the same text at the same place. Step 1 is all new. */
export function isNewChunk(steps: Step[], step: number, lane: number, chunk: number) {
  if (step === 0) return true;
  return steps[step - 1].lanes[lane]?.chunks[chunk] !== steps[step].lanes[lane].chunks[chunk];
}
