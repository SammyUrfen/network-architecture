import { useRef } from 'preact/hooks';
import AnimationControls from '../../motion/AnimationControls';
import { useTimeline, type Track } from '../../motion/useTimeline';
import './m03.css';

// The visual of Part 1: the class demo seen from outside. Two program cards
// and the bash terminal that runs them. The server ends and prints nothing.
// Only the shell reports it: a job line "Broken pipe" and the exit status.
// The terminal lines are a bash run on Linux 7.1.8 over loopback
// (2026-09-14), with the spaces of the job line shortened to fit. The SVG is
// drawn at the end frame of step 1: the server runs and waits, and every
// later part is hidden.

const STEPS = [
  { caption: 'You start the server in the background. The shell, bash, prints a job number and the process ID of the server. The server waits for one client.', ms: 900 },
  { caption: 'You start the client. It connects, sends hello, hangs up the hard way at once, and ends.', ms: 1800 },
  { caption: 'The server reads the 5 bytes of hello. Then it sleeps for 1 second.', ms: 1000 },
  { caption: 'The server wakes up and writes hello back two times. Then it is gone. The server itself prints nothing.', ms: 1800 },
  { caption: 'You ask the shell how the server ended. bash prints a short job line, Broken pipe, and the exit status 141.', ms: 1200 },
];
const TIMELINE = { durations: STEPS.map((s) => s.ms), hold: 1800 };
const CAPTIONS = STEPS.map((s) => s.caption);

/** The x of the server edge and of the client edge of the connection line. */
const SERVER_EDGE = 172;
const CLIENT_EDGE = 238;
const LINE_Y = 70;

const hide = { opacity: 0 };
const show = { opacity: 1 };
const move = (x: number) => `translate(${x}px, 0px)`;

