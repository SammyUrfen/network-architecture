import { useRef } from 'preact/hooks';
import { byteChar } from '../../diagram/bytes';
import { frame, messageEnds, textToBytes, type FieldKind, type Rule } from '../../../lib/sims/s01-m08-framing';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline } from '../../motion/useTimeline';
import { css, durationsOf, planMotions, toTracks, type Motion, type Spot } from './spots';
import './m08.css';

// The visual of Part 2: the same three messages framed by a fixed length and
// by a delimiter. A marker shows how each reader finds the ends: it counts N
// bytes, or it checks every byte for a newline. The last two steps show the
// cost of each rule. The bytes and the cuts come from the sandbox logic.

const MESSAGES = ['hi', 'hello', 'abc'];
/** Message 3 again, with a newline in its data */
const BROKEN = ['hi', 'hello', 'a\\nc'];
const N = 5;

function row(rule: Exclude<Rule, 'none'>, messages: string[]) {
  const framed = frame(rule, messages.map(textToBytes), N);
  if ('error' in framed) throw new Error(framed.error);
  const kinds: FieldKind[] = framed.frames.flatMap((f) => f.fields.flatMap((field) => field.bytes.map(() => field.kind)));
  return { wire: framed.wire, kinds, ends: messageEnds(rule, N, framed.wire) };
}

const FIXED = row('fixed', MESSAGES);
const DELIM = row('delimiter', MESSAGES);
const BROKE = row('delimiter', BROKEN);
/** The data byte that becomes a newline, and the cut that the newline adds */
const SWAP = BROKE.wire.findIndex((b, i) => b !== DELIM.wire[i]);
const EXTRA = BROKE.ends.find((end) => !DELIM.ends.includes(end))!;
/** The runs of pad bytes, as [first offset, count] */
const PADS = FIXED.kinds.reduce<[number, number][]>((runs, kind, i) => {
  if (kind !== 'pad') return runs;
  const last = runs.at(-1);
  if (last && last[0] + last[1] === i) last[1]++;
  else runs.push([i, 1]);
  return runs;
}, []);
const PAD_COUNT = PADS.reduce((sum, [, count]) => sum + count, 0);

const CAPTIONS = [
  `Fixed length: every message is N = ${N} bytes. The sender fills hi and abc with pad bytes, filler that means nothing, shown as dots.`,
  `The reader counts ${N} bytes and cuts, three times. It never looks at what the bytes say.`,
  'Delimiter: a newline, the invisible byte that ends a line of text, written \\n. The sender puts one after each message. No message needs pad.',
  'The reader checks one byte at a time. When it meets a newline, it cuts.',
  `The cost of a fixed length: ${PAD_COUNT} of the ${FIXED.wire.length} bytes are pad. A message of ${N + 1} bytes does not fit, and N can never change.`,
  `The cost of a delimiter: now message 3 holds a newline, a\\nc. The reader cuts at that newline and finds ${BROKE.ends.length} messages, not 3.`,
];
const STEPS = CAPTIONS.length;

const CELL = 24;
const LEFT = 16;
const CELL_H = 28;
/** The top of the cells of each row */
const TOP = [26, 124];
const HIDE: Spot = { dx: 0, dy: -8, o: 0 };
const SHOW: Spot = { dx: 0, dy: 0, o: 1 };
/** Hidden before step `from` (from 0), shown from its end on */
const showFrom = (from: number) => Array.from({ length: STEPS }, (_, s) => (s < from ? HIDE : SHOW));
/** The time the marker takes for one byte of the delimiter row, and for one hop of N bytes */
const SCAN_MS = 170;
const HOP_MS = 600;
/** A cut appears in this many ms when the marker reaches it. */
const CUT_MS = 180;

const spots: Record<string, Spot[]> = {};
FIXED.wire.forEach((_, i) => (spots[`a${i}`] = showFrom(0)));
spots.ma = showFrom(0);
DELIM.wire.forEach((_, i) => (spots[`b${i}`] = showFrom(2)));
spots.mb = showFrom(2);
spots.pads = showFrom(4);
spots.padNote = showFrom(4);
spots.swap = showFrom(5);
spots.extra = showFrom(5);
spots.swapNote = showFrom(5);
const before = Object.fromEntries(Object.keys(spots).map((key) => [key, HIDE]));
const planned = planMotions(spots, before, 400, 35);

