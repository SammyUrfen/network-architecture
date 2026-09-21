// Client-side helpers that the check islands share.
import { $progressProblem, updateProgress, type Confidence, type Progress } from '../../lib/progress';
import { newCard, reviewCard } from '../../lib/schedule';

/**
 * Adds one graded answer to the progress. A "sure" answer that is wrong joins
 * the review queue, due tomorrow (docs/PEDAGOGY.md, rule 5). Quiz item IDs
 * and card IDs share one namespace (verify rule 6), so the item keeps its
 * review schedule in `cards` under its own ID. An exit quiz answer has no
 * confidence step: it passes null, and the record has no `confidence` field.
 */
export function addAnswer(progress: Progress, itemId: string, correct: boolean, confidence: Confidence | null, now: Date): Progress {
  (progress.answers[itemId] ??= []).push({ at: now.toISOString(), correct, ...(confidence && { confidence }) });
  if (confidence === 'sure' && !correct) progress.cards[itemId] = reviewCard(progress.cards[itemId] ?? newCard(now), false, now);
  return progress;
}

/**
 * Saves a change to the progress. Gives the reason when the change stays in
 * memory only: blocked storage, a full disk, or stored data that the site
 * cannot read. Gives null when the change is saved.
 */
export function save(change: (progress: Progress) => Progress): string | null {
  try {
    updateProgress(change);
    return $progressProblem.get();
  } catch (error) {
    return `The browser refused to save. ${(error as Error).message}`;
  }
}

/**
 * The pretest guesses of this page view, by item ID, for the exit quiz. The
 * progress schema has no field for a typed guess, so a reload clears them.
 */
export const pretestGuesses = new Map<string, string>();
