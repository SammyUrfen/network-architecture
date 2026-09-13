import { describe, expect, it } from 'vitest';
import { quizItem } from '../content.config';
import type { CardState } from '../lib/schedule';
import { dueCards, examDatesFor, quizCard, when } from './_queue';

const state = (due: string): CardState => ({ box: 1, due, lapses: 0 });
const ids = (list: Array<{ id: string }>) => list.map((card) => card.id);

describe('examDatesFor', () => {
  const assessments = [
    { date: new Date('2026-09-25'), coversSessions: [1, 5] },
    { date: null, coversSessions: [1, 2, 3] },
    { date: new Date('2026-11-20'), coversSessions: [1, 2, 3, 4, 5] },
  ];

  it('reads coversSessions as a list, not a range', () => {
    expect(examDatesFor(1, assessments)).toEqual(['2026-09-25', '2026-11-20']);
    expect(examDatesFor(3, assessments)).toEqual(['2026-11-20']);
    expect(examDatesFor(8, assessments)).toEqual([]);
  });
});

describe('dueCards', () => {
  const cards = ['s02-m01-c01', 's01-m08-c02', 's01-m08-c01', 's01-m09-c01', 's01-m08-c03'].map((id) => ({ id }));
  const now = new Date(2026, 8, 14, 12);

  it('skips unsaved cards and cards due later, and puts the oldest due day first', () => {
    const saved = {
      's01-m08-c01': state('2026-09-14'),
      's01-m08-c02': state('2026-09-10'),
      's01-m08-c03': state('2026-09-15'),
      's02-m01-c01': state('2026-09-14'),
    };
    expect(ids(dueCards(cards, saved, now))).toEqual(['s01-m08-c02', 's01-m08-c01', 's02-m01-c01']);
  });

  it('mixes modules on the same day by card number', () => {
    const saved = Object.fromEntries(cards.map((card) => [card.id, state('2026-09-14')]));
    expect(ids(dueCards(cards, saved, now))).toEqual(['s01-m08-c01', 's01-m09-c01', 's02-m01-c01', 's01-m08-c02', 's01-m08-c03']);
  });
});

describe('quizCard', () => {
  const base = { use: ['check'], prompt: 'The question?', explanation: 'Why.', covers: ['S01-C92'], tags: [] };
  const option = (text: string, correct: boolean) => ({ text, correct, feedback: 'f' });

  it('puts the prompt and the options on the front, and the right answer on the back, of each type', () => {
    const items = [
      { ...base, id: 's01-m08-q01', type: 'mcq', options: [option('No', false), option('Any split', true), option('Two', false)] },
      { ...base, id: 's01-m08-q05', type: 'multi', options: [option('A', true), option('B', false), option('C', true)] },
      { ...base, id: 's01-m08-q04', type: 'numeric', answer: { value: 255, tolerance: 0, unit: 'bytes' } },
      { ...base, id: 's01-m08-q11', type: 'numeric', answer: { value: 1.5, tolerance: 0.1, unit: null } },
      { ...base, id: 's01-m08-q07', type: 'recall', model: 'A length or a delimiter.' },
      { ...base, id: 's01-m08-q12', type: 'order', items: ['socket', 'connect'] },
    ].map((item) => quizItem.parse(item));
    expect(items.map(quizCard)).toEqual([
      { id: 's01-m08-q01', front: 'The question?', options: ['No', 'Any split', 'Two'], back: 'Any split', explanation: 'Why.' },
      { id: 's01-m08-q05', front: 'The question?', options: ['A', 'B', 'C'], back: 'A\nC', explanation: 'Why.' },
      { id: 's01-m08-q04', front: 'The question?', options: [], back: '255 bytes', explanation: 'Why.' },
      { id: 's01-m08-q11', front: 'The question?', options: [], back: '1.5 ± 0.1', explanation: 'Why.' },
      { id: 's01-m08-q07', front: 'The question?', options: [], back: 'A length or a delimiter.', explanation: 'Why.' },
      { id: 's01-m08-q12', front: 'The question?', options: [], back: '1. socket\n2. connect', explanation: 'Why.' },
    ]);
  });

  it('puts a sure-but-wrong quiz item in the due queue next to the cards', () => {
    const cards = [
      { id: 's01-m08-c01' },
      quizCard(quizItem.parse({ ...base, id: 's01-m08-q01', type: 'recall', model: 'm' })),
      { id: 's01-m08-c02' },
    ];
    // What components/check/record.ts saves for a sure wrong answer: box 1, due tomorrow.
    const saved = { 's01-m08-c02': state('2026-09-14'), 's01-m08-q01': state('2026-09-14') };
    expect(ids(dueCards(cards, saved, new Date(2026, 8, 14, 12)))).toEqual(['s01-m08-q01', 's01-m08-c02']);
  });
});

describe('when', () => {
  it('counts whole days, also across a month end', () => {
    expect(when('2026-09-15', '2026-09-14')).toBe('tomorrow, on 2026-09-15');
    expect(when('2026-10-01', '2026-09-28')).toBe('in 3 days, on 2026-10-01');
  });
});