const at = (dx: number) => ({ transform: `translate(${dx}px, 0px)` });
/** A marker walks from its first spot through each spot in `path`, and a cut appears as it passes each end. */
function walk(step: number, key: string, path: number[], stepMs: number, cuts: string[], cutAt: number[]): Motion[] {
  const to = stepMs * path.length;
  return [
    { step, key, frames: [at(0), ...path.map((dx) => at(dx))], from: 0, to },
    ...cuts.map((cut, k) => {
      const reach = stepMs * (cutAt[k] + 1);
      return { step, key: cut, frames: [css(HIDE), css(SHOW)], from: reach, to: reach + CUT_MS };
    }),
  ];
}
const hops = FIXED.ends.map((end) => end * CELL);
const scan = DELIM.wire.slice(1).map((_, i) => (i + 1) * CELL);
const MOTIONS = [
  ...planned,
  ...walk(
    1,
    'ma',
    hops,
    HOP_MS,
    FIXED.ends.map((_, k) => `ca${k}`),
    FIXED.ends.map((_, k) => k),
  ),
  // The delimiter marker checks the byte under it, so it cuts when it reaches the newline, one byte before the end.
  ...walk(
    3,
    'mb',
    scan,
    SCAN_MS,
    DELIM.ends.map((_, k) => `cb${k}`),
    DELIM.ends.map((end) => end - 2),
  ),
];
const TIMELINE = { durations: durationsOf(MOTIONS, STEPS, 300), hold: 4000 };

const cellClass = (kind: FieldKind) => `m08-cell ${kind}`;
const cutX = (end: number) => LEFT + CELL * end;

function Cells({ r, wire, kinds }: { r: 0 | 1; wire: number[]; kinds: FieldKind[] }) {
  const prefix = r === 0 ? 'a' : 'b';
  return (
    <>
      {wire.map((b, i) => (
        <g class={cellClass(kinds[i])} data-key={`${prefix}${i}`} style={css(spots[`${prefix}${i}`][0])} key={i}>
          <rect x={LEFT + CELL * i} y={TOP[r]} width={CELL} height={CELL_H} />
          <text x={LEFT + CELL * i + CELL / 2} y={TOP[r] + 19}>
            {byteChar(b)}
          </text>
        </g>
      ))}
    </>
  );
}

function Cut({ k, end, r }: { k: string; end: number; r: 0 | 1 }) {
  return (
    <line class="m08-cut" data-key={k} style={css(HIDE)} x1={cutX(end)} x2={cutX(end)} y1={TOP[r] - 5} y2={TOP[r] + CELL_H + 5} />
  );
}

export default function TwoRulesDemo({ title }: { title: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => toTracks(svg.current!, MOTIONS));
  const markerY = (r: 0 | 1) => TOP[r] + CELL_H + 4;
  const marker = (x: number, r: 0 | 1) => `M${x} ${markerY(r)} l-6 10 h12 z`;

  return (
    <AnimationControls title={title} captions={CAPTIONS} {...player}>
      <svg
        ref={svg}
        viewBox="0 0 400 196"
        role="img"
        aria-label="Two rows of bytes: three messages framed by a fixed length of 5 bytes, and the same messages framed by a newline delimiter"
      >
        <text class="m08-row" x={LEFT} y={TOP[0] - 10}>
          {`Fixed length: every message is ${N} bytes`}
        </text>
        <Cells r={0} wire={FIXED.wire} kinds={FIXED.kinds} />
        {PADS.length > 0 && (
          <g class="m08-warn" data-key="pads" style={css(HIDE)}>
            {PADS.map(([first, count]) => (
              <rect x={LEFT + CELL * first + 2} y={TOP[0] + 2} width={CELL * count - 4} height={CELL_H - 4} key={first} />
            ))}
          </g>
        )}
        <text class="m08-note" data-key="padNote" style={css(HIDE)} x={LEFT} y={TOP[0] + CELL_H + 34}>
          {`${PAD_COUNT} of ${FIXED.wire.length} bytes are pad`}
        </text>
        {FIXED.ends.map((end, k) => (
          <Cut k={`ca${k}`} end={end} r={0} key={k} />
        ))}
        <path class="m08-marker" data-key="ma" style={css(spots.ma[0])} d={marker(LEFT, 0)} />

        <text class="m08-row" x={LEFT} y={TOP[1] - 10}>
          Delimiter: a newline (\n) ends each message
        </text>
        <Cells r={1} wire={DELIM.wire} kinds={DELIM.kinds} />
        <g class="m08-cell delimiter m08-swap" data-key="swap" style={css(HIDE)}>
          <rect x={LEFT + CELL * SWAP} y={TOP[1]} width={CELL} height={CELL_H} />
          <text x={LEFT + CELL * SWAP + CELL / 2} y={TOP[1] + 19}>
            {byteChar(BROKE.wire[SWAP])}
          </text>
        </g>
        {DELIM.ends.map((end, k) => (
          <Cut k={`cb${k}`} end={end} r={1} key={k} />
        ))}
        <line class="m08-cut m08-extra" data-key="extra" style={css(HIDE)} x1={cutX(EXTRA)} x2={cutX(EXTRA)} y1={TOP[1] - 5} y2={TOP[1] + CELL_H + 5} />
        <path class="m08-marker" data-key="mb" style={css(spots.mb[0])} d={marker(LEFT + CELL / 2, 1)} />
        <text class="m08-note" data-key="swapNote" style={css(HIDE)} x={LEFT} y={TOP[1] + CELL_H + 34}>
          {`${BROKE.ends.length} messages: hi, hello, a, c`}
        </text>
      </svg>
    </AnimationControls>
  );
}
