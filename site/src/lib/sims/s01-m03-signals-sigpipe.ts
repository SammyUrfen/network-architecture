// Pure logic for the two simulators of s01-m03-signals-sigpipe.
//
// The signal board (Part 2): what happens when a signal reaches a process
// that keeps the default, sets a handler, or ignores it, and how the shell
// turns a death by signal into an exit status.
//
// The SIGPIPE demo (Part 4): the instructor pair from the repo, lesson1.
// 05_sigpipe_client.c sends "hello" and closes. 04_sigpipe_server.c reads
// one time, sleeps 1 s, and writes the bytes back two times, with no checks.
// The learner picks how the client closes, what the server does with
// SIGPIPE, and which call the server uses to send.
//
// What this simplifies: one computer (loopback), so a reset from the client
// arrives at once. Over a real network a reset takes a round trip, so more
// writes can succeed before one fails.

// ---------------------------------------------------------------------------
// The signal board

export type SignalName = 'SIGHUP' | 'SIGINT' | 'SIGKILL' | 'SIGPIPE' | 'SIGTERM' | 'SIGSTOP' | 'SIGTSTP';

export interface SignalInfo {
  name: SignalName;
  /** The Linux number on x86 and ARM (signal(7)). */
  number: number;
  /** Who or what makes the kernel send it, in plain words. */
  sender: string;
  /** What the kernel does when the process keeps the default. */
  byDefault: 'end' | 'stop';
  /** SIGKILL and SIGSTOP are the two signals that no handler can catch, and no process can ignore. */
  catchable: boolean;
  /** True when slide 12 of Session 1 gives this number. The others are Linux facts beyond the slides. */
  numberOnSlide: boolean;
}

export const SIGNALS: readonly SignalInfo[] = [
  { name: 'SIGHUP', number: 1, sender: 'The terminal hangs up, for example when an SSH connection drops.', byDefault: 'end', catchable: true, numberOnSlide: false },
  { name: 'SIGINT', number: 2, sender: 'You press Control-C in the terminal.', byDefault: 'end', catchable: true, numberOnSlide: true },
  { name: 'SIGKILL', number: 9, sender: 'A person or a program that must stop the process now, with kill -9.', byDefault: 'end', catchable: false, numberOnSlide: true },
  { name: 'SIGPIPE', number: 13, sender: 'The kernel itself, when the process writes to a connection that the other side ended.', byDefault: 'end', catchable: true, numberOnSlide: true },
  { name: 'SIGTERM', number: 15, sender: 'A person or a program that asks the process to stop, with kill.', byDefault: 'end', catchable: true, numberOnSlide: true },
  { name: 'SIGSTOP', number: 19, sender: 'A person or a program that must pause the process.', byDefault: 'stop', catchable: false, numberOnSlide: false },
  { name: 'SIGTSTP', number: 20, sender: 'You press Control-Z in the terminal.', byDefault: 'stop', catchable: true, numberOnSlide: false },
];

/** What the process asked the kernel to do with one signal. */
export type Setting = 'default' | 'handler' | 'ignore';

/** When a signal N ends a process, a shell such as bash or zsh reports 128 + N. */
export const SIGNAL_STATUS_BASE = 128;

export interface Delivery {
  result: 'ends' | 'stops' | 'handler-runs' | 'ignored';
  /** The exit status that the shell shows, or null when the process does not end. */
  exitStatus: number | null;
  /** True when the setting of the process had no effect, because the signal cannot be caught. */
  settingIgnored: boolean;
  /** What happens, in plain words. */
  says: string;
}

export function signalInfo(name: SignalName): SignalInfo {
  const info = SIGNALS.find((s) => s.name === name);
  if (!info) throw new Error(`unknown signal ${name}`);
  return info;
}

/** What happens when the signal reaches a process with this setting. */
export function deliver(name: SignalName, setting: Setting): Delivery {
  const s = signalInfo(name);
  const settingIgnored = !s.catchable && setting !== 'default';
  const effective: Setting = s.catchable ? setting : 'default';
  if (effective === 'handler') {
    return { result: 'handler-runs', exitStatus: null, settingIgnored, says: `The handler of the process runs for ${s.name}. Then the process goes on, or ends when its own code decides.` };
  }
  if (effective === 'ignore') {
    return { result: 'ignored', exitStatus: null, settingIgnored, says: `The kernel drops ${s.name}, and the process goes on.` };
  }
  const why = settingIgnored ? `No process can catch or ignore ${s.name}. The kernel refuses the setting. ` : '';
  if (s.byDefault === 'stop') {
    return { result: 'stops', exitStatus: null, settingIgnored, says: `${why}The process pauses. It does not end, and it can go on later.` };
  }
  const status = SIGNAL_STATUS_BASE + s.number;
  return { result: 'ends', exitStatus: status, settingIgnored, says: `${why}The process ends at once. The shell shows ${SIGNAL_STATUS_BASE} + ${s.number} = ${status}.` };
}

export interface StatusReading {
  /** The signal number, or null when no signal ended the process. */
  number: number | null;
  /** The signal of the board with that number, if any. */
  signal: SignalInfo | null;
  says: string;
}

/** What an exit status from 0 to 255 tells about how a process ended. */
export function readStatus(status: number): StatusReading | null {
  if (!Number.isInteger(status) || status < 0 || status > 255) return null;
  if (status <= SIGNAL_STATUS_BASE) {
    const how = status === 0 ? 'The process ended normally, with no error.' : `The process ended by itself and chose the number ${status}.`;
    return { number: null, signal: null, says: `${how} A status of ${SIGNAL_STATUS_BASE} or less does not come from a signal.` };
  }
  const number = status - SIGNAL_STATUS_BASE;
  const signal = SIGNALS.find((s) => s.number === number) ?? null;
  const name = signal ? `, ${signal.name}` : ', a signal that this board does not show';
  return { number, signal, says: `${status} - ${SIGNAL_STATUS_BASE} = ${number}. Signal ${number}${name}, ended the process.` };
}

