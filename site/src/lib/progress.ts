// Learner progress: one nanostores store that writes through to one versioned
// localStorage key, with export, import and reset (docs/PLAN.md section 3).
//
// Islands prerender at build time, where localStorage does not exist. So this
// module reads storage only when the store gets its first subscriber, never at
// import. A progress widget that shows stored data needs client:only="preact",
// or it must read the store after hydration.
//
// This file does not use @nanostores/persistent. That package reads
// localStorage when the store is made, which is at import, and it cannot
// refuse to overwrite stored data that fails validation.

import { atom, onMount } from 'nanostores';
import type { CardState } from './schedule';

const PROGRESS_KEY = 'na-progress';
const PROGRESS_VERSION = 1;

export type Confidence = 'sure' | 'think' | 'guess';

/**
 * Timestamps are ISO 8601 strings. `pretestDoneAt` marks a pretest with every
 * guess locked, recall guesses too. `pretest` is the score, and only a pretest
 * with a grade for every item has one. A file from before `pretestDoneAt` has
 * only the score, and it is still version 1.
 */
export interface Progress {
  version: typeof PROGRESS_VERSION;
  modules: Record<
    string,
    { startedAt: string; completedAt?: string; pretestDoneAt?: string; pretest?: { right: number; total: number } }
  >;
  answers: Record<string, Array<{ at: string; correct: boolean; confidence: Confidence }>>;
  cards: Record<string, CardState>;
}

export const emptyProgress = (): Progress => ({ version: PROGRESS_VERSION, modules: {}, answers: {}, cards: {} });

export const $progress = atom<Progress>(emptyProgress());

/**
 * Why the stored progress is not in use, or null. While it is set, changes
 * stay in memory and never overwrite the stored data. The progress page shows
 * it, and asks before it calls resetProgress().
 */
export const $progressProblem = atom<string | null>(null);

onMount($progress, () => {
  const stored = readStored();
  if (stored) $progress.set(stored);
});

/**
 * Changes the progress and saves it. `change` gets a fresh copy, so it can
 * change the object in place and return it.
 */
export function updateProgress(change: (progress: Progress) => Progress): void {
  // Read storage again, so a stale copy in this tab cannot overwrite what another tab saved.
  const stored = readStored();
  const next = change(stored ?? structuredClone($progress.get()));
  if (stored) storage()?.setItem(PROGRESS_KEY, JSON.stringify(next));
  $progress.set(next);
}

/** The progress as a JSON file. The theme key is not progress, so it stays out. */
export function exportProgress(): string {
  return JSON.stringify(readStored() ?? $progress.get(), null, 2);
}

/**
 * Replaces all progress with the file. A bad file throws an Error with a
 * message for the learner, before any data changes.
 */
export function importProgress(json: string): void {
  const progress = parseProgress(json);
  $progressProblem.set(null);
  storage()?.setItem(PROGRESS_KEY, JSON.stringify(progress));
  $progress.set(progress);
}

/** Deletes all progress. The page asks the learner first. */
export function resetProgress(): void {
  $progressProblem.set(null);
  storage()?.removeItem(PROGRESS_KEY);
  $progress.set(emptyProgress());
}

/**
 * Validates a progress file and changes no data. Throws an Error with a
 * message for the learner. The progress page calls it before it asks to
 * replace the saved progress.
 */
export function parseProgress(json: string): Progress {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('The file is not JSON.');
  }
  if (!isRecord(data) || !('version' in data)) {
    throw new Error('The file has no progress version. Use a file that the export on this site made.');
  }
  // Version 1 is the first version, so no migration exists yet. A new version
  // adds its migration here.
  if (data.version !== PROGRESS_VERSION) {
    throw new Error(`The file has progress version ${JSON.stringify(data.version)}. This site reads version ${PROGRESS_VERSION} only.`);
  }
  const { modules, answers, cards } = data;
  check(isRecord(modules), 'modules');
  check(isRecord(answers), 'answers');
  check(isRecord(cards), 'cards');
  for (const [id, m] of Object.entries(modules as Record<string, unknown>)) {
    check(
      isRecord(m) &&
        isTime(m.startedAt) &&
        (m.completedAt === undefined || isTime(m.completedAt)) &&
        (m.pretestDoneAt === undefined || isTime(m.pretestDoneAt)) &&
        (m.pretest === undefined ||
          (isRecord(m.pretest) && isCount(m.pretest.total) && isCount(m.pretest.right) && m.pretest.right <= m.pretest.total)),
      `modules.${id}`,
    );
  }
  for (const [id, list] of Object.entries(answers as Record<string, unknown>)) {
    check(
      Array.isArray(list) &&
        list.every((a) => isRecord(a) && isTime(a.at) && typeof a.correct === 'boolean' && ['sure', 'think', 'guess'].includes(a.confidence as string)),
      `answers.${id}`,
    );
  }
  for (const [id, c] of Object.entries(cards as Record<string, unknown>)) {
    check(isRecord(c) && isCount(c.box) && c.box >= 1 && c.box <= 5 && isDay(c.due) && isCount(c.lapses), `cards.${id}`);
  }
  return { version: PROGRESS_VERSION, modules, answers, cards } as Progress;
}

// The stored progress: empty when nothing is stored, or null when this tab
// cannot use storage. Sets $progressProblem to match.
function readStored(): Progress | null {
  const raw = storage()?.getItem(PROGRESS_KEY);
  if (raw === undefined) return null;
  try {
    const progress = raw === null ? emptyProgress() : parseProgress(raw);
    $progressProblem.set(null);
    return progress;
  } catch (error) {
    $progressProblem.set(`The saved progress cannot be read. ${(error as Error).message}`);
    return null;
  }
}

// localStorage, or undefined at build time and when the browser blocks it.
function storage(): Storage | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    $progressProblem.set('This browser blocks storage. Progress stays only until you close the tab. Use the export.');
    return undefined;
  }
}

function check(ok: boolean, path: string): void {
  if (!ok) throw new Error(`The file is not valid progress: "${path}" is missing or wrong.`);
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isCount = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0;

const isDay = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isTime = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value));
