import { useState } from 'preact/hooks';
import Question, { type Result, type SupportedItem } from './Question';
import { pretestGuesses, save } from './record';
import './check.css';

export interface Props {
  /** The module ID. The pretest writes to the progress of this module. */
  module: string;
  items: SupportedItem[];
  /** The statement of each misconception ID in the items. */
  misconceptions: Record<string, string>;
}

export default function Pretest({ module, items, misconceptions }: Props) {
  const [results, setResults] = useState<Record<string, Result>>({});
  const [saveProblem, setSaveProblem] = useState<string | null>(null);
  const done = Object.keys(results).length === items.length;

  function onDone(id: string, result: Result) {
    pretestGuesses.set(id, result.answer);
    const next = { ...results, [id]: result };
    setResults(next);
    const all = Object.values(next);
    if (all.length < items.length) return;
    // A guess at a recall item has no grade, so a score exists only when every item has a grade.
    const score = all.every((r) => r.correct !== null) ? { right: all.filter((r) => r.correct).length, total: all.length } : undefined;
    setSaveProblem(
      save((progress) => {
        const entry = (progress.modules[module] ??= { startedAt: new Date().toISOString() });
        if (score) entry.pretest = score;
        return progress;
      }),
    );
  }

  return (
    <section class="chk" aria-label="Guess first">
      <p class="chk-kind">Guess first</p>
      <p class="chk-note">Guess before you read. Wrong guesses are normal, and they help the lesson stick. The exit quiz asks these again at the end.</p>
      <ol class="chk-list">
        {items.map((item) => (
          <li key={item.id}>
            <Question item={item} misconceptions={misconceptions} name={`pretest-${item.id}`} mode="guess" onDone={(r) => onDone(item.id, r)} />
          </li>
        ))}
      </ol>
      {done && <p class="chk-note">All guesses are locked. Read on.</p>}
      {saveProblem && <p class="chk-note">The pretest is not saved. {saveProblem}</p>}
    </section>
  );
}
