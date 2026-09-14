import { describe, expect, it } from 'vitest';
import {
  clampStep,
  frameTime,
  goTo,
  initialState,
  pause,
  play,
  starts,
  stepForKey,
  stepInBand,
  tick,
  toKeyframes,
  type PlayerState,
  type Timeline,
} from './timeline';

// Three steps of 1000, 500 and 2000 ms, with a 300 ms hold between steps.
const tl: Timeline = { durations: [1000, 500, 2000], hold: 300 };
const at = (s: PlayerState) => [s.step, s.t, s.hold, s.playing];

describe('stepForKey', () => {
  it('moves one step with the arrows and jumps with Home and End', () => {
    expect(stepForKey('ArrowRight', 2, 6)).toBe(3);
    expect(stepForKey('ArrowLeft', 2, 6)).toBe(1);
    expect(stepForKey('Home', 4, 6)).toBe(0);
    expect(stepForKey('End', 1, 6)).toBe(5);
  });

  it('stops at the first and the last step', () => {
    expect(stepForKey('ArrowLeft', 0, 6)).toBe(0);
    expect(stepForKey('ArrowRight', 5, 6)).toBe(5);
    expect(clampStep(9, 1)).toBe(0);
  });

  it('leaves other keys to the browser', () => {
    for (const key of ['ArrowUp', 'ArrowDown', 'Tab', 'Enter', ' ', 'toString']) {
      expect(stepForKey(key, 2, 6)).toBeNull();
    }
  });
});

// A screen 1000 px high: the band runs from 450 to 550 px, with its center at 500 px.
describe('stepInBand', () => {
  const band = [450, 550] as const;

  it('picks the block nearest the center when two short blocks touch the band', () => {
    const blocks = [
      { step: 1, top: 380, bottom: 490 },
      { step: 2, top: 520, bottom: 600 },
    ];
    expect(stepInBand(blocks, ...band)).toBe(1);
    expect(stepInBand([blocks[0], { step: 2, top: 495, bottom: 560 }], ...band)).toBe(2);
  });

  it('picks the middle block after a jump scroll puts three blocks in the band', () => {
    const blocks = [
      { step: 1, top: -900, bottom: -100 },
      { step: 2, top: 400, bottom: 460 },
      { step: 3, top: 470, bottom: 530 },
      { step: 4, top: 540, bottom: 600 },
      { step: 5, top: 610, bottom: 900 },
    ];
    expect(stepInBand(blocks, ...band)).toBe(3);
  });

  it('keeps a tall block that holds the center, also when a short neighbor has a nearer center', () => {
    const blocks = [
      { step: 1, top: -400, bottom: 520 },
      { step: 2, top: 530, bottom: 560 },
    ];
    expect(stepInBand(blocks, ...band)).toBe(1);
  });

  it('gives the earlier block on a tie', () => {
    const blocks = [
      { step: 1, top: 400, bottom: 490 },
      { step: 2, top: 510, bottom: 600 },
    ];
    expect(stepInBand(blocks, ...band)).toBe(1);
  });

  it('gives null when a jump scroll leaves no block in the band', () => {
    expect(stepInBand([{ step: 1, top: 100, bottom: 440 }, { step: 2, top: 560, bottom: 900 }], ...band)).toBeNull();
    expect(stepInBand([], ...band)).toBeNull();
  });
});

describe('the start state', () => {
  it('is paused at the end frame of step 1', () => {
    const s = initialState(tl.durations);
    expect(at(s)).toEqual([0, 1000, 0, false]);
    expect(frameTime(s, tl)).toBe(1000);
  });
});

