import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { clampStep, SPEEDS, stepForKey, type Speed } from './timeline';
import './motion.css';

// The one control bar of every animation island. It holds the visual, so the
// keys work when the learner focuses the visual. It also follows the ScrollStep
// blocks of its part: a block that reaches the middle of the screen moves the
// visual to its step. The island owns the clock (useTimeline) and the visual.
export interface Props {
  /** The accessible name of the visual. */
  title: string;
  /** One caption for each step. */
  captions: string[];
  /** The current step, from 0. */
  step: number;
  playing: boolean;
  speed: Speed;
  onPlay: () => void;
  onPause: () => void;
  /** Go to a step, from 0. Restart, Back, Next, the keys and the scroll all use it. */
  onStep: (step: number) => void;
  onSpeed: (speed: Speed) => void;
  /** The visual: an SVG or the parts of a diagram. */
  children: ComponentChildren;
}

/** The band in the middle of the screen where a ScrollStep block moves the visual. */
const SCROLL_BAND = '-45% 0px -45% 0px';

export default function AnimationControls(props: Props) {
  const { title, captions, step, playing, speed, onPlay, onPause, onStep, onSpeed, children } = props;
  const root = useRef<HTMLDivElement>(null);
  const marks = useRef<HTMLElement[]>([]);
  // The observer lives for the whole mount, so it reads the newest props here.
  const latest = useRef(props);
  latest.current = props;
  const last = captions.length - 1;

  useEffect(() => {
    marks.current = [...(root.current?.closest('section')?.querySelectorAll<HTMLElement>('[data-scroll-step]') ?? [])];
    if (marks.current.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).at(-1);
        const n = Number((hit?.target as HTMLElement | undefined)?.dataset.scrollStep) - 1;
        const { step: now, captions: all, onStep: go } = latest.current;
        if (Number.isInteger(n) && clampStep(n, all.length) !== now) go(clampStep(n, all.length));
      },
      { rootMargin: SCROLL_BAND },
    );
    marks.current.forEach((mark) => observer.observe(mark));
    return () => observer.disconnect();
  }, []);

  // Mark the prose block of the current step, so the text and the picture stay linked.
  useEffect(() => {
    for (const mark of marks.current) mark.toggleAttribute('data-current', Number(mark.dataset.scrollStep) === step + 1);
  }, [step]);

  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    // A select uses the arrows, and a button uses Space. Leave those to the browser.
    if (target.tagName === 'SELECT') return;
    if (event.key === ' ') {
      if (target.tagName === 'BUTTON') return;
      event.preventDefault();
      (playing ? onPause : onPlay)();
      return;
    }
    const n = stepForKey(event.key, step, captions.length);
    if (n === null) return;
    event.preventDefault();
    if (n !== step) onStep(n);
  };

  return (
    <div ref={root} class="mo" role="group" aria-label={title} tabIndex={0} onKeyDown={onKeyDown}>
      <p class="mo-caption" aria-live="polite">
        <strong>
          Step {step + 1} of {captions.length}.
        </strong>{' '}
        {captions[step]}
      </p>
      <div class="mo-visual">{children}</div>
      <div class="mo-bar">
        <button type="button" class="mo-btn" onClick={() => onStep(0)}>
          <span aria-hidden="true">⟲ </span>Restart
        </button>
        <button type="button" class="mo-btn" aria-disabled={step === 0} onClick={() => step > 0 && onStep(step - 1)}>
          Back
        </button>
        <button type="button" class="mo-btn mo-play" onClick={playing ? onPause : onPlay}>
          <span aria-hidden="true">{playing ? '❚❚ ' : '▶ '}</span>
          {playing ? 'Pause' : 'Play'}
        </button>
        <button type="button" class="mo-btn" aria-disabled={step === last} onClick={() => step < last && onStep(step + 1)}>
          Next
        </button>
        <label class="mo-speed">
          Speed
          <select value={speed} onChange={(e) => onSpeed(Number(e.currentTarget.value) as Speed)}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {s}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <p class="mo-keys">Keys: Space plays or pauses. The Left and Right arrow keys step. Home and End go to the first and the last step.</p>
    </div>
  );
}
