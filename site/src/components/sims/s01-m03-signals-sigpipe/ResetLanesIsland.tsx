import { useRef } from 'preact/hooks';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline, type Track } from '../../motion/useTimeline';
import './m03.css';

// The visual of Part 3: the class demo from inside, on Linux. Three columns:
// the server program, the kernel of the server, and the client. The client
// closes with RST, the kernel marks the connection, the first write gets
// ECONNRESET, and the second gets EPIPE and SIGPIPE. The SVG is drawn at the
// end frame of step 1: hello reached the server, and every later part is hidden.

const STEPS = [
  { caption: 'The client sends hello. The server waits inside read() and gets the 5 bytes.', ms: 1400 },
  { caption: 'The server sleeps for 1 second. The client sets linger 0 and calls close(), so its kernel sends RST, not FIN.', ms: 1600 },
  { caption: 'The RST reaches the kernel of the server. The kernel marks the connection as reset. The server still sleeps and knows nothing.', ms: 1000 },
  { caption: 'First write: the kernel reports the reset. write() returns -1 with the error ECONNRESET. No signal comes yet.', ms: 1400 },
  { caption: 'Second write: the connection can send no more. write() returns -1 with the error EPIPE, and the kernel sends SIGPIPE.', ms: 1600 },
  { caption: 'Nothing in the server catches SIGPIPE, so its default action ends the server. The shell shows 141.', ms: 1000 },
];
const TIMELINE = { durations: STEPS.map((s) => s.ms), hold: 1800 };
const CAPTIONS = STEPS.map((s) => s.caption);

/** The edges where messages cross between the columns. */
const PROGRAM_EDGE = 112;
const KERNEL_LEFT = 124;
const KERNEL_RIGHT = 236;
const CLIENT_LEFT = 248;

const hide = { opacity: 0 };
const show = { opacity: 1 };
const move = (x: number, y = 0) => `translate(${x}px, ${y}px)`;

