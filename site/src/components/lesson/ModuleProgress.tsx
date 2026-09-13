import { useStore } from '@nanostores/preact';
import { $progress } from '../../lib/progress';

export interface Props {
  /** The module ID, such as s01-m08-framing. */
  id: string;
}

// The bar shows only what the store can prove for one module. Its only prop is
// the module ID, so it knows no totals: it counts answers, not answers left.
// Styles are inline, because this island has no .astro wrapper for a <style>.
export default function ModuleProgress({ id }: Props) {
  const progress = useStore($progress);
  // Item and card IDs start with the session and module: s01-m08-q01, s01-m08-c01.
  const count = (record: object, kind: 'q' | 'c') =>
    Object.keys(record).filter((key) => key.startsWith(`${id.slice(0, 8)}${kind}`)).length;
  const answered = count(progress.answers, 'q');
  const cards = count(progress.cards, 'c');
  const steps = [
    { label: 'Pretest', done: Boolean(progress.modules[id]?.pretest), state: 'done' },
    { label: 'Questions', done: answered > 0, state: `${answered} answered` },
    { label: 'Review cards', done: cards > 0, state: `${cards} added` },
  ];

  return (
    <div style={{ margin: 'var(--space-3) 0', fontSize: 'var(--text-sm)' }}>
      <p style={{ margin: '0 0 var(--space-1)', color: 'var(--text-muted)' }}>
        Your progress: {steps.filter((step) => step.done).length} of {steps.length} steps
      </p>
      <ol style={{ display: 'flex', gap: 'var(--space-2)', margin: 0, padding: 0, listStyle: 'none' }}>
        {steps.map((step) => (
          <li
            style={{
              flex: '1 1 0',
              paddingTop: 'var(--space-1)',
              borderTop: `6px solid ${step.done ? 'var(--correct)' : 'var(--rule)'}`,
            }}
          >
            <span aria-hidden="true">{step.done ? '✓ ' : ''}</span>
            {step.label}: {step.done ? step.state : 'not yet'}
          </li>
        ))}
      </ol>
    </div>
  );
}
