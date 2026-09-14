import { useRef } from 'preact/hooks';
import { CELL, PRESETS, buildStream, layoutCells } from '../../../lib/sims/s05-m12-assignment-prep';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline, type Track } from '../../motion/useTimeline';
import './m12.css';

// The visual of part 1: a reader goes through the bytes of two requests on one
// connection. The marker in the left margin finds the empty line, the head
// gives Content-Length, and a box counts the body bytes. The stream is the
// worked example of the page, so every byte number matches the prose. The SVG
// is drawn at the end frame of step 1. Elements with m12-later are hidden
// until the track of their step shows them.
export interface Props {}

const STEPS = [
  { caption: 'One connection brings these 114 bytes: two requests, back to back. No mark in the bytes shows where request 1 stops.', ms: 1500 },
  { caption: 'Read down the head, one line at a time. Every line ends in \\r\\n. A line that holds only \\r\\n is the empty line. The head ends there, at byte 61.', ms: 2400 },
  { caption: 'The head holds Content-Length: 5. So exactly 5 body bytes come after the empty line, and not one more.', ms: 900 },
  { caption: 'Count 5 bytes: h, e, l, l, o, bytes 62 to 66. Request 1 ends there. Byte 67, the G, starts request 2.', ms: 2400 },
  { caption: 'Request 2 has no Content-Length, so it has no body. Its empty line, bytes 112 and 113, is its last part.', ms: 2000 },
];
const TIMELINE = { durations: STEPS.map((s) => s.ms), hold: 3000 };
const CAPTIONS = STEPS.map((s) => s.caption);

const STREAM = buildStream(PRESETS[0].requests);
/** The left edge of the byte cells. The byte number of each row and the marker sit in the margin before it. */
const X0 = 44;
const CELLS = layoutCells(STREAM.text, X0);
/** The top of row 0, and the distance between two rows. A row box is 20 units high, with room under it for small labels. */
const TOP = 8;
const ROW = 32;
const rowTop = (row: number) => TOP + row * ROW;
const ROWS = CELLS.at(-1)!.row + 1;

const [R1, R2] = STREAM.requests;
const BODY = { start: R1.headEnd + 1, end: R1.end };
/** Where each label sits: just after the last cell of a row. */
const afterRow = (row: number) => Math.max(...CELLS.filter((c) => c.row === row).map((c) => c.x + c.width)) + 8;
/** The byte of the Content-Length line and the length of its text, with no \r\n. */
const CL_START = STREAM.text.indexOf('Content-Length');
const CL_END = STREAM.text.indexOf('\r', CL_START) - 1;

/** A box behind bytes a to b, all on one row. */
function Box({ a, b, cls }: { a: number; b: number; cls: string }) {
  const first = CELLS[a];
  const last = CELLS[b];
  return <rect class={cls} x={first.x - 1} y={rowTop(first.row) - 1} width={last.x + last.width - first.x + 2} height={22} rx={3} />;
}

const up = (y: number) => ({ transform: `translateY(${y}px)` });
const right = (x: number) => ({ transform: `translateX(${x}px)` });
const show = [{ opacity: 0 }, { opacity: 1 }];

