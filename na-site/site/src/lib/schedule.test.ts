import { beforeAll, describe, expect, it, vi } from 'vitest';
import { addDays, isDue, localDay, newCard, reviewCard, type CardState } from './schedule';

// A time zone with DST, so the DST tests below can fail. Node applies a new TZ
// value at once. The first test proves that it did.
beforeAll(() => {
  vi.stubEnv('TZ', 'America/New_York');
});

const card = (box: CardState['box'], due = '2026-09-20', lapses = 0): CardState => ({ box, due, lapses });

describe('time zone setup', () => {
  it('uses a zone with DST', () => {
    expect(new Date(2026, 2, 7, 12).getTimezoneOffset()).toBe(300);
    expect(new Date(2026, 2, 9, 12).getTimezoneOffset()).toBe(240);
  });
});

describe('calendar days', () => {
  it('formats the local calendar day, not the UTC day', () => {
    // 23:30 in New York is 03:30 UTC on the next day.
    expect(localDay(new Date(2026, 8, 30, 23, 30))).toBe('2026-09-30');
  });

  it('adds days across a month end, a leap day and a year end', () => {
    expect(addDays('2026-01-30', 3)).toBe('2026-02-02');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-10-02', -7)).toBe('2026-09-25');
  });
});

describe('boxes', () => {
  it('starts a new card in box 1, due tomorrow', () => {
    expect(newCard(new Date(2026, 8, 14, 9))).toEqual({ box: 1, due: '2026-09-15', lapses: 0 });
  });

  it('moves a right answer up one box, with gaps of 3, 7, 14 and 30 days', () => {
    const now = new Date(2026, 8, 20, 10);
    expect(reviewCard(card(1), true, now)).toEqual(card(2, '2026-09-23'));
    expect(reviewCard(card(2), true, now)).toEqual(card(3, '2026-09-27'));
    expect(reviewCard(card(3), true, now)).toEqual(card(4, '2026-10-04'));
    expect(reviewCard(card(4), true, now)).toEqual(card(5, '2026-10-20'));
  });

  it('keeps a right answer in box 5 at 30 days', () => {
    expect(reviewCard(card(5), true, new Date(2026, 8, 20, 10))).toEqual(card(5, '2026-10-20'));
  });

  it('resets a wrong answer to box 1, due tomorrow, and counts the lapse', () => {
    expect(reviewCard(card(4, '2026-09-20', 2), false, new Date(2026, 8, 20, 10))).toEqual(
      card(1, '2026-09-21', 3),
    );
  });

  it('gives a due date across a month end', () => {
    expect(reviewCard(card(3), true, new Date(2026, 8, 28, 10)).due).toBe('2026-10-12');
  });
});

describe('DST', () => {
  // A day is 23 or 25 hours long on a DST change. Adding 24 hours of
  // milliseconds gives the wrong calendar day in both cases.
  it('gives tomorrow when the clocks go forward in the night', () => {
    expect(reviewCard(card(2), false, new Date(2026, 2, 7, 23, 30)).due).toBe('2026-03-08');
  });

  it('gives tomorrow when the clocks go back in the night', () => {
    expect(reviewCard(card(2), false, new Date(2026, 10, 1, 0, 30)).due).toBe('2026-11-02');
  });

  it('keeps the due day on the DST day itself', () => {
    expect(isDue(card(1, '2026-03-08'), new Date(2026, 2, 8, 0, 30))).toBe(true);
    expect(isDue(card(1, '2026-03-09'), new Date(2026, 2, 8, 23, 59))).toBe(false);
  });
});

describe('isDue', () => {
  it('is due on the due day and after it, not before it', () => {
    expect(isDue(card(1, '2026-09-20'), new Date(2026, 8, 19, 23, 59))).toBe(false);
    expect(isDue(card(1, '2026-09-20'), new Date(2026, 8, 20, 0, 0))).toBe(true);
    expect(isDue(card(1, '2026-09-20'), new Date(2026, 9, 1, 12))).toBe(true);
  });
});

describe('exam dates', () => {
  const now = new Date(2026, 8, 20, 10); // box 3 to box 4 gives 2026-10-04

  it('pulls the card to the week before an exam that comes before the next box', () => {
    expect(reviewCard(card(3), true, now, ['2026-10-02']).due).toBe('2026-09-25');
  });

  it('keeps the box gap when it ends inside the week before the exam', () => {
    expect(reviewCard(card(3), true, now, ['2026-10-08']).due).toBe('2026-10-04');
  });

  it('keeps the box gap when the exam comes after the next box', () => {
    expect(reviewCard(card(3), true, now, ['2026-10-20']).due).toBe('2026-10-04');
  });

  it('pulls the card when the box gap ends on the exam day', () => {
    expect(reviewCard(card(3), true, now, ['2026-10-04']).due).toBe('2026-09-27');
  });

  it('keeps the box gap when today is already in the week before the exam', () => {
    // The learner saw the card today, inside that week.
    expect(reviewCard(card(3), true, now, ['2026-09-24']).due).toBe('2026-10-04');
  });

  it('ignores a past exam', () => {
    expect(reviewCard(card(3), true, now, ['2026-09-01']).due).toBe('2026-10-04');
  });

  it('uses the nearest exam, in any order', () => {
    expect(reviewCard(card(5), true, now, ['2026-10-15', '2026-10-01']).due).toBe('2026-09-24');
    expect(reviewCard(card(5), true, now, ['2026-10-01', '2026-10-15']).due).toBe('2026-09-24');
  });

  it('does not change a wrong answer, which is due tomorrow', () => {
    expect(reviewCard(card(3), false, now, ['2026-10-02']).due).toBe('2026-09-21');
  });
});
