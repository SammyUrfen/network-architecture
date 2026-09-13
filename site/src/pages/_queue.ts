// The pure parts of the review page, out of the island so that a test can run them.
import type { QuizItem } from '../lib/grade';
import { day } from '../lib/url';
import { isDue, type CardState } from '../lib/schedule';

/**
 * The "YYYY-MM-DD" dates of the dated assessments that cover a session.
 * `coversSessions` is a list of session numbers, not a range: [1, 5] means
 * Sessions 1 and 5 only.
 */
export function examDatesFor(session: number, assessments: ReadonlyArray<{ date: Date | null; coversSessions: number[] }>) {
  return assessments.flatMap((a) => (a.date && a.coversSessions.includes(session) ? [day(a.date)] : []));
}

/**
 * A quiz item as a review card: the prompt on the front, the right answer on
 * the back. A check answered "sure" and wrong puts its item ID in
 * `progress.cards` (components/check/record.ts), so the queue needs the item.
 */
export function quizCard(item: QuizItem): { id: string; front: string; back: string; explanation: string } {
  return { id: item.id, front: item.prompt, back: answerOf(item), explanation: item.explanation };
}

// One line for each right option or each step. The review island keeps the line breaks.
function answerOf(item: QuizItem): string {
  if ('options' in item && item.options) {
    return item.options.flatMap((option) => (option.correct ? [option.text] : [])).join('\n');
  }
  if (item.type === 'numeric') {
    const { value, tolerance, unit } = item.answer;
    return [String(value), tolerance ? `± ${tolerance}` : '', unit ?? ''].filter(Boolean).join(' ');
  }
  if (item.type === 'order') return item.items.map((text, i) => `${i + 1}. ${text}`).join('\n');
  if (item.type === 'recall') return item.model;
  if (item.type === 'bytes') return item.answer ?? `Bytes ${item.field?.[0]} to ${item.field?.[1]} of \`${item.hex}\``;
  return item.type === 'spot-bug' ? `Line ${item.bugLines?.join(', ')}` : '';
}

/**
 * The cards with a saved state that is due, the oldest due day first. On the
 * same day, the number at the end of the ID comes next, so the modules mix:
 * every c01 and q01, then every c02 (docs/PEDAGOGY.md, "Interleaving in review").
 */
export function dueCards<T extends { id: string }>(cards: readonly T[], saved: Record<string, CardState>, now: Date): T[] {
  const number = (id: string) => Number(/\d+$/.exec(id)?.[0]);
  return cards
    .filter((card) => saved[card.id] && isDue(saved[card.id], now))
    .sort((a, b) => saved[a.id].due.localeCompare(saved[b.id].due) || number(a.id) - number(b.id) || a.id.localeCompare(b.id));
}

/** "tomorrow, on 2026-09-15" or "in 3 days, on 2026-09-17". Both days are "YYYY-MM-DD". */
export function when(due: string, today: string): string {
  // Both strings parse as UTC midnight, so the difference is a whole number of days.
  const days = (Date.parse(due) - Date.parse(today)) / 86_400_000;
  return `${days === 1 ? 'tomorrow' : `in ${days} days`}, on ${due}`;
}
