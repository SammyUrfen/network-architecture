import { describe, expect, it } from 'vitest';
import { quizItem } from '../content.config';
import {
  gradeBugLines,
  gradeByteField,
  gradeBytes,
  gradeChoice,
  gradeMulti,
  gradeNumeric,
  gradeOrder,
  gradeRecall,
  type Option,
} from './grade';

const explanation = 'A read returns the bytes available.';

// The sample mcq item of docs/PLAN.md section 3.
const options: Option[] = [
  { text: 'Always exactly "hello".', correct: false, misconception: 'S01-M04', feedback: 'TCP keeps no mark between writes.' },
  { text: 'Any split, such as "helloworld".', correct: true, feedback: 'Right. A read returns the bytes that arrived.' },
  { text: 'The two words in two reads.', correct: false, misconception: 'S01-M32', feedback: 'TCP can split or merge writes.' },
];

describe('gradeChoice (mcq, predict, spot-bug with options)', () => {
  it('gives the feedback of the picked option', () => {
    expect(gradeChoice({ options }, 1)).toEqual({ correct: true, feedback: 'Right. A read returns the bytes that arrived.' });
    expect(gradeChoice({ options }, 0)).toEqual({ correct: false, feedback: 'TCP keeps no mark between writes.' });
  });
});

describe('gradeMulti', () => {
  const multi = {
    explanation,
    options: [
      { text: 'a', correct: true, feedback: 'a is right.' },
      { text: 'b', correct: false, misconception: 'S01-M04', feedback: 'b is wrong.' },
      { text: 'c', correct: true, feedback: 'c is right.' },
      { text: 'd', correct: false, misconception: 'S01-M32', feedback: 'd is wrong.' },
    ],
  };

  it('is right when the picked set equals the correct set, in any order', () => {
    expect(gradeMulti(multi, [2, 0])).toEqual({ correct: true, feedback: explanation });
  });

  it('gives the feedback of each wrong pick', () => {
    expect(gradeMulti(multi, [0, 1, 2, 3])).toEqual({ correct: false, feedback: 'b is wrong. d is wrong.' });
  });

  it('gives the explanation when a correct option is missing and no pick is wrong', () => {
    expect(gradeMulti(multi, [0])).toEqual({ correct: false, feedback: explanation });
    expect(gradeMulti(multi, [])).toEqual({ correct: false, feedback: explanation });
  });

  it('is wrong for a pick with no option', () => {
    expect(gradeMulti(multi, [0, 2, 9]).correct).toBe(false);
  });
});

describe('gradeNumeric', () => {
  const item = {
    explanation,
    answer: { value: 1.2, tolerance: 0.1, unit: 'ms' },
    distractors: [{ value: 12, misconception: 'S01-M04', feedback: 'That is ten times too large.' }],
  };

  it('is right inside the tolerance, including the edge', () => {
    expect(gradeNumeric(item, 1.25)).toEqual({ correct: true, feedback: explanation });
    // 1.3 - 1.2 is 0.10000000000000009 in binary floating point.
    expect(gradeNumeric(item, 1.3).correct).toBe(true);
    expect(gradeNumeric(item, 1.1).correct).toBe(true);
  });

  it('is wrong outside the tolerance', () => {
    expect(gradeNumeric(item, 1.31)).toEqual({ correct: false, feedback: explanation });
  });

  it('uses a tolerance of 0 when the item gives none', () => {
    // The schema fills in the default, so parse an item that gives no tolerance.
    const exact = quizItem.parse({ id: 's01-m08-q99', use: ['check'], prompt: 'p', explanation, covers: ['S01-C92'], type: 'numeric', answer: { value: 443, unit: null } });
    if (exact.type !== 'numeric') throw new Error('expected a numeric item');
    expect(exact.answer.tolerance).toBe(0);
    expect(gradeNumeric(exact, 443).correct).toBe(true);
    expect(gradeNumeric(exact, 444).correct).toBe(false);
  });

  it('gives the distractor feedback for a wrong answer that equals a distractor', () => {
    expect(gradeNumeric(item, 12)).toEqual({ correct: false, feedback: 'That is ten times too large.' });
  });

  it('is wrong for NaN', () => {
    expect(gradeNumeric(item, Number.NaN).correct).toBe(false);
  });
});

