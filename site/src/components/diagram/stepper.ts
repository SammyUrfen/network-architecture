// Pure step logic for the Stepper island. It lives next to the component,
// because src/lib/ belongs to another packet in Phase 2.

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

export const clampStep = (n: number, total: number) => Math.min(Math.max(n, 0), total - 1);

/** The step to show after a key press, or null when the stepper does not use the key. */
export function stepForKey(key: string, current: number, total: number): number | null {
  const targets: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: total - 1 };
  return Object.hasOwn(targets, key) ? clampStep(targets[key], total) : null;
}

/** A chunk is new when the step before has no chunk with the same text at the same place. Step 1 is all new. */
export function isNewChunk(steps: Step[], step: number, lane: number, chunk: number) {
  if (step === 0) return true;
  return steps[step - 1].lanes[lane]?.chunks[chunk] !== steps[step].lanes[lane].chunks[chunk];
}