export default function ResetLanesIsland() {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => {
    const q = (name: string) => svg.current!.querySelector(`[data-part="${name}"]`)!;
    const appear = (step: number, name: string, from?: number, to?: number): Track => ({ step, el: q(name), frames: [hide, show], from, to });
    const vanish = (step: number, name: string, from?: number, to?: number): Track => ({ step, el: q(name), frames: [show, hide], from, to });
    // A dot that shows at one x offset, travels to another, and hides.
    const fly = (step: number, name: string, a: number, b: number, from: number, to: number): Track => ({
      step,
      el: q(name),
      frames: [
        { opacity: 0, transform: move(a) },
        { opacity: 1, transform: move(a) },
        { opacity: 1, transform: move(b) },
        { opacity: 0, transform: move(b) },
      ],
      from,
      to,
    });
    return [
      appear(1, 'sleep', 0, 300),
      appear(1, 'c-close', 200, 500),
      fly(1, 'rst', 0, KERNEL_RIGHT - CLIENT_LEFT - 20, 600, 1500),
      appear(1, 'c-ended', 1300, 1600),
      appear(2, 'mark', 0, 400),
      appear(3, 'w1', 0, 300),
      fly(3, 'err1', 0, PROGRAM_EDGE - KERNEL_LEFT - 20, 300, 1000),
      appear(3, 'w1-result', 900, 1300),
      vanish(4, 'mark', 0, 300),
      appear(4, 'dead', 0, 300),
      appear(4, 'w2', 0, 300),
      appear(4, 'w2-result', 400, 700),
      fly(4, 'signal', 0, PROGRAM_EDGE - KERNEL_LEFT - 30, 700, 1500),
      appear(5, 'killed', 0, 500),
    ];
  });

  const hidden = { style: { opacity: 0 } };
  return (
    <AnimationControls title="Inside the demo: a reset, then two writes" captions={CAPTIONS} {...player}>
      <svg
        ref={svg}
        viewBox="0 0 360 290"
        role="img"
        aria-label="Three columns: the server program, the kernel of the server, and the client. The client sends RST. The kernel marks the connection as reset. The first write gets ECONNRESET. The second write gets EPIPE and SIGPIPE, and the server ends with exit status 141."
      >
        <text class="mo-label" x="59" y="18">
          Server program
        </text>
        <text class="mo-label" x="180" y="18">
          Kernel of the server
        </text>
        <text class="mo-label" x="302" y="18">
          Client
        </text>
        <rect class="mo-shape" x="6" y="26" width="106" height="258" rx="6" />
        <rect class="mo-shape" x={KERNEL_LEFT} y="26" width={KERNEL_RIGHT - KERNEL_LEFT} height="258" rx="6" />
        <rect class="mo-shape" x={CLIENT_LEFT} y="26" width="106" height="258" rx="6" />

        {/* The server program: its calls, top to bottom */}
        <text class="s1m3-mono" x="14" y="52">
          read() = 5
        </text>
        <text class="s1m3-status-start" x="14" y="68">
          got hello
        </text>
        <text data-part="sleep" class="s1m3-mono" x="14" y="96" {...hidden}>
          sleep(1)
        </text>
        <text data-part="w1" class="s1m3-mono" x="14" y="130" {...hidden}>
          write() = -1
        </text>
        <text data-part="w1-result" class="s1m3-mono s1m3-warn-text" x="14" y="146" {...hidden}>
          ECONNRESET
        </text>
        <text data-part="w2" class="s1m3-mono" x="14" y="180" {...hidden}>
          write() = -1
        </text>
        <text data-part="w2-result" class="s1m3-mono s1m3-bad" x="14" y="196" {...hidden}>
          EPIPE
        </text>
        <g data-part="killed" {...hidden}>
          <rect class="s1m3-hit s1m3-hit-bad" x="10" y="226" width="98" height="46" rx="4" />
          <text class="s1m3-status s1m3-strong" x="59" y="244">
            killed by
          </text>
          <text class="s1m3-status s1m3-strong" x="59" y="262">
            SIGPIPE: 141
          </text>
        </g>

        {/* The kernel: the connection of the server and its state */}
        <rect class="s1m3-call" x="134" y="38" width="92" height="30" rx="4" />
        <text class="s1m3-mono s1m3-mid" x="180" y="57">
          connection 4
        </text>
        <text class="s1m3-status" x="180" y="86">
          open
        </text>
        <g data-part="mark" {...hidden}>
          <rect class="s1m3-tag s1m3-tag-warn" x="140" y="74" width="80" height="18" rx="3" />
          <text class="s1m3-tag-label" x="180" y="87">
            reset
          </text>
        </g>
        <g data-part="dead" {...hidden}>
          <rect class="s1m3-tag s1m3-tag-bad" x="136" y="74" width="88" height="18" rx="3" />
          <text class="s1m3-tag-label" x="180" y="87">
            cannot send
          </text>
        </g>
        <g data-part="err1" style={{ opacity: 0 }}>
          <rect class="s1m3-chip s1m3-chip-warn" x={KERNEL_LEFT + 8} y="120" width="20" height="16" rx="3" />
          <text class="s1m3-chip-label" x={KERNEL_LEFT + 18} y="132">
            !
          </text>
        </g>
        <g data-part="signal" style={{ opacity: 0 }}>
          <rect class="s1m3-chip s1m3-chip-bad" x={KERNEL_LEFT + 6} y="206" width="62" height="18" rx="3" />
          <text class="s1m3-chip-label" x={KERNEL_LEFT + 37} y="219">
            SIGPIPE
          </text>
        </g>

        {/* The client */}
        <text class="s1m3-status-start" x={CLIENT_LEFT + 8} y="52">
          sent hello
        </text>
        <g data-part="c-close" {...hidden}>
          <text class="s1m3-mono" x={CLIENT_LEFT + 8} y="96">
            linger 0
          </text>
          <text class="s1m3-mono" x={CLIENT_LEFT + 8} y="112">
            close()
          </text>
        </g>
        <g data-part="rst" style={{ opacity: 0 }}>
          <rect class="s1m3-chip s1m3-chip-bad" x={CLIENT_LEFT} y="126" width="34" height="18" rx="3" />
          <text class="s1m3-chip-label" x={CLIENT_LEFT + 17} y="139">
            RST
          </text>
        </g>
        <text data-part="c-ended" class="s1m3-status-start s1m3-strong" x={CLIENT_LEFT + 8} y="176" {...hidden}>
          ended
        </text>
      </svg>
    </AnimationControls>
  );
}