// ---------------------------------------------------------------------------
// The SIGPIPE demo

export type Close = 'fin' | 'rst';
export type SigpipeSetting = 'default' | 'ignore';
export type SendCall = 'write' | 'send-nosignal';

export interface DemoSettings {
  /** fin: a normal close(). rst: SO_LINGER {1, 0}, then close(), as in 05_sigpipe_client.c. */
  close: Close;
  /** default: as in 04_sigpipe_server.c. ignore: signal(SIGPIPE, SIG_IGN) at the start of main. */
  sigpipe: SigpipeSetting;
  /** write: as in 04_sigpipe_server.c. send-nosignal: send(fd, buf, n, MSG_NOSIGNAL) for each write. */
  call: SendCall;
}

export interface DemoLine {
  /** The call and its result, in the short form of strace. Null for a line with no call. */
  trace: string | null;
  /** What the line means, in plain words. */
  says: string;
  kind: 'ok' | 'error' | 'signal' | 'note' | 'end';
}

export interface DemoRun {
  lines: DemoLine[];
  /** The exit status that `wait $pid` gives. */
  exitStatus: number;
  killed: boolean;
}

const BYTES = '"hello"';
const ERRORS = {
  ECONNRESET: 'ECONNRESET (Connection reset by peer)',
  EPIPE: 'EPIPE (Broken pipe)',
} as const;

/** The strace text of one send in the demo, in the short form that the page uses. */
const sendTrace = (call: SendCall, result: string) =>
  call === 'write' ? `write(4, ${BYTES}, 5) = ${result}` : `send(4, ${BYTES}, 5, MSG_NOSIGNAL) = ${result}`;

/**
 * The run of the demo server with these settings, on Linux over loopback.
 *
 * The rule of the Linux kernel (net/core/stream.c, sk_stream_error): a send
 * on a connection with an error first returns that stored error. Only an
 * EPIPE brings SIGPIPE, and MSG_NOSIGNAL turns the signal off for that call.
 * A reset on an open connection stores ECONNRESET. A reset that answers
 * bytes sent to a closed client stores EPIPE. After the error, the
 * connection can send no more, so every later send gets EPIPE.
 */
export function runDemo({ close, sigpipe, call }: DemoSettings): DemoRun {
  const lines: DemoLine[] = [
    { trace: `read(4, ${BYTES}, 4096) = 5`, says: 'The server gets the 5 bytes of hello.', kind: 'ok' },
    close === 'rst'
      ? { trace: null, says: 'The server sleeps 1 s. The client closes with linger 0, so its kernel sends RST. The kernel of the server marks the connection as reset.', kind: 'note' }
      : { trace: null, says: 'The server sleeps 1 s. The client closes normally, so its kernel sends FIN: no more bytes will come from the client.', kind: 'note' },
  ];

  // The first send. A reset is already stored, or the connection can still send.
  let stored: keyof typeof ERRORS | null = close === 'rst' ? 'ECONNRESET' : null;
  let canSend = true;
  const sends = [1, 2].map((n) => {
    if (stored) {
      const error = stored;
      stored = null;
      canSend = false;
      return { n, error };
    }
    if (!canSend) return { n, error: 'EPIPE' as const };
    // The bytes reach the client computer. No program owns that socket any more, so its kernel answers with RST.
    stored = 'EPIPE';
    return { n, error: null };
  });

  let killed = false;
  for (const { n, error } of sends) {
    const which = `The ${n === 1 ? 'first' : 'second'} ${call === 'write' ? 'write' : 'send'}`;
    if (!error) {
      lines.push({
        trace: sendTrace(call, '5'),
        says: `${which} works: the kernel takes the 5 bytes. The client already closed, so its kernel answers with RST.`,
        kind: 'ok',
      });
      continue;
    }
    if (error === 'ECONNRESET') {
      lines.push({ trace: sendTrace(call, `-1 ${ERRORS.ECONNRESET}`), says: `${which} fails with the stored reset error. No signal comes with ECONNRESET.`, kind: 'error' });
      continue;
    }
    lines.push({ trace: sendTrace(call, `-1 ${ERRORS.EPIPE}`), says: `${which} fails with EPIPE: the connection can send no more.`, kind: 'error' });
    if (call === 'send-nosignal') {
      lines.push({ trace: null, says: 'MSG_NOSIGNAL tells the kernel to send no SIGPIPE for this call.', kind: 'note' });
    } else if (sigpipe === 'ignore') {
      lines.push({ trace: null, says: 'The server set SIGPIPE to be ignored, so the kernel drops the signal, and the server goes on.', kind: 'note' });
    } else {
      lines.push({ trace: '--- SIGPIPE ---', says: 'The kernel sends SIGPIPE. Nothing in the server catches it, so the default action ends the server.', kind: 'signal' });
      killed = true;
      break;
    }
  }

  if (killed) {
    lines.push({ trace: '+++ killed by SIGPIPE +++', says: 'The server ends here and prints nothing. The shell shows 128 + 13 = 141.', kind: 'end' });
    return { lines, exitStatus: SIGNAL_STATUS_BASE + signalInfo('SIGPIPE').number, killed };
  }
  lines.push({ trace: '+++ exited with 0 +++', says: 'The server reaches return 0 and ends normally. The shell shows 0. A real server checks each error and closes that client.', kind: 'end' });
  return { lines, exitStatus: 0, killed };
}
