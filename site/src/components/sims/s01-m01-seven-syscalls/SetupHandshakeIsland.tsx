import { useRef } from 'preact/hooks';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline, type Track } from '../../motion/useTimeline';
import './sims.css';

// The visual of Part 2: the three setup calls, then a client that connects
// while the program makes no call. Three columns: the server program, the
// kernel of the server, and the client. The SVG is drawn at the end frame of
// step 1: the first call and socket 3 show, and every later part is hidden.

const STEPS = [
  { caption: 'socket(): the kernel makes a socket and gives the program the number 3.', ms: 900 },
  { caption: 'bind(): the kernel gives socket 3 the port 2026.', ms: 900 },
  { caption: 'listen(): socket 3 now listens, with a line for clients that wait.', ms: 900 },
  {
    caption: 'A client calls connect(). The two kernels trade a few short messages: the handshake. The server program makes no call during it.',
    ms: 2600,
  },
  { caption: 'The kernel puts the finished connection in the line. The program did not call accept() yet, so it does not know about the client.', ms: 1400 },
];
const TIMELINE = { durations: STEPS.map((s) => s.ms), hold: 1800 };
const CAPTIONS = STEPS.map((s) => s.caption);

/** The x of the kernel edge and of the client edge, where the handshake messages start and stop. */
const KERNEL_EDGE = 246;
const CLIENT_EDGE = 304;
const SHAKE_Y = [150, 170, 190];
/** Each handshake message takes this long, one after the other. */
const SHAKE_MS = 700;
const SLOT_X = [134, 172, 210];
const SLOT_Y = 118;

const hide = { opacity: 0 };
const show = { opacity: 1 };
const move = (x: number, y = 0) => `translate(${x}px, ${y}px)`;

export default function SetupHandshakeIsland() {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => {
    const q = (name: string) => svg.current!.querySelector(`[data-part="${name}"]`)!;
    const appear = (step: number, name: string, from?: number, to?: number): Track => ({ step, el: q(name), frames: [hide, show], from, to });
    // A message dot: it shows, travels from one edge to the other, and hides.
    const message = (i: number): Track => {
      const [a, b] = i % 2 === 0 ? [0, KERNEL_EDGE - CLIENT_EDGE] : [KERNEL_EDGE - CLIENT_EDGE, 0];
      return {
        step: 3,
        el: q(`msg-${i}`),
        frames: [
          { opacity: 0, transform: move(a) },
          { opacity: 1, transform: move(a) },
          { opacity: 1, transform: move(b) },
          { opacity: 0, transform: move(b) },
        ],
        from: 300 + i * SHAKE_MS,
        to: 300 + (i + 1) * SHAKE_MS,
      };
    };
    return [
      appear(0, 'call-socket'),
      appear(0, 'socket'),
      appear(1, 'call-bind'),
      appear(1, 'port'),
      appear(2, 'call-listen'),
      appear(2, 'line'),
      appear(3, 'client', 0, 300),
      appear(3, 'no-call', 0, 300),
      message(0),
      message(1),
      message(2),
      appear(3, 'shake-done', 2400, 2600),
      { step: 4, el: q('conn'), frames: [{ opacity: 0, transform: move(150, 0) }, { opacity: 1, transform: move(0, 0) }] },
      appear(4, 'no-accept', 600, 1000),
    ];
  });

  const hidden = { style: { opacity: 0 } };
  return (
    <AnimationControls title="Setup and the handshake" captions={CAPTIONS} {...player}>
      <svg
        ref={svg}
        viewBox="0 0 360 250"
        role="img"
        aria-label="Three columns: the server program, the kernel of the server, and a client. Socket 3 gets port 2026 and a line. A client connects, and the connection waits in the line."
      >
        <text class="mo-label" x="54" y="20">
          Server program
        </text>
        <text class="mo-label" x="182" y="20">
          Kernel of the server
        </text>
        <text class="mo-label" x="326" y="20">
          Client
        </text>
        <rect class="mo-shape" x="6" y="30" width="96" height="212" rx="6" />
        <rect class="mo-shape" x="114" y="30" width="136" height="212" rx="6" />
        <rect class="mo-shape" x="300" y="30" width="54" height="212" rx="6" />

        {/* The calls of the program, one line for each */}
        <text data-part="call-socket" class="s1m1-mono" x="14" y="62">
          socket() = 3
        </text>
        <text data-part="call-bind" class="s1m1-mono" x="14" y="84" {...hidden}>
          bind() = 0
        </text>
        <text data-part="call-listen" class="s1m1-mono" x="14" y="106" {...hidden}>
          listen() = 0
        </text>
        <text data-part="no-call" class="s1m1-note" x="54" y="172" {...hidden}>
          no call
        </text>
        <g data-part="no-accept" {...hidden}>
          <text class="s1m1-note s1m1-note-strong" x="54" y="208">
            no accept()
          </text>
          <text class="s1m1-note s1m1-note-strong" x="54" y="224">
            yet
          </text>
        </g>

        {/* The kernel: socket 3, its port and its line */}
        <g data-part="socket">
          <rect class="s1m1-call" x="124" y="44" width="116" height="36" rx="4" />
          <text class="s1m1-call-label" x="156" y="67">
            socket 3
          </text>
        </g>
        <g data-part="port" {...hidden}>
          <rect class="s1m1-tag" x="190" y="50" width="44" height="24" rx="3" />
          <text class="s1m1-tag-label" x="212" y="67">
            2026
          </text>
        </g>
        <g data-part="line" {...hidden}>
          <text class="mo-label" x="182" y="108">
            line of clients
          </text>
          {SLOT_X.map((x) => (
            <rect key={x} class="s1m1-slot" x={x} y={SLOT_Y} width="32" height="26" rx="3" />
          ))}
        </g>
        <g data-part="conn" {...hidden}>
          <rect class="s1m1-conn" x={SLOT_X[0]} y={SLOT_Y} width="32" height="26" rx="3" />
          <text class="s1m1-conn-label" x={SLOT_X[0] + 16} y={SLOT_Y + 17}>
            client
          </text>
        </g>

        {/* The client and the handshake */}
        <g data-part="client" {...hidden}>
          <rect class="s1m1-conn" x="309" y="44" width="36" height="36" rx="4" />
          <text class="s1m1-conn-label" x="327" y="66">
            client
          </text>
          <text class="s1m1-mono s1m1-small s1m1-mid" x="327" y="100">
            connect()
          </text>
        </g>
        {SHAKE_Y.map((y, i) => (
          <circle key={y} data-part={`msg-${i}`} class="s1m1-msg" cx={CLIENT_EDGE} cy={y} r="6" {...hidden} />
        ))}
        <g data-part="shake-done" {...hidden}>
          <text class="s1m1-note s1m1-note-strong" x="182" y="176">
            handshake done
          </text>
          <text class="s1m1-note" x="182" y="192">
            by the kernel alone
          </text>
        </g>
      </svg>
    </AnimationControls>
  );
}
