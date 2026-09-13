// Grading for each question type of the quiz schema (docs/PLAN.md section 3).
// The island passes the item and the answer of the learner. Each function
// gives the result and the one feedback text to show.

// The types come from the quiz schema in content.config.ts. Each item type
// names only the fields that grading reads. The schema has a bytes item with
// `answer` or `field`, and a spot-bug item with `bugLines` or `options`. So
// the island narrows the item before it calls the grade function.
import type { z } from 'astro/zod';
import type { quizItem } from '../content.config';

export type QuizItem = z.infer<typeof quizItem>;
// Not Extract: one schema member has `type: 'mcq' | 'predict' | 'multi'`.
type Having<I, T> = I extends { type: infer U } ? (T extends U ? I : never) : never;
type ItemOf<T extends QuizItem['type']> = Having<QuizItem, T>;

export type Option = ItemOf<'mcq'>['options'][number];

interface Explained {
  explanation: string;
  distractors?: Array<{ value: unknown; feedback: string }>;
}

export type ChoiceItem = Pick<ItemOf<'mcq'>, 'options'>;
export type MultiItem = Pick<ItemOf<'multi'>, 'options' | 'explanation'>;
export type NumericItem = Pick<ItemOf<'numeric'>, 'answer' | 'explanation' | 'distractors'>;
export type OrderItem = Pick<ItemOf<'order'>, 'items' | 'explanation' | 'distractors'>;
export type BytesItem = Pick<ItemOf<'bytes'>, 'explanation' | 'distractors'> & Required<Pick<ItemOf<'bytes'>, 'answer'>>;
export type ByteFieldItem = Pick<ItemOf<'bytes'>, 'explanation' | 'distractors'> & Required<Pick<ItemOf<'bytes'>, 'field'>>;
export type BugLinesItem = Pick<ItemOf<'spot-bug'>, 'explanation'> & Required<Pick<ItemOf<'spot-bug'>, 'bugLines'>>;
export type RecallItem = Pick<ItemOf<'recall'>, 'explanation' | 'distractors'>;

export interface Grade {
  correct: boolean;
  feedback: string;
}

/** mcq, predict, and spot-bug with options. `picked` is the index of the option. */
export function gradeChoice(item: ChoiceItem, picked: number): Grade {
  const option = item.options[picked];
  return { correct: option.correct, feedback: option.feedback };
}

/** multi: right when the picked set equals the correct set. */
export function gradeMulti(item: MultiItem, picked: number[]): Grade {
  const correctIndexes = item.options.flatMap((option, index) => (option.correct ? [index] : []));
  const correct = sameSet(picked, correctIndexes);
  const wrongPicks = item.options.filter((option, index) => !option.correct && picked.includes(index));
  const feedback = correct || wrongPicks.length === 0 ? item.explanation : wrongPicks.map((option) => option.feedback).join(' ');
  return { correct, feedback };
}

/** numeric: right within the tolerance, which is absolute and 0 by default. */
export function gradeNumeric(item: NumericItem, given: number): Grade {
  if (near(given, item.answer.value, item.answer.tolerance ?? 0)) return right(item);
  return wrong(item, (value) => typeof value === 'number' && near(given, value, 0));
}

/** order: `given` holds the item texts in the order of the learner. */
export function gradeOrder(item: OrderItem, given: string[]): Grade {
  if (sameList(given, item.items)) return right(item);
  return wrong(item, (value) => Array.isArray(value) && sameList(given, value));
}

/** bytes, typed: the hex matches with case and spaces ignored. */
export function gradeBytes(item: BytesItem, given: string): Grade {
  if (hex(given) === hex(item.answer)) return right(item);
  return wrong(item, (value) => typeof value === 'string' && hex(value) === hex(given));
}

/** bytes, selected in a dump: `given` is [start, end], counted from 0, end included. */
export function gradeByteField(item: ByteFieldItem, given: [number, number]): Grade {
  if (sameList(given, item.field)) return right(item);
  return wrong(item, (value) => Array.isArray(value) && sameList(given, value));
}

/** spot-bug with code: the picked lines, counted from 1, equal the bug lines. */
export function gradeBugLines(item: BugLinesItem, picked: number[]): Grade {
  return { correct: sameSet(picked, item.bugLines), feedback: item.explanation };
}

/**
 * recall: the learner compares with the model answer and marks it right or
 * wrong. A typed answer that equals a distractor is wrong, whatever the mark.
 */
export function gradeRecall(item: RecallItem, markedRight: boolean, typed = ''): Grade {
  const hit = item.distractors?.find((d) => typeof d.value === 'string' && words(d.value) === words(typed));
  if (hit) return { correct: false, feedback: hit.feedback };
  return { correct: markedRight, feedback: item.explanation };
}

const right = (item: Explained): Grade => ({ correct: true, feedback: item.explanation });

// A wrong answer that equals a distractor shows its feedback. Any other wrong
// answer shows the explanation.
function wrong(item: Explained, matches: (value: unknown) => boolean): Grade {
  const hit = item.distractors?.find((d) => matches(d.value));
  return { correct: false, feedback: hit ? hit.feedback : item.explanation };
}

// The small slack absorbs binary floating-point error: 1.3 - 1.2 is
// 0.10000000000000009, and it must pass a tolerance of 0.1.
const near = (a: number, b: number, tolerance: number) =>
  Math.abs(a - b) <= tolerance + 1e-9 * Math.max(1, Math.abs(b));

const sameList = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

function sameSet(a: readonly number[], b: readonly number[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);
  return setA.size === setB.size && [...setA].every((x) => setB.has(x));
}

const hex = (text: string) => text.replace(/\s+/g, '').toLowerCase();

const words = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();
