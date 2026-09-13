import { useStore } from '@nanostores/preact';
import { useRef } from 'preact/hooks';
import { $progress, updateProgress } from '../../lib/progress';
import { newCard } from '../../lib/schedule';

export interface Props {
  /** The card IDs of one module, in file order. */
  cards: string[];
}

export default function CardsAdded({ cards }: Props) {
  const saved = useStore($progress).cards;
  const status = useRef<HTMLParagraphElement>(null);
  const missing = cards.filter((id) => !saved[id]).length;
  const nextDue = cards
    .map((id) => saved[id]?.due)
    .filter(Boolean)
    .sort()[0];

  function add() {
    const now = new Date();
    updateProgress((p) => {
      // A card that is already in the queue keeps its box and its due day.
      for (const id of cards) p.cards[id] ??= newCard(now);
      return p;
    });
    // The button goes away, so the focus moves to the message that replaces it.
    status.current?.focus();
  }

  return (
    <div class="cards-state">
      <p ref={status} tabIndex={-1} role="status">
        {missing === 0 ? (
          <>
            <span aria-hidden="true">✓ </span>All {cards.length} cards are in your review queue. The next review is on{' '}
            {nextDue}.
          </>
        ) : missing === cards.length ? (
          'These cards are not in your review queue yet.'
        ) : (
          `${cards.length - missing} of ${cards.length} cards are in your review queue.`
        )}
      </p>
      {missing > 0 && (
        <button type="button" onClick={add}>
          {missing === cards.length ? `Add ${missing} cards to my review queue` : `Add the other ${missing} cards`}
        </button>
      )}
    </div>
  );
}
