import { useState } from 'preact/hooks';
import Question, { type Result, type SupportedItem } from './Question';
import { pretestGuesses, save } from './record';
import type { TaughtIn } from './taught';
import './check.css';

export interface Props {
  /** The module ID. The exit quiz marks this module as complete. */
  module: string;
  items: SupportedItem[];
  /** The statement of each misconception ID in the items. */
  misconceptions: Record<string, string>;
  /** The "Taught in" link of each item that has one, by item ID. */
  taughtIn: Record<string, TaughtIn>;
}

// The exit quiz reveals every answer, so it asks no confidence (Bibek, 2026-09-14).
export default function ExitQuiz({ module, items, misconceptions, taughtIn }: Props) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [before, setBefore] = useState<{ right: number; total: number } | null>(null);
  const [saveProblem, setSaveProblem] = useState<string | null>(null);
  const all = Object.values(results);
  const done = all.length === items.length;

  function onDone(id: string, result: Result) {
    const next = { ...results, [id]: result };
    setResults(next);
    if (Object.keys(next).length < items.length) return;
    let pretest: typeof before = null;
    setSaveProblem(
      save((progress) => {
        const entry = (progress.modules[module] ??= { startedAt: new Date().toISOString() });
        entry.completedAt ??= new Date().toISOString();
        pretest = entry.pretest ?? null;
        return progress;
      }),
    );
    setBefore(pretest);
  }

  return (
    <section class="chk" aria-label="Exit quiz">
      <p class="chk-kind">Exit quiz</p>
      <p class="chk-note">The questions from the start of the page, again. This time each answer gets a grade and feedback.</p>
      <ol class="chk-list">
        {items.map((item) => (
          <li key={item.id}>
            <Question
              item={item}
              misconceptions={misconceptions}
              name={`exit-${item.id}`}
              mode="graded"
              askConfidence={false}
              taughtIn={taughtIn[item.id]}
              onDone={(r) => onDone(item.id, r)}
            />
            {results[item.id] && pretestGuesses.has(item.id) && (
              <p class="chk-note">Your guess before the lesson: “{pretestGuesses.get(item.id)}”</p>
            )}
          </li>
        ))}
      </ol>
      {done && (
        <p class="chk-summary">
          Now: {all.filter((r) => r.correct).length} of {items.length} right.
          {before && ` Before the lesson: ${before.right} of ${before.total} right.`}
        </p>
      )}
      {saveProblem && <p class="chk-note">The module is not marked complete. {saveProblem}</p>}
    </section>
  );
}
