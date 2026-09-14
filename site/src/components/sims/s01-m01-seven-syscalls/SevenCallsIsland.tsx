import { useRef } from 'preact/hooks';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline, type Track } from '../../motion/useTimeline';
import './sims.css';

// The map of Part 1: the seven calls of a server in two rows, set up one time
// and a loop for each client. A ring moves to the call of each step. Step 8
// shows the shorter list of a client. The SVG is drawn at the end frame of
// step 1: the ring on socket, the client row hidden.

const SERVER = ['socket', 'bind', 'listen', 'accept', 'read', 'write', 'close'];
const CLIENT = ['socket', 'connect', 'write', 'read', 'close'];

const STEPS = [
  'socket(): the program asks the kernel for a socket, one end of a connection.',
  'bind(): the program asks for a port, such as 2026, so that clients can find the socket.',
  'listen(): the program asks the kernel to take clients on that port and keep them in a line.',
  'accept(): the program asks for the next client from the line. The loop for each client starts here.',
  'read(): the program asks for the bytes that this client sent.',
  'write(): the program asks the kernel to send bytes to this client.',
  'close(): the program ends this connection, then goes back to accept() for the next client.',
  'A client makes a shorter list: socket(), then connect() to reach the server, then write(), read() and close().',
];
const MOVE_MS = 700;
const TIMELINE = { durations: STEPS.map(() => MOVE_MS), hold: 1800 };

/** Box geometry in SVG units. Row 1 uses the first three columns of row 2. */
const BOX_W = 76;
const BOX_H = 34;
const GAP = 10;
const LEFT = 13;
const ROW_Y = [44, 132];
const CLIENT_Y = 222;
const CLIENT_W = 62;
const CLIENT_GAP = 7;
const colX = (col: number) => LEFT + col * (BOX_W + GAP);
/** The column and row of each server call. */
const place = (i: number) => (i < 3 ? { x: colX(i), y: ROW_Y[0] } : { x: colX(i - 3), y: ROW_Y[1] });
const RING_PAD = 4;

const at = (x: number, y: number) => ({ transform: `translate(${x}px, ${y}px)` });

export default function SevenCallsIsland() {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => {
    const q = (name: string) => svg.current!.querySelector(`[data-part="${name}"]`)!;
    const ring = q('ring');
    const origin = place(0);
    const offset = (i: number) => at(place(i).x - origin.x, place(i).y - origin.y);
    const tracks: Track[] = [{ step: 0, el: ring, frames: [{ opacity: 0, ...offset(0) }, { opacity: 1, ...offset(0) }] }];
    for (let i = 1; i < SERVER.length; i++) tracks.push({ step: i, el: ring, frames: [offset(i - 1), offset(i)] });
    tracks.push(
      { step: 7, el: ring, frames: [{ opacity: 1, ...offset(6) }, { opacity: 0, ...offset(6) }], to: 300 },
      { step: 7, el: q('client'), frames: [{ opacity: 0, ...at(0, 10) }, { opacity: 1, ...at(0, 0) }], from: 200 },
    );
    return tracks;
  });

  const box = (label: string, x: number, y: number, w: number, n?: number) => (
    <g key={`${label}-${x}-${y}`}>
      <rect class="s1m1-call" x={x} y={y} width={w} height={BOX_H} rx="4" />
      {n !== undefined && (
        <text class="s1m1-num" x={x + 7} y={y + 12}>
          {n}
        </text>
      )}
      <text class="s1m1-call-label" x={x + w / 2} y={y + 22}>
        {label}
      </text>
    </g>
  );

  const setupEnd = colX(2) + BOX_W / 2;
  const acceptX = colX(0) + BOX_W / 2;
  /** The height of the line from listen to accept, between the two rows. */
  const DROP_Y = ROW_Y[0] + BOX_H + 18;
  const loopTop = ROW_Y[1] + BOX_H;
  return (
    <AnimationControls title="The seven calls of a TCP server" captions={STEPS} {...player}>
      <svg
        ref={svg}
        viewBox="0 0 360 266"
        role="img"
        aria-label="Seven boxes: socket, bind and listen in the first row, marked set up one time. Accept, read, write and close in the second row, marked for each client, with an arrow from close back to accept."
      >
        <text class="mo-label s1m1-row-label" x={LEFT} y={ROW_Y[0] - 10}>
          Set up, one time
        </text>
        <text class="mo-label s1m1-row-label" x={acceptX + 12} y={ROW_Y[1] - 10}>
          For each client, again and again
        </text>
        {SERVER.map((name, i) => box(`${name}()`, place(i).x, place(i).y, BOX_W, i + 1))}
        {/* From listen down to accept, with an arrowhead */}
        <path
          class="mo-arrow"
          d={`M${setupEnd} ${ROW_Y[0] + BOX_H} V${DROP_Y} H${acceptX} V${ROW_Y[1] - 2} M${acceptX - 5} ${ROW_Y[1] - 8} L${acceptX} ${ROW_Y[1] - 2} L${acceptX + 5} ${ROW_Y[1] - 8}`}
        />
        {/* The loop: from close back to accept */}
        <path
          class="mo-arrow"
          d={`M${colX(3) + BOX_W / 2} ${loopTop} V${loopTop + 16} H${colX(0) + BOX_W / 2} V${loopTop + 5} M${colX(0) + BOX_W / 2 - 5} ${loopTop + 10} L${colX(0) + BOX_W / 2} ${loopTop + 4} L${colX(0) + BOX_W / 2 + 5} ${loopTop + 10}`}
        />
        <text class="mo-label" x={colX(1) + BOX_W + GAP / 2} y={loopTop + 30}>
          next client
        </text>
        <g data-part="client" style={{ opacity: 0 }}>
          <text class="mo-label s1m1-row-label" x={LEFT} y={CLIENT_Y - 10}>
            A client
          </text>
          {CLIENT.map((name, i) => box(`${name}()`, LEFT + i * (CLIENT_W + CLIENT_GAP), CLIENT_Y, CLIENT_W))}
        </g>
        <rect
          data-part="ring"
          class="s1m1-ring"
          x={place(0).x - RING_PAD}
          y={place(0).y - RING_PAD}
          width={BOX_W + 2 * RING_PAD}
          height={BOX_H + 2 * RING_PAD}
          rx="7"
        />
      </svg>
    </AnimationControls>
  );
}