describe('play', () => {
  it('starts the next step at once from the end of a step, with no hold first', () => {
    expect(at(play(initialState(tl.durations), tl))).toEqual([1, 0, 0, true]);
  });

  it('runs every step with a hold between them, then stops at the end of the last step', () => {
    let s = play(initialState(tl.durations), tl);
    s = tick(s, 400, tl);
    expect(at(s)).toEqual([1, 400, 0, true]);
    s = tick(s, 200, tl); // 100 ms of motion, then 100 ms of hold
    expect(at(s)).toEqual([1, 500, 200, true]);
    s = tick(s, 250, tl); // the hold ends, and 50 ms of step 3 run
    expect(at(s)).toEqual([2, 50, 0, true]);
    s = tick(s, 5000, tl);
    expect(at(s)).toEqual([2, 2000, 0, false]);
    expect(frameTime(s, tl)).toBe(3500);
  });

  it('starts again at step 1 from the end of the last step', () => {
    const end = { ...initialState(tl.durations), step: 2, t: 2000 };
    expect(at(play(end, tl))).toEqual([0, 0, 0, true]);
  });

  it('continues from the current frame after a pause in the middle of a step', () => {
    const mid = pause(tick(play(initialState(tl.durations), tl), 200, tl));
    expect(at(mid)).toEqual([1, 200, 0, false]);
    expect(tick(mid, 1000, tl)).toBe(mid);
    expect(at(play(mid, tl))).toEqual([1, 200, 0, true]);
  });

  it('skips the rest of a hold when the learner plays after a pause in the hold', () => {
    const inHold = pause(tick(play(initialState(tl.durations), tl), 600, tl));
    expect(at(inHold)).toEqual([1, 500, 200, false]);
    expect(at(play(inHold, tl))).toEqual([2, 0, 0, true]);
  });

  it('uses the speed', () => {
    const fast = { ...play(initialState(tl.durations), tl), speed: 2 as const };
    const slow = { ...fast, speed: 0.5 as const };
    expect(tick(fast, 100, tl).t).toBe(200);
    expect(tick(slow, 100, tl).t).toBe(50);
  });

  it('stops at the end of a step marked as a stop', () => {
    const stops: Timeline = { ...tl, stops: [false, true, false] };
    const s = tick(play(initialState(tl.durations), stops), 900, stops);
    expect(at(s)).toEqual([1, 500, 0, false]);
    expect(at(play(s, stops))).toEqual([2, 0, 0, true]);
  });

  it('goes on at once when the hold is 0', () => {
    const noHold: Timeline = { ...tl, hold: 0 };
    expect(at(tick(play(initialState(tl.durations), noHold), 600, noHold))).toEqual([2, 100, 0, true]);
  });

  it('never goes back in time', () => {
    const s = play(initialState(tl.durations), tl);
    expect(tick(s, -50, tl).t).toBe(0);
  });
});

describe('goTo', () => {
  it('plays only the motion of that step, then stops at its end', () => {
    let s = goTo(initialState(tl.durations), 2, tl);
    expect(at(s)).toEqual([2, 0, 0, true]);
    expect(frameTime(s, tl)).toBe(1500);
    s = tick(s, 2500, tl);
    expect(at(s)).toEqual([2, 2000, 0, false]);
  });

  it('replays step 1, for the restart button, and clamps a step out of range', () => {
    expect(at(goTo(initialState(tl.durations), 0, tl))).toEqual([0, 0, 0, true]);
    expect(goTo(initialState(tl.durations), 7, tl).step).toBe(2);
  });

  it('jumps to the end frame with no motion when a step has 0 ms', () => {
    const steps: Timeline = { durations: [0, 0, 0], hold: 4000 };
    expect(at(goTo(initialState(steps.durations), 1, steps))).toEqual([1, 0, 0, false]);
  });
});

describe('reduced motion', () => {
  const still = { ...initialState(tl.durations), reduce: true };

  it('jumps to the end frame of a step and does not play', () => {
    const s = goTo(still, 1, tl);
    expect(at(s)).toEqual([1, 500, 0, false]);
    expect(frameTime(s, tl)).toBe(1500);
  });

  it('shows only end frames while play runs', () => {
    const s = tick(play(still, tl), 100, tl);
    expect(at(s)).toEqual([1, 100, 0, true]);
    expect(frameTime(s, tl)).toBe(1500);
  });
});

describe('a Stepper timeline with 0 ms steps', () => {
  const steps: Timeline = { durations: [0, 0, 0], hold: 4000 };

  it('shows each step for the hold, then stops on the last step', () => {
    let s = play(initialState(steps.durations), steps);
    expect(at(s)).toEqual([1, 0, 0, true]);
    s = tick(s, 16, steps);
    expect(at(s)).toEqual([1, 0, 3984, true]);
    s = tick(s, 3984, steps);
    expect(at(s)).toEqual([2, 0, 0, false]);
  });
});

describe('starts', () => {
  it('adds up the durations before each step', () => {
    expect(starts([1000, 500, 2000])).toEqual([0, 1000, 1500]);
  });
});

describe('toKeyframes', () => {
  const frames: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];

  it('spreads the frames over the whole step when the motion fills it', () => {
    expect(toKeyframes(frames, 1000)).toEqual([
      { opacity: 0, offset: 0, easing: 'ease-in-out' },
      { opacity: 1, offset: 1, easing: 'ease-in-out' },
    ]);
  });

  it('holds the first frame before the motion and the last frame after it', () => {
    expect(toKeyframes([...frames, { opacity: 0.5, easing: 'linear' }], 1000, 200, 600)).toEqual([
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: 0.2, easing: 'ease-in-out' },
      { opacity: 1, offset: 0.4, easing: 'ease-in-out' },
      { opacity: 0.5, offset: 0.6, easing: 'linear' },
      { opacity: 0.5, offset: 1, easing: 'linear' },
    ]);
  });

  it('rejects a motion that does not fit its step', () => {
    expect(() => toKeyframes([{ opacity: 0 }], 1000)).toThrow('2 or more');
    expect(() => toKeyframes(frames, 0)).toThrow('does not fit');
    expect(() => toKeyframes(frames, 1000, 600, 200)).toThrow('does not fit');
    expect(() => toKeyframes(frames, 1000, 0, 1200)).toThrow('does not fit');
  });
});
