import { useStore } from '@nanostores/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { $progress, $progressProblem, updateProgress, type Confidence } from '../lib/progress';
import { localDay, newCard, reviewCard } from '../lib/schedule';
import { dueCards, when } from './_queue';

export interface ReviewCard {
  id: string;
  front: string;
  back: string;
  /** "YYYY-MM-DD" dates of the dated assessments that cover the session of the card. */
  examDates: string[];
}

export interface Props {
  cards: ReviewCard[];
  progressHref: string;
}

// The shared check/Confidence picker replaces these buttons in a later step.
const CONFIDENCE: Array<[Confidence, string]> = [
  ['sure', 'Sure'],
  ['think', 'Think so'],
  ['guess', 'Guessing'],
];

export default function ReviewQueue({ cards, progressHref }: Props) {
  const progress = useStore($progress);
  const problem = useStore($progressProblem);
  // The card on the screen stays until "Next card", after its review moves its due day.
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [result, setResult] = useState<{ correct: boolean; due: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const acted = useRef(false);

  const now = new Date();
  const today = localDay(now);
  const due = dueCards(cards, progress.cards, now);
  const card = cards.find((c) => c.id === currentId) ?? due[0];

  // After each step, focus goes to the next thing to read or press. Not on page load.
  useEffect(() => {
    if (!acted.current) return;
    const target = result ? '[data-next]' : confidence ? '[data-mark]' : 'h2';
    root.current?.querySelector<HTMLElement>(target)?.focus();
  }, [card?.id, confidence, result]);

  function pick(level: Confidence) {
    acted.current = true;
    setCurrentId(card.id);
    setConfidence(level);
  }

  function mark(correct: boolean) {
    const at = new Date();
    let next = '';
    updateProgress((p) => {
      // A reset in another tab can remove the card. The review still counts.
      const state = reviewCard(p.cards[card.id] ?? newCard(at), correct, at, card.examDates);
      p.cards[card.id] = state;
      (p.answers[card.id] ??= []).push({ at: at.toISOString(), correct, confidence: confidence! });
      next = state.due;
      return p;
    });
    setResult({ correct, due: next });
  }

  function nextCard() {
    setCurrentId(null);
    setConfidence(null);
    setResult(null);
  }

  const warning = problem && (
    <p class="problem" role="alert">
      <strong>Your progress is not saved.</strong> {problem} <a href={progressHref}>Go to the Progress page</a> to
      fix it.
    </p>
  );

  if (!card) {
    const saved = cards.map((c) => progress.cards[c.id]?.due).filter((d): d is string => Boolean(d));
    const nextDue = saved.sort()[0];
    return (
      <div ref={root}>
        {warning}
        <div class="empty">
          <h2 tabIndex={-1}>No card is due today</h2>
          {saved.length === 0 ? (
            <p>Your review queue is empty. The last block of a lesson page, "Cards added", puts its cards here.</p>
          ) : (
            <p>
              {saved.length} {saved.length === 1 ? 'card is' : 'cards are'} in your queue. The next one is due{' '}
              {when(nextDue, today)}.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={root}>
      {warning}
      <p class="count">
        {due.length} {due.length === 1 ? 'card' : 'cards'} left today
      </p>
      <article class="card">
        <p class="label">Question</p>
        <h2 tabIndex={-1}>{card.front}</h2>
        <div aria-live="polite">
          {!confidence && (
            <fieldset>
              <legend>Say the answer to yourself. How sure are you?</legend>
              <div class="buttons">
                {CONFIDENCE.map(([level, label]) => (
                  <button type="button" onClick={() => pick(level)}>
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          {confidence && (
            <>
              <p class="label">Answer</p>
              <p class="back">{card.back}</p>
            </>
          )}
          {confidence && !result && (
            <fieldset>
              <legend>Was your answer right?</legend>
              <div class="buttons">
                <button type="button" data-mark onClick={() => mark(true)}>
                  I got it right
                </button>
                <button type="button" onClick={() => mark(false)}>
                  I got it wrong
                </button>
              </div>
            </fieldset>
          )}
          {result && (
            <>
              {result.correct ? (
                <p class="result right">
                  <span aria-hidden="true">✓ </span>Right. This card comes back {when(result.due, today)}.
                </p>
              ) : confidence === 'sure' ? (
                <p class="result wrong loud">
                  <strong>
                    <span aria-hidden="true">✗ </span>You were sure, and you missed it.
                  </strong>{' '}
                  Read the answer again now. This is the best moment to fix the idea. The card comes back{' '}
                  {when(result.due, today)}.
                </p>
              ) : (
                <p class="result wrong">
                  <span aria-hidden="true">✗ </span>Missed. This card comes back {when(result.due, today)}.
                </p>
              )}
              <button type="button" data-next onClick={nextCard}>
                {due.length > 0 ? 'Next card' : 'Finish'}
              </button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
