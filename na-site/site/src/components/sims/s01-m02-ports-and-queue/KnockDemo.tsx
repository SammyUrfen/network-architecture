import { useRef } from 'preact/hooks';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline, type Track } from '../../motion/useTimeline';
import './m02.css';

// The visual of Part 2: a client knocks on port 2026 two times. The first
// time no program owns the port, and the kernel answers RST. The second time
// a program called bind() and listen() but never accept(): the kernel does the
// handshake, queues the connection, and takes the bytes, and the client waits.
// Each message is a dot that runs along its arrow, then the arrow stays.

const CAPTIONS = [
  'No program owns port 2026. The client asks to connect, so it sends a SYN: can we talk?',
  'The kernel on the server finds no program on port 2026. It answers at once with an RST: nobody here.',
  'connect() fails at once with "Connection refused". The failure is fast and loud, so the client knows the problem.',
  'Now a program calls bind() and listen() on port 2026, but never accept(). The client sends a SYN again.',
  'The kernel answers SYN-ACK for the program, and the client answers ACK. The handshake is done, and connect() succeeds.',
  'The kernel puts the connection in the accept queue. The program never calls accept(), so nobody takes it.',
  'The client sends hi. The kernel answers with an ACK and keeps the 2 bytes in memory for the program.',
  'The client waits for a reply that never comes. No error arrives, and it looks like an overloaded server.',
];

/** The x of the client, kernel and program lifelines */
const CX = 40;
const KX = 220;
const PX = 342;
/** A dot runs along its arrow in this many ms. A note fades in over FADE ms. */
const TRAVEL = 900;
const FADE = 350;
const GAP = 150;

interface Msg {
  key: string;
  step: number;
  /** ms after the step starts */
  at: number;
  y: number;
  /** true: from the client to the kernel */
  right: boolean;
  label: string;
  tone?: 'bad';
}
const MSGS: Msg[] = [
  { key: 'a1', step: 0, at: 0, y: 76, right: true, label: 'SYN: can we talk?' },
  { key: 'a2', step: 1, at: 0, y: 106, right: false, label: 'RST: nobody here', tone: 'bad' },
  { key: 'b1', step: 3, at: FADE, y: 214, right: true, label: 'SYN: can we talk?' },
  { key: 'b2', step: 4, at: 0, y: 242, right: false, label: 'SYN-ACK: yes, can we?' },
  { key: 'b3', step: 4, at: TRAVEL + GAP, y: 270, right: true, label: 'ACK: yes' },
  { key: 'b4', step: 6, at: 0, y: 334, right: true, label: 'hi (2 bytes)' },
  { key: 'b5', step: 6, at: TRAVEL + GAP, y: 362, right: false, label: 'ACK: got your bytes' },
];
/** The notes that fade in, with their step and the ms after the step starts */
const NOTES: { key: string; step: number; at: number }[] = [
  { key: 'refused', step: 2, at: 0 },
  { key: 'listens', step: 3, at: 0 },
  { key: 'connected', step: 4, at: 2 * (TRAVEL + GAP) },
  { key: 'queue', step: 5, at: 0 },
  { key: 'never', step: 5, at: FADE + GAP },
  { key: 'buffer', step: 6, at: 2 * (TRAVEL + GAP) },
  { key: 'waits', step: 7, at: 0 },
];

const ends = (m: Msg) => (m.right ? [CX + 4, KX - 4] : [KX - 4, CX + 4]);
const at = (dx: number) => ({ transform: `translate(${dx}px, 0px)` });

/** Every motion, with the key of its element */
const MOTIONS = [
  ...MSGS.flatMap((m) => {
    const [x1, x2] = ends(m);
    return [
      { key: `d-${m.key}`, step: m.step, frames: [at(0), at(x2 - x1)], from: m.at, to: m.at + TRAVEL },
      { key: `d-${m.key}`, step: m.step, frames: [0, 1, 1, 1, 1, 0].map((opacity) => ({ opacity })), from: m.at, to: m.at + TRAVEL },
      { key: `a-${m.key}`, step: m.step, frames: [{ opacity: 0 }, { opacity: 1 }], from: m.at + TRAVEL - GAP, to: m.at + TRAVEL + GAP },
    ];
  }),
  ...NOTES.map((n) => ({ key: n.key, step: n.step, frames: [{ opacity: 0 }, { opacity: 1 }], from: n.at, to: n.at + FADE })),
];
const DURATIONS = CAPTIONS.map((_, step) => Math.max(300, ...MOTIONS.filter((m) => m.step === step).map((m) => m.to)));
const TIMELINE = { durations: DURATIONS, hold: 4000 };