describe('gradeOrder', () => {
  const item = {
    explanation,
    items: ['socket', 'bind', 'listen', 'accept'],
    distractors: [{ value: ['socket', 'listen', 'bind', 'accept'], feedback: 'bind comes before listen.' }],
  };

  it('is right only for the written order', () => {
    expect(gradeOrder(item, ['socket', 'bind', 'listen', 'accept'])).toEqual({ correct: true, feedback: explanation });
    expect(gradeOrder(item, ['bind', 'socket', 'listen', 'accept'])).toEqual({ correct: false, feedback: explanation });
    expect(gradeOrder(item, ['socket', 'bind', 'listen']).correct).toBe(false);
  });

  it('gives the distractor feedback for a known wrong order', () => {
    expect(gradeOrder(item, ['socket', 'listen', 'bind', 'accept'])).toEqual({
      correct: false,
      feedback: 'bind comes before listen.',
    });
  });
});

describe('gradeBytes (typed)', () => {
  const item = {
    explanation,
    answer: '98 76 5F',
    distractors: [{ value: '5f 76 98', misconception: 'S01-M10', feedback: 'That is little-endian order.' }],
  };

  it('ignores case and spaces', () => {
    expect(gradeBytes(item, '98765f')).toEqual({ correct: true, feedback: explanation });
    expect(gradeBytes(item, ' 98  76\t5F ').correct).toBe(true);
  });

  it('is wrong for other bytes', () => {
    expect(gradeBytes(item, '98 76 5E')).toEqual({ correct: false, feedback: explanation });
    expect(gradeBytes(item, '0x98765F').correct).toBe(false);
  });

  it('matches a distractor with case and spaces ignored', () => {
    expect(gradeBytes(item, '5F7698')).toEqual({ correct: false, feedback: 'That is little-endian order.' });
  });
});

describe('gradeByteField (selected in a dump)', () => {
  const item = { explanation, field: [4, 7] as [number, number] };

  it('is right when the selection matches, end included', () => {
    expect(gradeByteField(item, [4, 7])).toEqual({ correct: true, feedback: explanation });
    expect(gradeByteField(item, [4, 6])).toEqual({ correct: false, feedback: explanation });
  });

  it('gives the distractor feedback for a known wrong selection', () => {
    const withDistractor = { ...item, distractors: [{ value: [0, 3], feedback: 'Those are the first four bytes.' }] };
    // @ts-expect-error The schema gives a bytes distractor a string value, not [start, end]. No pilot uses a byte field yet.
    expect(gradeByteField(withDistractor, [0, 3])).toEqual({ correct: false, feedback: 'Those are the first four bytes.' });
  });
});

describe('gradeBugLines (spot-bug with code)', () => {
  const item = { explanation, bugLines: [3, 7] };

  it('is right when the picked lines equal the bug lines, in any order', () => {
    expect(gradeBugLines(item, [7, 3])).toEqual({ correct: true, feedback: explanation });
  });

  it('is wrong for a missing or an extra line', () => {
    expect(gradeBugLines(item, [3]).correct).toBe(false);
    expect(gradeBugLines(item, [3, 7, 8]).correct).toBe(false);
  });
});

describe('gradeRecall', () => {
  const item = {
    explanation,
    model: 'A length prefix or a delimiter.',
    distractors: [{ value: 'TCP keeps the message edges', misconception: 'S01-M04', feedback: 'TCP keeps no edges.' }],
  };

  it('uses the mark of the learner', () => {
    expect(gradeRecall(item, true)).toEqual({ correct: true, feedback: explanation });
    expect(gradeRecall(item, false)).toEqual({ correct: false, feedback: explanation });
  });

  it('makes a typed distractor wrong, even when marked right', () => {
    expect(gradeRecall(item, true, '  tcp keeps  the message edges ')).toEqual({
      correct: false,
      feedback: 'TCP keeps no edges.',
    });
  });

  it('keeps the mark for other typed text', () => {
    expect(gradeRecall(item, true, 'a length prefix').correct).toBe(true);
  });
});
