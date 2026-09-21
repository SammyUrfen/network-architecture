import { useStore } from '@nanostores/preact';
import { $progress } from '../../lib/progress';
import { localDay } from '../../lib/schedule';

export interface Props {
  /** The module ID, such as s01-m08-framing. */
  id: string;
}

// The bar shows only what the store can prove for one module. Its only prop is
// the module ID, so it knows no totals: it counts answers, not answers left.
// It sits at the bottom of the sidebar, so the steps stack in one narrow column.
// Styles are inline, because this island has no .astro wrapper for a <style>.
export default function ModuleProgress({ id }: Props) {
  const progress = useStore($progress);
  // Item and card IDs start with the session and module: s01-m08-q01, s01-m08-c01.
  const count = (record: object, kind: 'q' | 'c') =>
    Object.keys(record).filter((key) => key.startsWith(`${id.slice(0, 8)}${kind}`)).length;
  const answered = count(progress.answers, 'q');
  const cards = count(progress.cards, 'c');
  // The exit quiz writes completedAt when every exit item has an answer.
  const completedAt = progress.modules[id]?.completedAt;
  // A file from before pretestDoneAt marks a done pretest with its score only.
  const pretestDone = Boolean(progress.modules[id]?.pretestDoneAt || progress.modules[id]?.pretest);
  const steps = [
    { label: 'Pretest', done: pretestDone, state: 'done' },
    { label: 'Questions', done: answered > 0, state: `${answered} answered` },
    { label: 'Review cards', done: cards > 0, state: `${cards} added` },
    { label: 'Done', done: Boolean(completedAt), state: completedAt ? `on ${localDay(new Date(completedAt))}` : '' },
  ];
  const done = steps.filter((step) => step.done).length;

  return (
    <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.4 }}>
      <p style={{ margin: '0 0 var(--space-2)', fontWeight: 600 }}>
        Your progress: {done} of {steps.length} steps
      </p>
      {/* One bar per step. The words below carry the meaning, the bar only repeats it. */}
      <div aria-hidden="true" style={{ display: 'flex', gap: '3px', marginBottom: 'var(--space-2)' }}>
        {steps.map((step) => (
          <span
            style={{
              flex: 1,
              height: '6px',
              borderRadius: 'var(--radius-s)',
              background: step.done ? 'var(--correct)' : 'var(--border)',
            }}
          />
        ))}
      </div>
      <ol style={{ display: 'grid', gap: '2px', margin: 0, padding: 0, listStyle: 'none', color: 'var(--text-muted)' }}>
        {steps.map((step) => (
          <li style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <span aria-hidden="true" style={{ width: '1em', color: step.done ? 'var(--correct)' : 'var(--text-3)' }}>
              {step.done ? '✓' : '○'}
            </span>
            <span>
              {step.label}: {step.done ? step.state : 'not yet'}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
