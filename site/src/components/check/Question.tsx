// One quiz item: an answer and a confidence, then a grade with feedback, or a
// locked guess. Not an island: Pretest, Check, ExitQuiz and Predict render it.
import { useEffect, useRef, useState } from 'preact/hooks';
import { gradeChoice, gradeMulti, gradeNumeric, gradeRecall, type Grade, type QuizItem } from '../../lib/grade';
import type { Confidence as Level } from '../../lib/progress';
import Confidence from './Confidence';
import Inline from './Inline';
import { addAnswer, save } from './record';

/** The question types of the two pilot pages. A spot-bug item comes in its options form only. */
export type SupportedItem = Extract<QuizItem, { type: 'mcq' | 'predict' | 'multi' | 'numeric' | 'recall' | 'spot-bug' }>;

export interface Result {
  /** null for a guess at a recall item, which has no grade before the model answer shows. */
  correct: boolean | null;
  /** The answer in words, for "your guess before the lesson". */
  answer: string;
}

export interface Props {
  item: SupportedItem;
  /** The statement of each misconception ID in the item, from the curriculum file. */
  misconceptions: Record<string, string>;
  /** Radio group names start with this. It must be unique on the page. */
  name: string;
  /** guess: lock the answer, with no grade and no feedback. graded: grade, show feedback, and save the answer. */
  mode: 'guess' | 'graded';
  /** Predict asks "why" before it shows the explanation. */
  hideExplanation?: boolean;
  onDone?: (result: Result) => void;
}

