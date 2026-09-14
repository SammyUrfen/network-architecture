import type { Track } from '../../motion/useTimeline';

// The two animations of this lesson say where each SVG element sits at the
// end of each step. This file turns those places into motions for
// useTimeline, so no island writes its keyframes by hand.

/** A move from the place where the SVG draws the element, and its opacity. */
export interface Spot {
  dx: number;
  dy: number;
  o: number;
}

/** One motion of the element with `data-key` equal to `key`, as in Track. */
export interface Motion {
  step: number;
  key: string;
  frames: Keyframe[];
  from: number;
  to: number;
}

export const css = ({ dx, dy, o }: Spot) => ({ transform: `translate(${dx}px, ${dy}px)`, opacity: o });

const same = (a: Spot, b: Spot) => a.dx === b.dx && a.dy === b.dy && a.o === b.o;

/**
 * A motion for each element that changes its spot in a step. `spots[key][s]`
 * is the spot at the end of step s. `before[key]` is the spot before step 1,
 * so an element can appear in step 1. The elements that change in one step
 * start `stagger` ms apart, in key order, and each motion takes `move` ms.
 */
export function planMotions(spots: Record<string, Spot[]>, before: Record<string, Spot>, move: number, stagger: number): Motion[] {
  const keys = Object.keys(spots);
  const steps = spots[keys[0]].length;
  const motions: Motion[] = [];
  for (let step = 0; step < steps; step++) {
    let k = 0;
    for (const key of keys) {
      const from = step === 0 ? (before[key] ?? spots[key][0]) : spots[key][step - 1];
      const to = spots[key][step];
      if (same(from, to)) continue;
      const start = k++ * stagger;
      motions.push({ step, key, frames: [css(from), css(to)], from: start, to: start + move });
    }
  }
  return motions;
}

/** The length of each step: its last motion ends it. A step with no motion takes `min` ms. */
export const durationsOf = (motions: Motion[], steps: number, min: number) =>
  Array.from({ length: steps }, (_, step) => Math.max(min, ...motions.filter((m) => m.step === step).map((m) => m.to)));

/** The motions as tracks on the elements inside `root`. */
export const toTracks = (root: Element, motions: Motion[]): Track[] =>
  motions.map(({ key, ...motion }) => ({ ...motion, el: root.querySelector(`[data-key="${key}"]`)! }));
