import { useRef } from 'preact/hooks';
import AnimationControls from './AnimationControls';
import { useTimeline } from './useTimeline';

// The sample animation for module packets: three bytes go from a sender,
// through a pipe, to a receiver. It shows the whole pattern: an SVG drawn at
// the end frame of step 1, one track for each motion, and AnimationControls.
// A real lesson visual copies this shape with its own picture.

const STEPS = [
  { caption: 'The sender has three bytes to send. Byte 1 is at the front of the line.', ms: 1200 },
  { caption: 'The sender puts the bytes into the pipe. Byte 1 goes in first, and the other bytes follow in order.', ms: 1800 },
  { caption: 'The receiver takes the bytes out of the pipe. They arrive in the same order: 1, 2, 3.', ms: 1800 },
];
const TIMELINE = { durations: STEPS.map((s) => s.ms), hold: 1500 };
const CAPTIONS = STEPS.map((s) => s.caption);

/** The x of each byte in the sender, front first. Each byte is 24 units wide. */
const BYTE_X = [80, 50, 20];
/** How far the bytes move to sit in the middle of the pipe, and then in the receiver. */
const TO_PIPE = 118;
const TO_RECEIVER = 238;
/** Each byte starts this many ms after the byte in front of it, so the line spreads out and closes again. */
const STAGGER_APPEAR = 250;
const STAGGER_MOVE = 300;

const at = (x: number, y = 0) => ({ transform: `translate(${x}px, ${y}px)` });

export default function BytePipeDemo() {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () =>
    [...svg.current!.querySelectorAll('.mo-token')].flatMap((el, i) => [
      { step: 0, el, frames: [{ opacity: 0, ...at(0, -16) }, { opacity: 1, ...at(0) }], from: i * STAGGER_APPEAR, to: i * STAGGER_APPEAR + 500 },
      { step: 1, el, frames: [at(0), at(TO_PIPE)], from: i * STAGGER_MOVE, to: i * STAGGER_MOVE + 1100 },
      { step: 2, el, frames: [at(TO_PIPE), at(TO_RECEIVER)], from: i * STAGGER_MOVE, to: i * STAGGER_MOVE + 1100 },
    ]),
  );

  return (
    <AnimationControls title="Bytes go through a pipe" captions={CAPTIONS} {...player}>
      <svg ref={svg} viewBox="0 0 360 112" role="img" aria-label="A sender, a pipe and a receiver, with three numbered bytes">
        <text class="mo-label" x="60" y="24">
          Sender
        </text>
        <text class="mo-label" x="180" y="24">
          Pipe
        </text>
        <text class="mo-label" x="300" y="24">
          Receiver
        </text>
        <rect class="mo-shape" x="8" y="36" width="104" height="64" rx="6" />
        <rect class="mo-shape" x="248" y="36" width="104" height="64" rx="6" />
        <rect class="mo-pipe" x="112" y="52" width="136" height="32" />
        <path class="mo-arrow" d="M140 96 H220 M214 91 L220 96 L214 101" />
        {BYTE_X.map((x, i) => (
          <g class="mo-token" key={i}>
            <rect x={x} y="56" width="24" height="24" rx="3" />
            <text x={x + 12} y="72.5">
              {i + 1}
            </text>
          </g>
        ))}
      </svg>
    </AnimationControls>
  );
}