export default function Question({ item, misconceptions, name, mode, hideExplanation = false, onDone }: Props) {
  const [picked, setPicked] = useState<number[]>([]);
  const [typed, setTyped] = useState('');
  const [confidence, setConfidence] = useState<Level | null>(null);
  const [phase, setPhase] = useState<'answer' | 'reveal' | 'done'>('answer');
  const [hint, setHint] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [saveProblem, setSaveProblem] = useState<string | null>(null);
  const after = useRef<HTMLDivElement>(null);

  // The button that the learner pressed is gone, so the focus moves to the new content.
  useEffect(() => {
    if (phase !== 'answer') after.current?.focus();
  }, [phase]);

  const options = 'options' in item ? (item.options ?? []) : null;
  const multi = item.type === 'multi';
  const locked = phase !== 'answer';
  const number = Number(typed.trim().replace(/,/g, ''));
  const graded = mode === 'graded' && phase === 'done' && grade !== null;

  function pick(index: number) {
    setPicked(multi ? (picked.includes(index) ? picked.filter((i) => i !== index) : [...picked, index]) : [index]);
  }

  function gradeNow(markedRight: boolean): Grade | null {
    switch (item.type) {
      case 'multi':
        return gradeMulti(item, picked);
      case 'numeric':
        return gradeNumeric(item, number);
      case 'recall':
        return mode === 'graded' ? gradeRecall(item, markedRight, typed) : null;
      default:
        return gradeChoice({ options: options ?? [] }, picked[0]);
    }
  }

  function finish(result: Grade | null) {
    setGrade(result);
    setPhase('done');
    if (mode === 'graded' && result && confidence) {
      setSaveProblem(save((progress) => addAnswer(progress, item.id, result.correct, confidence, new Date())));
    }
    const answer = options
      ? picked.map((i) => options[i].text).join(', ')
      : [typed.trim(), item.type === 'numeric' ? item.answer.unit : null].filter(Boolean).join(' ');
    onDone?.({ correct: result?.correct ?? null, answer });
  }

  function submit(event: Event) {
    event.preventDefault();
    let problem = '';
    if (options && picked.length === 0) problem = multi ? 'Pick one or more answers.' : 'Pick an answer.';
    else if (!options && typed.trim() === '') problem = 'Type an answer first. A short guess is fine.';
    else if (item.type === 'numeric' && Number.isNaN(number)) problem = 'Type a number, such as 42.';
    else if (!confidence) problem = 'Pick how sure you are.';
    setHint(problem);
    if (problem) return;
    if (item.type === 'recall' && mode === 'graded') setPhase('reveal');
    else finish(gradeNow(false));
  }

  // Each wrong pick names its misconception once.
  const myths = graded && options ? [...new Set(picked.flatMap((i) => (options[i].correct ? [] : [options[i].misconception ?? ''])))].filter(Boolean) : [];

  return (
    <form class="chk-question" onSubmit={submit}>
      {options ? (
        <fieldset class="chk-options" disabled={locked}>
          <legend class="chk-prompt">
            <Inline text={item.prompt} />
          </legend>
          {options.map((option, i) => {
            const mine = picked.includes(i);
            const state = !graded ? '' : option.correct ? 'is-right' : mine ? 'is-wrong' : '';
            const mark = !graded ? '' : option.correct ? (mine ? '✓ Your pick' : '✓ Right answer') : mine ? '✗ Your pick' : '';
            return (
              <label key={i} class={`chk-option ${state}`}>
                <input type={multi ? 'checkbox' : 'radio'} name={`${name}-answer`} checked={mine} onChange={() => pick(i)} />
                <span>
                  <Inline text={option.text} />
                </span>
                {mark && <span class="chk-mark">{mark}</span>}
              </label>
            );
          })}
        </fieldset>
      ) : (
        <label class="chk-field">
          <span class="chk-prompt">
            <Inline text={item.prompt} />
          </span>
          {item.type === 'numeric' ? (
            <span class="chk-number">
              <input type="text" inputMode="decimal" autocomplete="off" value={typed} readOnly={locked} onInput={(e) => setTyped(e.currentTarget.value)} />
              {item.answer.unit}
            </span>
          ) : (
            <textarea rows={2} value={typed} readOnly={locked} onInput={(e) => setTyped(e.currentTarget.value)} />
          )}
        </label>
      )}

      {!locked && (
        <>
          <Confidence name={`${name}-confidence`} value={confidence} onChange={setConfidence} />
          <button type="submit">{mode === 'guess' ? 'Lock my guess' : item.type === 'recall' ? 'Show the model answer' : 'Check my answer'}</button>
          <p class="chk-hint" aria-live="polite">
            {hint}
          </p>
        </>
      )}

      <div class="chk-after" ref={after} tabIndex={-1} aria-live="polite">
        {locked && mode === 'guess' && <p class="chk-note">Locked. The lesson answers this question.</p>}
        {locked && mode === 'graded' && item.type === 'recall' && (
          <p class="chk-model">
            <strong>The model answer.</strong> <Inline text={item.model} />
          </p>
        )}
        {phase === 'reveal' && (
          <div class="chk-actions">
            <span>Does your answer match the model answer?</span>
            <button type="button" onClick={() => finish(gradeNow(true))}>
              Yes, it matches
            </button>
            <button type="button" class="chk-secondary" onClick={() => finish(gradeNow(false))}>
              No
            </button>
          </div>
        )}
        {graded && (
          <div class={`chk-result ${grade.correct ? 'is-right' : 'is-wrong'}`}>
            <p>
              <strong>{grade.correct ? '✓ Right.' : '✗ Wrong.'}</strong> <Inline text={grade.feedback} />
            </p>
            {myths.map((id) => (
              <p key={id} class="chk-myth">
                The common mistake: “<Inline text={misconceptions[id] ?? id} />” ({id})
              </p>
            ))}
            {!grade.correct && confidence === 'sure' && (
              <p class="chk-loud">
                <strong>You were sure, and the answer is wrong.</strong> A sure mistake is the easiest kind to fix. This question comes back in your review
                tomorrow.
              </p>
            )}
            {!hideExplanation && item.explanation !== grade.feedback && (
              <p class="chk-why">
                <Inline text={item.explanation} />
              </p>
            )}
            {saveProblem && <p class="chk-note">This answer is not saved. {saveProblem}</p>}
          </div>
        )}
      </div>
    </form>
  );
}
