import { describe, expect, it } from 'vitest';
import type { CardState } from '../lib/schedule';
import { dueCards, examDatesFor, when } from './_queue';

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

describe('when', () => {
  it('counts whole days, also across a month end', () => {
    expect(when('2026-09-15', '2026-09-14')).toBe('tomorrow, on 2026-09-15');
    expect(when('2026-10-01', '2026-09-28')).toBe('in 3 days, on 2026-10-01');
  });
});
