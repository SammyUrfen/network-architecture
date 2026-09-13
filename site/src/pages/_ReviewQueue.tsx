import { useStore } from '@nanostores/preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import Confidence from '../components/check/Confidence';
import Inline from '../components/check/Inline';
import '../components/check/check.css';
import { $progress, $progressProblem, updateProgress, type Confidence as Level } from '../lib/progress';
import { localDay, newCard, reviewCard } from '../lib/schedule';
import { dueCards, when } from './_queue';

export interface ReviewCard {
  /** A card ID, or a quiz item ID that a check put in the queue. */
  id: string;
  front: string;
  back: string;
  /** Only a quiz item has one. It shows under the answer. */
  explanation?: string;
  /** "YYYY-MM-DD" dates of the dated assessments that cover the session of the card. */
  examDates: string[];
}

export interface Props {
  cards: ReviewCard[];
  progressHref: string;
}

export default function ReviewQueue({ cards, progressHref }: Props) {
  const progress = useStore($progress);
  const problem = useStore($progressProblem);
  // The card on the screen stays until "Next card", after its review moves its due day.
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<Level | null>(null);
  const [shown, setShown] = useState(false);
  const [hint, setHint] = useState('');
  const [result, setResult] = useState<{ correct: boolean; due: string } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const acted = useRef(false);

  const now = new Date();
  const today = localDay(now);
  const due = dueCards(cards, progress.cards, now);
  const card = cards.find((c) => c.id === currentId) ?? due[0];

  // After each step, focus goes to the next thing to read or press. Not on page load,
  // and not on a confidence pick, so the arrow keys stay in the radio group.
  useEffect(() => {
    if (!acted.current) return;
    const target = result ? '[data-next]' : shown ? '[data-mark]' : 'h2';
    root.current?.querySelector<HTMLElement>(target)?.focus();
  }, [card?.id, shown, result]);

  function pick(level: Level) {
    setCurrentId(card.id);
    setConfidence(level);
    setHint('');
  }

  function show() {
    if (!confidence) return setHint('Pick how sure you are.');
    acted.current = true;
    setShown(true);
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
    setShown(false);
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
        <h2 tabIndex={-1}>
          <Inline text={card.front} />
        </h2>
        <div aria-live="polite">
          {!shown && (
            <>
              <p>Say the answer to yourself.</p>
              <Confidence name={`review-${card.id}-confidence`} value={confidence} onChange={pick} />
              <button type="button" class="btn" onClick={show}>
                Show the answer
              </button>
              <p class="hint">{hint}</p>
            </>
          )}
          {shown && (
            <>
              <p class="label">Answer</p>
              <p class="back">
                <Inline text={card.back} />
              </p>
              {card.explanation && card.explanation !== card.back && (
                <p class="why">
                  <Inline text={card.explanation} />
                </p>
              )}
            </>
          )}
          {shown && !result && (
            <fieldset>
              <legend>Was your answer right?</legend>
              <div class="buttons">
                <button type="button" class="btn" data-mark onClick={() => mark(true)}>
                  I got it right
                </button>
                <button type="button" class="btn" onClick={() => mark(false)}>
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
              <button type="button" class="btn" data-next onClick={nextCard}>
                {due.length > 0 ? 'Next card' : 'Finish'}
              </button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
