import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { frameTime, goTo, initialState, pause, play, starts, tick, toKeyframes, type Speed, type Timeline } from './timeline';

/** One motion of one element, inside one step. */
export interface Track {
  /** The step of the motion, from 0. */
  step: number;
  el: Element;
  /** 2 or more keyframes. Animate transform and opacity. The first frame must match the picture at the start of the step. */
  frames: Keyframe[];
  /** The motion runs from `from` ms to `to` ms after the step starts. The default is the whole step. */
  from?: number;
  to?: number;
}

/**
 * The clock of an animation island. Spread the result into AnimationControls.
 * `tracks` runs one time after the island mounts and gives the motions. The
 * hook turns each motion into a paused Web Animations API object and seeks all
 * of them to the same time on each frame, so they stay in step at every speed.
 * A Stepper gives no tracks: it only uses the steps and the hold.
 */
export function useTimeline(timeline: Timeline, tracks?: () => Track[]) {
  const [state, setState] = useState(() => initialState(timeline.durations));
  const animations = useRef<Animation[]>([]);

  useLayoutEffect(() => {
    const at = starts(timeline.durations);
    // Sort by step, so a later step wins over an earlier one on the same element.
    animations.current = (tracks?.() ?? [])
      .sort((a, b) => a.step - b.step)
      .map(({ step, el, frames, from, to }) => {
        const duration = timeline.durations[step];
        const animation = el.animate(toKeyframes(frames, duration, from, to), { delay: at[step], duration, fill: 'forwards' });
        animation.pause();
        return animation;
      });
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setState((s) => ({ ...s, reduce: query.matches }));
    sync();
    query.addEventListener('change', sync);
    return () => {
      query.removeEventListener('change', sync);
      animations.current.forEach((a) => a.cancel());
    };
  }, []);

  // Declared after the effect above, so it seeks the new animations on mount too.
  useLayoutEffect(() => {
    const time = frameTime(state, timeline);
    for (const animation of animations.current) animation.currentTime = time;
  });

  useEffect(() => {
    if (!state.playing) return;
    let last: number | undefined;
    let id = requestAnimationFrame(function frame(now) {
      const dt = last === undefined ? 0 : now - last;
      last = now;
      setState((s) => tick(s, dt, timeline));
      id = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(id);
  }, [state.playing]);

  return {
    step: state.step,
    playing: state.playing,
    speed: state.speed,
    onPlay: () => setState((s) => play(s, timeline)),
    onPause: () => setState(pause),
    onStep: (n: number) => setState((s) => goTo(s, n, timeline)),
    onSpeed: (speed: Speed) => setState((s) => ({ ...s, speed })),
  };
}
