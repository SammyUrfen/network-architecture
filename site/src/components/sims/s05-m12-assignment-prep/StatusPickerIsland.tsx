import { useState } from 'preact/hooks';
import { CARDS, STATUSES, judge, type Status } from '../../../lib/sims/s05-m12-assignment-prep';
import './m12.css';

// The visual of part 3. The learner picks up a request from the assignment
// slide and drops it on the status that it earns: a click on the request, then
// a click on the status, or a drag with a mouse. Both ways work with the
// keyboard through the buttons. The feedback says what is wrong with the
// request. It gives no order of checks (CLAUDE.md rule 4).
export interface Props {}

const DRAG_TYPE = 'text/plain';

export default function StatusPickerIsland(_: Props) {
  const [held, setHeld] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Record<string, Status>>({});
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const holding = CARDS.find((c) => c.id === held);
  const done = Object.keys(placed).length;

  const drop = (code: Status, id: string | null | undefined = held) => {
    const card = CARDS.find((c) => c.id === id);
    if (!card || placed[card.id]) return;
    const result = judge(card, code);
    setFeedback({ correct: result.correct, text: `${card.lines.join(', ')}: ${result.feedback}` });
    if (result.correct) {
      setPlaced((p) => ({ ...p, [card.id]: code }));
      setHeld(null);
    } else setHeld(card.id);
  };
  const restart = () => {
    setHeld(null);
    setPlaced({});
    setFeedback(null);
  };

  return (
    <div class="m12-picker">
      <p class="m12-help">
        Pick up a request, then pick the status that it earns. With a mouse, you can also drag a request onto a status.
      </p>
      <ul class="m12-cards" aria-label="Requests">
        {CARDS.map((card) => {
          const code = placed[card.id];
          return (
            <li key={card.id}>
              <button
                type="button"
                class="m12-card"
                aria-pressed={held === card.id}
                disabled={code !== undefined}
                draggable={code === undefined}
                onClick={() => setHeld(held === card.id ? null : card.id)}
                onDragStart={(e) => {
                  e.dataTransfer?.setData(DRAG_TYPE, card.id);
                  setHeld(card.id);
                }}
              >
                <span class="m12-card-line">{card.lines[0]}</span>
                {card.lines[1] && <span class="m12-card-note">{card.lines[1]}</span>}
                {code !== undefined && (
                  <span class="m12-card-done">
                    <span aria-hidden="true">✓ </span>
                    {code}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p class="m12-holding" aria-live="polite">
        {holding ? (
          <>
            You hold <code>{holding.lines.join(', ')}</code>. Now pick a status.
          </>
        ) : done === CARDS.length ? (
          'All seven requests have their status.'
        ) : (
          'You hold no request.'
        )}
      </p>
      <div class="m12-bins" role="group" aria-label="Statuses">
        {STATUSES.map((s) => (
          <button
            type="button"
            key={s.code}
            class="m12-bin"
            aria-disabled={!holding}
            onClick={() => holding && drop(s.code)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              drop(s.code, e.dataTransfer?.getData(DRAG_TYPE));
            }}
          >
            <span class="m12-bin-code">{s.code}</span>
            <span class="m12-bin-name">{s.name}</span>
          </button>
        ))}
      </div>
      <div class="m12-feedback" aria-live="polite">
        {feedback && (
          <p class={feedback.correct ? 'm12-right' : 'm12-wrong'}>
            <strong>{feedback.correct ? '✓ Right. ' : '✗ Not this one. '}</strong>
            {feedback.text}
          </p>
        )}
      </div>
      <div class="m12-picker-bar">
        <span>
          {done} of {CARDS.length} requests placed.
        </span>
        <button type="button" class="m12-restart" onClick={restart}>
          Start again
        </button>
      </div>
    </div>
  );
}
