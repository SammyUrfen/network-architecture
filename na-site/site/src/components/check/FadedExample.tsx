import { useEffect, useRef, useState } from 'preact/hooks';
import Inline from './Inline';
import Reveal from './Reveal';
import './check.css';

export interface Props {
  /** Step 1: a problem with its full solution. */
  worked: { problem: string; steps: string[] };
  /** Step 2: the same kind of problem, with blanks to fill. */
  faded: { problem: string; blanks: Array<{ label: string; answer: string }> };
  /** Step 3: a raw problem. The answer shows after an attempt. */
  yourTurn: { problem: string; answer: string };
}

// A blank matches with case, outer quotes and extra spaces ignored: hello, "hello" and HELLO all match.
const clean = (text: string) =>
  text
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();

export default function FadedExample({ worked, faded, yourTurn }: Props) {
  const [typed, setTyped] = useState(faded.blanks.map(() => ''));
  const [checked, setChecked] = useState(false);
  const [hint, setHint] = useState('');
  const summary = useRef<HTMLParagraphElement>(null);
  const right = faded.blanks.filter((blank, i) => clean(typed[i]) === clean(blank.answer)).length;

  useEffect(() => {
    if (checked) summary.current?.focus();
  }, [checked]);

  function submit(event: Event) {
    event.preventDefault();
    if (typed.some((text) => text.trim() === '')) return setHint('Fill every blank first. A guess is fine.');
    setChecked(true);
  }

  return (
    <section class="chk" aria-label="Worked example, faded example, your turn">
      <p class="chk-kind">Worked example, faded example, your turn</p>

      <p class="chk-step">1. Worked example</p>
      <p>
        <Inline text={worked.problem} />
      </p>
      <ol class="chk-steps">
        {worked.steps.map((step, i) => (
          <li key={i}>
            <Inline text={step} />
          </li>
        ))}
      </ol>

      <p class="chk-step">2. Fill the blanks</p>
      <form class="chk-question" onSubmit={submit}>
        <p>
          <Inline text={faded.problem} />
        </p>
        {faded.blanks.map((blank, i) => {
          const ok = clean(typed[i]) === clean(blank.answer);
          return (
            <label key={i} class="chk-blank">
              <span>{blank.label}</span>
              <input
                type="text"
                autocomplete="off"
                value={typed[i]}
                readOnly={checked}
                onInput={(e) => {
                  const value = e.currentTarget.value;
                  setTyped(typed.map((text, j) => (j === i ? value : text)));
                }}
              />
              {checked && (
                <span class={`chk-mark ${ok ? 'is-right' : 'is-wrong'}`}>
                  {ok ? '✓ Right' : '✗ The answer: '}
                  {!ok && <Inline text={blank.answer} />}
                </span>
              )}
            </label>
          );
        })}
        {checked ? (
          <p class="chk-note" ref={summary} tabIndex={-1}>
            {right} of {faded.blanks.length} blanks right. A wrong blank shows its answer.
          </p>
        ) : (
          <>
            <button type="submit">Check the blanks</button>
            <p class="chk-hint" aria-live="polite">
              {hint}
            </p>
          </>
        )}
      </form>

      <p class="chk-step">3. Your turn</p>
      <Reveal prompt={yourTurn.problem} model={yourTurn.answer} modelLabel="The answer." />
    </section>
  );
}
