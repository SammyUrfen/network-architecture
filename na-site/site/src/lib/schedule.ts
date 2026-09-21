// Review schedule: five fixed boxes, capped by known exam dates.
// The rules are in docs/PEDAGOGY.md, "Review queue and practice".
// Every function takes "now" as an argument, so tests control the clock.

/** Days until the next review for a card in box 1 to 5. */
export const BOX_DAYS = [1, 3, 7, 14, 30] as const;

export type Box = 1 | 2 | 3 | 4 | 5;

/** `due` is a calendar day, "YYYY-MM-DD", in the local time zone of the browser. */
export interface CardState {
  box: Box;
  due: string;
  lapses: number;
}

/** The local calendar day of `now`, as "YYYY-MM-DD". */
export function localDay(now: Date): string {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString().slice(0, 10);
}

/**
 * Adds calendar days to a "YYYY-MM-DD" day. The arithmetic runs on UTC
 * midnights, which have no DST, so a 23-hour or 25-hour local day cannot
 * move the result.
 */
export function addDays(day: string, days: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + days)).toISOString().slice(0, 10);
}

/** A card that joins the review queue today. Its first review is tomorrow. */
export function newCard(now: Date): CardState {
  return { box: 1, due: addDays(localDay(now), BOX_DAYS[0]), lapses: 0 };
}

/**
 * The card after one review. A right answer moves it up one box, and box 5
 * stays at 5. A wrong answer moves it to box 1, so it is due tomorrow.
 *
 * `examDates` holds the "YYYY-MM-DD" dates of the known assessments that cover
 * the session of the card. A card must be due at least one time in the 7 days
 * before each of them. When the box gap jumps over those 7 days, the card is
 * due on the first of them.
 */
export function reviewCard(card: CardState, correct: boolean, now: Date, examDates: readonly string[] = []): CardState {
  const today = localDay(now);
  const box: Box = correct ? (Math.min(card.box + 1, 5) as Box) : 1;
  let due = addDays(today, BOX_DAYS[box - 1]);
  for (const exam of examDates) {
    const weekBefore = addDays(exam, -7);
    // When today is already in that week, the review today is the one in that week.
    if (today < weekBefore && due >= exam) due = weekBefore;
  }
  return { box, due, lapses: correct ? card.lapses : card.lapses + 1 };
}

/** True from the due day on. "YYYY-MM-DD" strings compare in date order. */
export function isDue(card: CardState, now: Date): boolean {
  return card.due <= localDay(now);
}