/** The opacity before the island loads: the end frame of step 1 */
const base = (key: string) => ({
  opacity: MOTIONS.some((m) => m.key === key && m.step === 0 && (m.frames.at(-1) as Keyframe).opacity === 1) ? 1 : 0,
});

function Arrow({ m }: { m: Msg }) {
  const [x1, x2] = ends(m);
  const head = m.right ? `M${x2} ${m.y} l-8 -4.5 v9 z` : `M${x2} ${m.y} l8 -4.5 v9 z`;
  return (
    <>
      <g class={m.tone ? `m02-msg ${m.tone}` : 'm02-msg'} data-key={`a-${m.key}`} style={base(`a-${m.key}`)}>
        <line x1={x1} x2={x2} y1={m.y} y2={m.y} />
        <path d={head} />
        <text class="m02-halo" x={(CX + KX) / 2} y={m.y - 6}>
          {m.label}
        </text>
      </g>
      <circle class="m02-dot" data-key={`d-${m.key}`} style={{ opacity: 0 }} cx={x1} cy={m.y} r="5" />
    </>
  );
}

export default function KnockDemo({ title }: { title: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () =>
    MOTIONS.map(({ key, ...motion }): Track => ({ ...motion, el: svg.current!.querySelector(`[data-key="${key}"]`)! })),
  );

  return (
    <AnimationControls title={title} captions={CAPTIONS} {...player}>
      <svg
        ref={svg}
        class="m02-knock"
        viewBox="0 0 400 436"
        role="img"
        aria-label="Three lifelines: the client, the kernel of the server computer, and the server program. The client connects two times."
      >
        <text class="m02-muted" x="273" y="16" text-anchor="middle">
          The server computer
        </text>
        <rect class="m02-machine" x="148" y="24" width="250" height="408" rx="6" />
        {/* The body sits under the label of the server computer. The motions move the elements inside, not this group. */}
        <g transform="translate(0 26)">
        <text class="m02-head" x={CX} y="18">
          Client
        </text>
        <text class="m02-head" x={KX} y="18">
          Kernel
        </text>
        <text class="m02-head" x={PX} y="18">
          Server program
        </text>
        {[CX, KX, PX].map((x) => (
          <line class="m02-life" x1={x} x2={x} y1="26" y2="384" key={x} />
        ))}

        <text class="m02-section m02-halo" x="8" y="46">
          1. No program on port 2026
        </text>
        <text class="m02-muted m02-halo" x={PX} y="84" text-anchor="middle">
          no program
        </text>
        <text class="m02-note bad m02-halo" data-key="refused" style={base('refused')} x="8" y="132">
          ✗ Connection refused, at once
        </text>

        <line class="m02-divider" x1="8" x2="392" y1="148" y2="148" />
        <text class="m02-section m02-halo" x="8" y="170">
          2. A program listens, never accepts
        </text>
        <g data-key="listens" style={base('listens')}>
          <text class="m02-note ok m02-halo" x={PX} y="190" text-anchor="middle">
            bind() ✓
          </text>
          <text class="m02-note ok m02-halo" x={PX} y="206" text-anchor="middle">
            listen() ✓
          </text>
        </g>
        <text class="m02-note ok m02-halo" data-key="connected" style={base('connected')} x="8" y="296">
          ✓ connect() succeeds
        </text>
        <g class="m02-queue" data-key="queue" style={base('queue')}>
          <rect x={KX + 8} y="280" width="108" height="26" rx="3" />
          <text x={KX + 62} y="297" text-anchor="middle">
            in accept queue
          </text>
        </g>
        <g data-key="never" style={base('never')}>
          <text class="m02-note bad m02-halo" x={PX} y="322" text-anchor="middle">
            never calls
          </text>
          <text class="m02-note bad m02-halo" x={PX} y="338" text-anchor="middle">
            accept()
          </text>
        </g>
        <text class="m02-muted m02-halo" data-key="buffer" style={base('buffer')} x={KX + 8} y="380">
          hi waits in memory
        </text>
        <text class="m02-note wait m02-halo" data-key="waits" style={base('waits')} x="8" y="402">
          … the client waits, and no reply comes
        </text>

        {MSGS.map((m) => (
          <Arrow m={m} key={m.key} />
        ))}
        </g>
      </svg>
    </AnimationControls>
  );
}
