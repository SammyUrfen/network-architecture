import { describe, expect, test } from 'vitest';
import readme from '../../docs/curriculum/README.md?raw';
import { parseThreads, quizItem } from './content.config';

describe('parseThreads', () => {
  test('reads the rows of the thread table and nothing else', () => {
    const md = [
      '| ID | The idea | First seen |',
      '|---|---|---|',
      '| `T-framing` | TCP gives a byte stream. | S1 |',
      '| `T-littles-law` | concurrency = throughput × latency. | S3 |',
      '- `T-framing` in a bullet is not a row.',
    ].join('\n');
    expect(parseThreads(md)).toEqual([
      { id: 'T-framing', idea: 'TCP gives a byte stream.', firstSeen: 1 },
      { id: 'T-littles-law', idea: 'concurrency = throughput × latency.', firstSeen: 3 },
    ]);
  });

  test('finds T-framing in the real curriculum README', () => {
    const rows = parseThreads(readme);
    expect(rows.length).toBeGreaterThanOrEqual(15);
    expect(rows).toContainEqual(expect.objectContaining({ id: 'T-framing', firstSeen: 1 }));
  });
});

describe('quizItem', () => {
  const base = { id: 's01-m08-q09', use: ['practice'], prompt: 'p', explanation: 'e', covers: ['S01-C92'] };
  const option = { text: 't', correct: true, feedback: 'f' };

  test.each([
    { type: 'mcq', options: [option] },
    { type: 'predict', options: [option] },
    { type: 'multi', options: [option] },
    { type: 'numeric', answer: { value: 255, unit: null } },
    { type: 'order', items: ['a', 'b'] },
    { type: 'bytes', answer: '00 05' },
    { type: 'bytes', hex: '00 05 68', field: [0, 1] },
    { type: 'spot-bug', code: 'x', bugLines: [1] },
    { type: 'spot-bug', options: [option] },
    { type: 'recall', model: 'm' },
  ])('accepts a $type item', (fields) => {
    expect(quizItem.safeParse({ ...base, ...fields }).success).toBe(true);
  });

  test.each([
    { type: 'essay', model: 'm' },
    { type: 'numeric', answer: { value: 'many', unit: null } },
    { type: 'bytes', answer: '00', hex: '00', field: [0, 0] },
    { type: 'bytes', hex: '00' },
    { type: 'spot-bug', code: 'x' },
    { type: 'recall' },
  ])('rejects a bad $type item', (fields) => {
    expect(quizItem.safeParse({ ...base, ...fields }).success).toBe(false);
  });

  test('keeps an optional taughtIn string', () => {
    expect(quizItem.parse({ ...base, type: 'recall', model: 'm', taughtIn: 'seg-one' }).taughtIn).toBe('seg-one');
    expect(quizItem.safeParse({ ...base, type: 'recall', model: 'm', taughtIn: 2 }).success).toBe(false);
  });

  test('defaults tolerance to 0 and tags to []', () => {
    const r = quizItem.parse({ ...base, type: 'numeric', answer: { value: 1, unit: 'bytes' } });
    expect(r.tags).toEqual([]);
    expect(r.type === 'numeric' && r.answer.tolerance).toBe(0);
  });
});
