// A prompt, a box for the answer of the learner, then the model answer. The
// model answer shows only after an attempt. Not an island: ExplainBack,
// FadedExample, ExamPrompts and Predict render it.
import { useEffect, useRef, useState } from 'preact/hooks';
import Inline from './Inline';

export interface Props {
  prompt: string;
  model: string;
  /** The label in front of the model answer. */
  modelLabel?: string;
}

export default function Reveal({ prompt, model, modelLabel = 'The model answer.' }: Props) {
  const [typed, setTyped] = useState('');
  const [shown, setShown] = useState(false);
  const [hint, setHint] = useState('');
  const answer = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (shown) answer.current?.focus();
  }, [shown]);

  function submit(event: Event) {
    event.preventDefault();
    if (typed.trim() === '') return setHint('Type your answer first. A short attempt is fine.');
    setShown(true);
  }

  return (
    <form class="chk-question" onSubmit={submit}>
      <label class="chk-field">
        <span class="chk-prompt">
          <Inline text={prompt} />
        </span>
        <textarea rows={3} value={typed} readOnly={shown} onInput={(e) => setTyped(e.currentTarget.value)} />
      </label>
      {shown ? (
        <p class="chk-model" ref={answer} tabIndex={-1}>
          <strong>{modelLabel}</strong> <Inline text={model} />
        </p>
      ) : (
        <>
          <button type="submit">Show the model answer</button>
          <p class="chk-hint" aria-live="polite">
            {hint}
          </p>
        </>
      )}
    </form>
  );
}