export default function VanishIsland() {
  const svg = useRef<SVGSVGElement>(null);
  const player = useTimeline(TIMELINE, () => {
    const q = (name: string) => svg.current!.querySelector(`[data-part="${name}"]`)!;
    const appear = (step: number, name: string, from?: number, to?: number): Track => ({ step, el: q(name), frames: [hide, show], from, to });
    const vanish = (step: number, name: string, from?: number, to?: number): Track => ({ step, el: q(name), frames: [show, hide], from, to });
    // Shows, holds, and hides inside one step. Two tracks on one element in one
    // step would break the rule that a first keyframe matches the start of its step.
    const flash = (step: number, name: string, from?: number, to?: number): Track => ({ step, el: q(name), frames: [hide, show, show, show, hide], from, to });
    const travel = CLIENT_EDGE - SERVER_EDGE;
    return [
      appear(1, 'cmd-client', 0, 200),
      flash(1, 'client', 0, 1800),
      {
        step: 1,
        el: q('hello'),
        frames: [
          { opacity: 0, transform: move(travel) },
          { opacity: 1, transform: move(travel) },
          { opacity: 1, transform: move(0) },
          { opacity: 0, transform: move(0) },
        ],
        from: 300,
        to: 1100,
      },
      appear(1, 'cut', 1100, 1300),
      appear(1, 'c-ended', 1300, 1800),
      vanish(2, 's-waits', 0, 200),
      flash(2, 's-got', 0, 900),
      appear(2, 's-sleeps', 700, 900),
      vanish(3, 's-sleeps', 0, 200),
      flash(3, 's-writes', 0, 1500),
      {
        step: 3,
        el: q('reply'),
        frames: [
          { opacity: 0, transform: move(0) },
          { opacity: 1, transform: move(0) },
          { opacity: 1, transform: move(travel / 2) },
          { opacity: 0, transform: move(travel / 2) },
        ],
        from: 200,
        to: 900,
      },
      vanish(3, 'server', 1000, 1500),
      appear(3, 'gone', 1000, 1500),
      appear(3, 'no-output', 1400, 1800),
      appear(4, 'cmd-wait', 0, 300),
      appear(4, 'job', 400, 700),
      appear(4, 'status', 800, 1200),
    ];
  });

  const hidden = { style: { opacity: 0 } };
  return (
    <AnimationControls title="The server that vanished" captions={CAPTIONS} {...player}>
      <svg
        ref={svg}
        viewBox="0 0 360 272"
        role="img"
        aria-label="Two program cards, the server and the client, above a terminal. The client sends hello and hangs up. The server writes back and disappears with no message. The shell prints Broken pipe and 141."
      >
        {/* The two programs */}
        <g data-part="server">
          <rect class="s1m3-card" x="8" y="30" width="164" height="80" rx="6" />
          <text class="mo-label" x="90" y="52">
            Server program
          </text>
        </g>
        <g data-part="gone" {...hidden}>
          <rect class="s1m3-card s1m3-card-gone" x="8" y="30" width="164" height="80" rx="6" />
          <text class="mo-label" x="90" y="52">
            Server program
          </text>
          <text class="s1m3-big s1m3-bad" x="90" y="92">
            gone
          </text>
        </g>
        <text data-part="s-waits" class="s1m3-status" x="90" y="80">
          waits for a client
        </text>
        <text data-part="s-got" class="s1m3-status" x="90" y="80" {...hidden}>
          reads hello, 5 bytes
        </text>
        <text data-part="s-sleeps" class="s1m3-status" x="90" y="80" {...hidden}>
          sleeps 1 second
        </text>
        <text data-part="s-writes" class="s1m3-status s1m3-strong" x="90" y="80" {...hidden}>
          writes hello back
        </text>

        <g data-part="client" {...hidden}>
          <rect class="s1m3-card" x="238" y="30" width="114" height="80" rx="6" />
          <text class="mo-label" x="295" y="52">
            Client program
          </text>
          <text class="s1m3-status" x="295" y="80">
            sends hello
          </text>
        </g>
        <g data-part="c-ended" {...hidden}>
          <rect class="s1m3-card s1m3-card-gone" x="238" y="30" width="114" height="80" rx="6" />
          <text class="mo-label" x="295" y="52">
            Client program
          </text>
          <text class="s1m3-status" x="295" y="72">
            hung up hard,
          </text>
          <text class="s1m3-status" x="295" y="88">
            ended
          </text>
        </g>

        {/* The connection between them */}
        <line class="s1m3-link" x1={SERVER_EDGE} y1={LINE_Y} x2={CLIENT_EDGE} y2={LINE_Y} />
        <g data-part="hello" style={{ opacity: 0 }}>
          <rect class="s1m3-chip" x={SERVER_EDGE - 2} y={LINE_Y - 20} width="40" height="16" rx="3" />
          <text class="s1m3-chip-label" x={SERVER_EDGE + 18} y={LINE_Y - 8}>
            hello
          </text>
        </g>
        <g data-part="reply" style={{ opacity: 0 }}>
          <rect class="s1m3-chip" x={SERVER_EDGE - 2} y={LINE_Y + 4} width="40" height="16" rx="3" />
          <text class="s1m3-chip-label" x={SERVER_EDGE + 18} y={LINE_Y + 16}>
            hello
          </text>
        </g>
        <g data-part="cut" {...hidden}>
          <path class="s1m3-cut" d={`M ${CLIENT_EDGE - 40} ${LINE_Y - 12} l 8 24 m 6 -24 l 8 24`} />
        </g>

        {/* The terminal */}
        <rect class="s1m3-term" x="8" y="126" width="344" height="138" rx="6" />
        <text class="s1m3-term-title" x="18" y="144">
          Terminal (bash)
        </text>
        <text class="s1m3-cmd" x="18" y="164">
          {'$ ./04_sigpipe_server & pid=$!'}
        </text>
        <text class="s1m3-cmd s1m3-out" x="18" y="180">
          [1] 1137228
        </text>
        <text data-part="cmd-client" class="s1m3-cmd" x="18" y="198" {...hidden}>
          {'$ ./05_sigpipe_client'}
        </text>
        <text data-part="no-output" class="s1m3-note" x="176" y="198" {...hidden}>
          (the server prints nothing)
        </text>
        <text data-part="cmd-wait" class="s1m3-cmd" x="18" y="216" {...hidden}>
          {'$ wait $pid; echo $?'}
        </text>
        <text data-part="job" class="s1m3-cmd s1m3-out" x="18" y="234" {...hidden}>
          [1]+  Broken pipe  ./04_sigpipe_server
        </text>
        <g data-part="status" {...hidden}>
          <rect class="s1m3-hit" x="14" y="239" width="38" height="20" rx="3" />
          <text class="s1m3-cmd s1m3-strong" x="18" y="254">
            141
          </text>
        </g>
      </svg>
    </AnimationControls>
  );
}
