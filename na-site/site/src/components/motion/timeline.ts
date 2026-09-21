// Pure step logic for every animation island. One clock moves through the
// steps. Step N is one time range on the timeline, and "at step N" shows the
// end frame of that range. The islands seek paused Web Animations API objects
// to frameTime(), so the logic here needs no DOM and the tests control time.

export type Speed = 0.5 | 1 | 2;
export const SPEEDS: Speed[] = [0.5, 1, 2];

export interface Timeline {
  /** The motion of each step in ms at 1x. A step with 0 ms changes the picture at once. */
  durations: number[];
  /** The pause in ms at 1x between two steps while play runs, so the learner can read the caption. */
  hold: number;
  /** A step marked true stops play at its end, for example a step that asks the learner to predict. */
  stops?: boolean[];
}

export interface PlayerState {
  /** The current step, from 0. */
  step: number;
  /** The ms of motion already done in the current step. */
  t: number;
  /** The ms of hold that remain before the next step starts. */
  hold: number;
  playing: boolean;
  /** 'step' stops at the end of the current step. 'all' runs to the last step. */
  mode: 'step' | 'all';
  speed: Speed;
  /** prefers-reduced-motion: every frame is the end frame of its step. */
  reduce: boolean;
}

export const clampStep = (n: number, total: number) => Math.min(Math.max(n, 0), total - 1);

/** The step to show after a key press, or null when the key is not a step key. */
export function stepForKey(key: string, current: number, total: number): number | null {
  const targets: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: total - 1 };
  return Object.hasOwn(targets, key) ? clampStep(targets[key], total) : null;
}

/** The screen position of one ScrollStep block, in px from the top of the screen. */
export interface StepBlock {
  /** The step of the block, from 1. */
  step: number;
  top: number;
  bottom: number;
}

/**
 * The step of the block nearest the center of the band, or null when no block
 * touches the band. The distance is 0 for a block that holds the center, so a
 * tall block wins over a short neighbor. On a tie, the earlier block wins.
 */
export function stepInBand(blocks: StepBlock[], bandTop: number, bandBottom: number): number | null {
  const center = (bandTop + bandBottom) / 2;
  let best: StepBlock | null = null;
  let bestDistance = Infinity;
  for (const block of blocks) {
    if (block.bottom < bandTop || block.top > bandBottom) continue;
    const distance = Math.max(block.top - center, center - block.bottom, 0);
    if (distance < bestDistance) [best, bestDistance] = [block, distance];
  }
  return best?.step ?? null;
}

/** Paused at the end frame of step 1, so the picture matches the prerendered HTML. */
export function initialState(durations: number[]): PlayerState {
  return { step: 0, t: durations[0], hold: 0, playing: false, mode: 'all', speed: 1, reduce: false };
}

/** Play runs from the current frame to the last step. From the end of a step, it starts the next step at once. */
export function play(s: PlayerState, { durations }: Timeline): PlayerState {
  let { step, t } = s;
  if (t >= durations[step]) {
    step = step === durations.length - 1 ? 0 : step + 1;
    t = 0;
  }
  return { ...s, step, t, hold: 0, playing: true, mode: 'all' };
}

export const pause = (s: PlayerState): PlayerState => ({ ...s, playing: false });

/** Go to step n and play only its motion. With reduced motion, or a step of 0 ms, jump to its end frame. */
export function goTo(s: PlayerState, n: number, { durations }: Timeline): PlayerState {
  const step = clampStep(n, durations.length);
  const instant = s.reduce || durations[step] === 0;
  return { ...s, step, t: instant ? durations[step] : 0, hold: 0, playing: !instant, mode: 'step' };
}

/** Move the clock by dt ms of wall time. */
export function tick(s: PlayerState, dt: number, { durations, hold, stops }: Timeline): PlayerState {
  if (!s.playing) return s;
  const last = durations.length - 1;
  let { step, t, hold: wait } = s;
  let left = Math.max(0, dt) * s.speed;
  for (;;) {
    if (wait > 0) {
      const use = Math.min(wait, left);
      wait -= use;
      left -= use;
      if (wait > 0) return { ...s, step, t, hold: wait };
      step += 1;
      t = 0;
    }
    const use = Math.max(0, Math.min(durations[step] - t, left));
    t += use;
    left -= use;
    if (t < durations[step]) return { ...s, step, t, hold: 0 };
    if (s.mode === 'step' || step === last || stops?.[step]) return { ...s, step, t, hold: 0, playing: false };
    if (hold > 0) wait = hold;
    else {
      step += 1;
      t = 0;
    }
  }
}

/** The start of each step range on the timeline, in ms. */
export function starts(durations: number[]): number[] {
  let at = 0;
  return durations.map((d) => {
    const start = at;
    at += d;
    return start;
  });
}

/** The timeline time to show. With reduced motion, it is always the end frame of the step. */
export function frameTime(s: PlayerState, { durations }: Timeline): number {
  return starts(durations)[s.step] + (s.reduce ? durations[s.step] : s.t);
}

/**
 * Keyframes for a motion from `from` ms to `to` ms inside a step of `duration`
 * ms. The keyframes cover the whole step and hold the first and the last frame
 * outside the motion, so an earlier frame never shows through.
 */
export function toKeyframes(frames: Keyframe[], duration: number, from = 0, to = duration): Keyframe[] {
  if (frames.length < 2) throw new Error('A motion needs 2 or more keyframes.');
  if (!(duration > 0 && from >= 0 && from <= to && to <= duration)) {
    throw new Error(`A motion from ${from} to ${to} ms does not fit in a step of ${duration} ms.`);
  }
  const n = frames.length - 1;
  const out: Keyframe[] = frames.map((f, i) => ({ easing: 'ease-in-out', ...f, offset: (from + ((to - from) * i) / n) / duration }));
  if (from > 0) out.unshift({ ...frames[0], offset: 0 });
  if (to < duration) out.push({ ...frames[n], offset: 1 });
  return out;
}
