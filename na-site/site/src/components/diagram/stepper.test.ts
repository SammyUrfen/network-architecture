import { describe, expect, it } from 'vitest';
import { isNewChunk, type Step } from './stepper';

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
