import { useState } from 'preact/hooks';
import { clampStep, isNewChunk, stepForKey, type Step } from './stepper';

// The island inside Stepper.astro. No autoplay: the learner moves with Back
// and Next, or with the arrow keys, Home and End (PEDAGOGY rule 7).
export interface Props {
  /** The accessible name of the stepper. */
  title: string;
  steps: Step[];
}

export default function StepperIsland({ title, steps }: Props) {
  const [at, setAt] = useState(0);
  const step = steps[at];
  const last = steps.length - 1;
  const go = (n: number) => setAt(clampStep(n, steps.length));

  const onKeyDown = (event: KeyboardEvent) => {
    const target = stepForKey(event.key, at, steps.length);
    if (target === null) return;
    event.preventDefault();
    go(target);
  };

  return (
    <div class="stepper" role="group" aria-label={title} onKeyDown={onKeyDown}>
      <div class="lanes">
        {step.lanes.map((lane, l) => (
          <div class="lane" key={lane.label}>
            <span class="lane-label">{lane.label}</span>
            <span class="chunks">
              {lane.chunks.length === 0 ? (
                <span class="empty">empty</span>
              ) : (
                lane.chunks.map((chunk, c) => {
                  const fresh = isNewChunk(steps, at, l, c);
                  return (
                    <span class={fresh ? 'chunk new' : 'chunk'} key={c}>
                      {chunk}
                      {fresh && <span class="sr-only"> (new)</span>}
                    </span>
                  );
                })
              )}
            </span>
          </div>
        ))}
      </div>
      <p class="caption" aria-live="polite">
        <strong>
          Step {at + 1} of {steps.length}.
        </strong>{' '}
        {step.caption}
      </p>
      {step.ask && (
        <p class="ask">
          <strong>Predict before you press Next:</strong> {step.ask}
        </p>
      )}
      <div class="controls">
        <button type="button" aria-disabled={at === 0} onClick={() => go(at - 1)}>
          Back
        </button>
        <button type="button" aria-disabled={at === last} onClick={() => go(at + 1)}>
          Next
        </button>
        <span class="keys">Keys: ← → Home End</span>
      </div>
    </div>
  );
}
