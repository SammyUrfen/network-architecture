import { useRef } from 'preact/hooks';
import { groupSlot } from '../../../lib/sims/s01-m08-framing';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline } from '../../motion/useTimeline';
import { css, durationsOf, planMotions, toTracks, type Spot } from './spots';
import './m08.css';

// The visual of Part 1: two writes become one stream of beads, and the reads
// cut that stream in other places on each run. The SVG draws each bead at its
// place in the sender row. Each step says where the beads sit at its end.

const TEXT = 'helloworld';
const WRITES = [5, 5];

interface Step {
  caption: string;
  /** 0 the sender, 1 the stream inside TCP, 2 the receiver */
  row: 0 | 1 | 2;
  /** The group sizes in that row. One empty slot sits between two groups. */
  groups: number[];
  /** The count of beads that the sender wrote so far */
  shown: number;
  /** The byte offsets of the segment edges on the stream */
  segments: number[];
}

const STEPS: Step[] = [
  { caption: 'The sender calls write() with the 5 bytes of hello. Each bead is one byte.', row: 0, groups: WRITES, shown: 5, segments: [] },
  {
    caption: 'The sender calls write() again, with world. Here, a gap still shows where the first write stopped.',
    row: 0,
    groups: WRITES,
    shown: 10,
    segments: [],
  },
  { caption: 'TCP puts all 10 bytes on one stream, like beads on one string. The gap is gone.', row: 1, groups: [10], shown: 10, segments: [] },
  {
    caption: 'TCP sends the stream in pieces called segments, and TCP picks their sizes. Here the segments hold 3, 4 and 3 bytes.',
    row: 1,
    groups: [10],
    shown: 10,
    segments: [3, 7],
  },
  {
    caption: 'The receiver calls read() two times. The first read gets hel. The second read gets the 7 bytes that wait: loworld.',
    row: 2,
    groups: [3, 7],
    shown: 10,
    segments: [3, 7],
  },
  {
    caption: 'Run the same programs again, and the cuts can move. This time the segments and the reads hold 6 and 4 bytes: hellow, then orld.',
    row: 2,
    groups: [6, 4],
    shown: 10,
    segments: [6],
  },
  {
    caption: 'On one computer, one read can get all 10 bytes: helloworld. In every run, nothing shows where hello ended.',
    row: 2,
    groups: [10],
    shown: 10,
    segments: [],
  },
];

/** The width of one bead slot, and the left edge of slot 0 */
const SLOT = 32;
const LEFT = 24;
/** The y of the beads in each row, and of the row label above them */
const ROW_Y = [48, 128, 208];
const LABEL_UP = 26;
const ROW_LABELS = ['Sender: write() calls', 'Inside TCP: one stream of bytes', 'Receiver: what read() returns'];
/** A bead that the sender has not written yet waits this far above its place. */
const DROP = 12;
/** Where the SVG draws the two segment edges */
const TICK_AT = [3, 7];
const MOVE_MS = 520;
const STAGGER_MS = 60;

const beadX = (slot: number) => LEFT + SLOT * slot + SLOT / 2;

const spots: Record<string, Spot[]> = {};
[...TEXT].forEach((_, i) => {
  const home = groupSlot(i, WRITES);
  spots[`b${i}`] = STEPS.map((s) =>
    i < s.shown ? { dx: (groupSlot(i, s.groups) - home) * SLOT, dy: ROW_Y[s.row] - ROW_Y[0], o: 1 } : { dx: 0, dy: -DROP, o: 0 },
  );
});
TICK_AT.forEach((home, k) => {
  let dx = 0;
  spots[`t${k}`] = STEPS.map((s) => {
    const at = s.segments[k];
    if (at === undefined) return { dx, dy: 0, o: 0 };
    dx = (at - home) * SLOT;
    return { dx, dy: 0, o: 1 };
  });
});
const before = Object.fromEntries([...TEXT].map((_, i) => [`b${i}`, { dx: 0, dy: -DROP, o: 0 }]));
const MOTIONS = planMotions(spots, before, MOVE_MS, STAGGER_MS);
const TIMELINE = { durations: durationsOf(MOTIONS, STEPS.length, 300), hold: 4000 };

export default function StreamDemo({ title }: { title: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => toTracks(svg.current!, MOTIONS));
  const start = (key: string) => css(spots[key][0]);

  return (
    <AnimationControls title={title} captions={STEPS.map((s) => s.caption)} {...player}>
      <svg
        ref={svg}
        viewBox="0 0 400 228"
        role="img"
        aria-label="Three rows: the bytes of two writes, one stream of bytes inside TCP, and the reads of the receiver"
      >
        {ROW_LABELS.map((label, r) => (
          <text class="m08-row" x={LEFT} y={ROW_Y[r] - LABEL_UP} key={label}>
            {label}
          </text>
        ))}
        <line class="m08-string" x1={LEFT} x2={LEFT + SLOT * 11} y1={ROW_Y[1]} y2={ROW_Y[1]} />
        {TICK_AT.map((at, k) => (
          <line
            class="m08-tick"
            data-key={`t${k}`}
            style={start(`t${k}`)}
            x1={LEFT + SLOT * at}
            x2={LEFT + SLOT * at}
            y1={ROW_Y[1] - 20}
            y2={ROW_Y[1] + 20}
            key={k}
          />
        ))}
        {[...TEXT].map((char, i) => {
          const x = beadX(groupSlot(i, WRITES));
          return (
            <g class="m08-bead" data-key={`b${i}`} style={start(`b${i}`)} key={i}>
              <circle cx={x} cy={ROW_Y[0]} r="13" />
              <text x={x} y={ROW_Y[0] + 5}>
                {char}
              </text>
            </g>
          );
        })}
      </svg>
    </AnimationControls>
  );
}
