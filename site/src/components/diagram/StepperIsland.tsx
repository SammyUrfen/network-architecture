import AnimationControls from '../motion/AnimationControls';
import { useTimeline } from '../motion/useTimeline';
import { isNewChunk, type Step } from './stepper';

// The island inside Stepper.astro. It uses the shared AnimationControls, so it
// steps with the buttons, the keys and the ScrollStep blocks of its part. A
// step changes the lanes at once, with no motion. Play shows each step for
// STEP_HOLD_MS and stops at a step with an ask, so the learner can predict.
export interface Props {
  /** The accessible name of the stepper. */
  title: string;
  steps: Step[];
}

/** The time that play shows one step at 1x: about 20 words of caption at a slow reading speed. */
const STEP_HOLD_MS = 5000;

export default function StepperIsland({ title, steps }: Props) {
  const player = useTimeline({
    durations: steps.map(() => 0),
    hold: STEP_HOLD_MS,
    stops: steps.map((s) => Boolean(s.ask)),
  });
  const at = player.step;
  const step = steps[at];

  return (
    <AnimationControls title={title} captions={steps.map((s) => s.caption)} {...player}>
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
      {step.ask && (
        <p class="ask">
          <strong>Predict before you press Next:</strong> {step.ask}
        </p>
      )}
    </AnimationControls>
  );
}
