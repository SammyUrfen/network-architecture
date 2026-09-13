import { describe, expect, it } from 'vitest';
import { clampStep, isNewChunk, stepForKey, type Step } from './stepper';

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

describe('isNewChunk', () => {
  const steps: Step[] = [
    { caption: 'one', lanes: [{ label: 'buffer', chunks: ['hello'] }] },
    { caption: 'two', lanes: [{ label: 'buffer', chunks: ['helloworld', 'x'] }] },
    { caption: 'three', lanes: [{ label: 'buffer', chunks: ['helloworld', 'x'] }] },
  ];

  it('marks every chunk of the first step', () => {
    expect(isNewChunk(steps, 0, 0, 0)).toBe(true);
  });

  it('marks a changed or added chunk, and not a chunk that stayed', () => {
    expect(isNewChunk(steps, 1, 0, 0)).toBe(true);
    expect(isNewChunk(steps, 1, 0, 1)).toBe(true);
    expect(isNewChunk(steps, 2, 0, 0)).toBe(false);
    expect(isNewChunk(steps, 2, 0, 1)).toBe(false);
  });
});