export default function ReadingAnimationIsland(_: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => {
    const q = (sel: string) => svg.current!.querySelector(sel)!;
    const tracks: Track[] = [];
    // Step 1: the rows arrive, one after another.
    svg.current!.querySelectorAll('.m12-row').forEach((el, i) => {
      tracks.push({ step: 0, el, frames: [{ opacity: 0, ...up(-6) }, { opacity: 1, ...up(0) }], from: i * 150, to: i * 150 + 450 });
    });
    const marker = q('.m12-marker');
    // Step 2: the marker goes down the head, and the empty line lights up.
    tracks.push({ step: 1, el: marker, frames: [0, 1, 2, 3].map((r) => up(r * ROW)), from: 0, to: 1800 });
    tracks.push({ step: 1, el: q('.m12-empty-1'), frames: show, from: 1800, to: 2400 });
    // Step 3: the Content-Length line lights up.
    tracks.push({ step: 2, el: q('.m12-length'), frames: show });
    // Step 4: the marker moves to the body row, and the box counts the body bytes.
    tracks.push({ step: 3, el: marker, frames: [up(3 * ROW), up(4 * ROW)], from: 0, to: 300 });
    const count = q('.m12-counter');
    const hops = [0, 1, 2, 3, 4].map((i) => ({ opacity: 1, ...right(i * CELL.char) }));
    tracks.push({ step: 3, el: count, frames: [{ opacity: 0, ...right(0) }, ...hops, { opacity: 0, ...right(4 * CELL.char) }], from: 0, to: 2000 });
    svg.current!.querySelectorAll('.m12-digit').forEach((el, i) => {
      tracks.push({ step: 3, el, frames: show, from: 300 + i * 300, to: 500 + i * 300 });
    });
    tracks.push({ step: 3, el: q('.m12-edge'), frames: show, from: 1900, to: 2400 });
    // Step 5: the marker goes down request 2 to its empty line.
    tracks.push({ step: 4, el: marker, frames: [4, 5, 6].map((r) => up(r * ROW)), from: 0, to: 1400 });
    tracks.push({ step: 4, el: q('.m12-empty-2'), frames: show, from: 1400, to: 2000 });
    return tracks;
  });

  return (
    <AnimationControls title="Reading two requests on one connection" captions={CAPTIONS} {...player}>
      <svg
        ref={svg}
        class="m12-reading"
        viewBox={`0 0 420 ${rowTop(ROWS) + 4}`}
        role="img"
        aria-label="The 114 bytes of two requests, one row for each line, with the byte number at the start of each row"
      >
        <g class="m12-later m12-empty-1">
          <Box a={R1.headEnd - 1} b={R1.headEnd} cls="m12-hit" />
          <text class="m12-note" x={afterRow(3)} y={rowTop(3) + 15}>
            the empty line: the head ends
          </text>
        </g>
        <g class="m12-later m12-length">
          <Box a={CL_START} b={CL_END} cls="m12-hit" />
          <text class="m12-note" x={afterRow(2)} y={rowTop(2) + 15}>
            so the body is 5 bytes
          </text>
        </g>
        <g class="m12-later m12-edge">
          <Box a={BODY.start} b={BODY.end} cls="m12-body" />
          <line class="m12-cut" x1={CELLS[R2.start].x} x2={CELLS[R2.start].x} y1={rowTop(4) - 5} y2={rowTop(4) + 30} />
          <text class="m12-note" x={CELLS[R2.start].x + 5} y={rowTop(4) + 30}>
            request 2 starts at byte {R2.start}
          </text>
        </g>
        <g class="m12-later m12-empty-2">
          <Box a={R2.headEnd - 1} b={R2.headEnd} cls="m12-hit" />
          <text class="m12-note" x={afterRow(6)} y={rowTop(6) + 15}>
            the empty line: request 2 ends, with no body
          </text>
        </g>
        <rect class="m12-later m12-counter" x={CELLS[BODY.start].x} y={rowTop(4) - 2} width={CELL.char} height={24} rx={2} />

        {Array.from({ length: ROWS }, (_, row) => {
          const cells = CELLS.filter((c) => c.row === row);
          return (
            <g class="m12-row" key={row}>
              <text class="m12-offset" x={X0 - 18} y={rowTop(row) + 15}>
                {cells[0].byte}
              </text>
              {cells.map((c) => (
                <text key={c.byte} class={c.width === CELL.control ? 'm12-byte m12-control' : 'm12-byte'} x={c.x + c.width / 2} y={rowTop(row) + 15}>
                  {c.label}
                </text>
              ))}
            </g>
          );
        })}
        {[0, 1, 2, 3, 4].map((i) => (
          <text key={i} class="m12-later m12-digit" x={CELLS[BODY.start + i].x + CELL.char / 2} y={rowTop(4) + 30}>
            {i + 1}
          </text>
        ))}
        <path class="m12-marker" d={`M${X0 - 13} ${rowTop(0) + 4} L${X0 - 5} ${rowTop(0) + 10} L${X0 - 13} ${rowTop(0) + 16} Z`} />
      </svg>
    </AnimationControls>
  );
}
