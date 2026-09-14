import { describe, expect, it } from 'vitest';
import { deliver, readStatus, runDemo, SIGNALS, type Close, type SendCall, type SigpipeSetting } from './s01-m03-signals-sigpipe';

// The test vectors come from runs of copies of 04_sigpipe_server.c and
// 05_sigpipe_client.c (instructor repo, lesson1) on a spare port: Fedora,
// Linux 7.1.8, x86_64, loopback, 2026-09-14. Each setting ran 5 times with
// `wait $pid; echo $?`, then one time under
// `strace -e trace=read,write,sendto -e signal=SIGPIPE`.
// The "ignore" copy adds signal(SIGPIPE, SIG_IGN) at the start of main. The
// "send-nosignal" copy calls send(fd, buf, n, MSG_NOSIGNAL). The "fin" client
// leaves out the SO_LINGER lines, so close() sends FIN.

/** strace output as the short lines of the simulator. */
function short(trace: string, ignored: boolean): string[] {
  return (
    trace
      .trim()
      .split('\n')
      .map((line) => line.replace(/\s+=\s+/, ' = '))
      // glibc sends with the sendto system call. The page teaches send().
      .map((line) => line.replace(/^sendto\((\d+), ("[^"]*"), (\d+), MSG_NOSIGNAL, NULL, 0\)/, 'send($1, $2, $3, MSG_NOSIGNAL)'))
      .map((line) => (line.startsWith('--- SIGPIPE') ? '--- SIGPIPE ---' : line))
      // strace traces the process, and the kernel shows a traced process even an
      // ignored signal (sig_ignored() in kernel/signal.c). Without strace, the
      // kernel drops it. The simulator shows the run without strace.
      .filter((line) => !(ignored && line === '--- SIGPIPE ---'))
  );
}

const traces = (run: ReturnType<typeof runDemo>) => run.lines.flatMap((line) => (line.trace ? [line.trace] : []));

const VERIFIED: { close: Close; sigpipe: SigpipeSetting; call: SendCall; exit: number; strace: string }[] = [
  {
    close: 'rst', sigpipe: 'default', call: 'write', exit: 141,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
write(4, "hello", 5)                    = -1 ECONNRESET (Connection reset by peer)
write(4, "hello", 5)                    = -1 EPIPE (Broken pipe)
--- SIGPIPE {si_signo=SIGPIPE, si_code=SI_USER, si_pid=1116096, si_uid=1000} ---
+++ killed by SIGPIPE +++`,
  },
  {
    close: 'rst', sigpipe: 'default', call: 'send-nosignal', exit: 0,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = -1 ECONNRESET (Connection reset by peer)
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = -1 EPIPE (Broken pipe)
+++ exited with 0 +++`,
  },
  {
    close: 'rst', sigpipe: 'ignore', call: 'write', exit: 0,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
write(4, "hello", 5)                    = -1 ECONNRESET (Connection reset by peer)
write(4, "hello", 5)                    = -1 EPIPE (Broken pipe)
--- SIGPIPE {si_signo=SIGPIPE, si_code=SI_USER, si_pid=1116234, si_uid=1000} ---
+++ exited with 0 +++`,
  },
  {
    close: 'rst', sigpipe: 'ignore', call: 'send-nosignal', exit: 0,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = -1 ECONNRESET (Connection reset by peer)
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = -1 EPIPE (Broken pipe)
+++ exited with 0 +++`,
  },
  {
    close: 'fin', sigpipe: 'default', call: 'write', exit: 141,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
write(4, "hello", 5)                    = 5
write(4, "hello", 5)                    = -1 EPIPE (Broken pipe)
--- SIGPIPE {si_signo=SIGPIPE, si_code=SI_USER, si_pid=1116406, si_uid=1000} ---
+++ killed by SIGPIPE +++`,
  },
  {
    close: 'fin', sigpipe: 'default', call: 'send-nosignal', exit: 0,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = 5
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = -1 EPIPE (Broken pipe)
+++ exited with 0 +++`,
  },
  {
    close: 'fin', sigpipe: 'ignore', call: 'write', exit: 0,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
write(4, "hello", 5)                    = 5
write(4, "hello", 5)                    = -1 EPIPE (Broken pipe)
--- SIGPIPE {si_signo=SIGPIPE, si_code=SI_USER, si_pid=1116700, si_uid=1000} ---
+++ exited with 0 +++`,
  },
  {
    close: 'fin', sigpipe: 'ignore', call: 'send-nosignal', exit: 0,
    strace: String.raw`
read(4, "hello", 4096)                  = 5
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = 5
sendto(4, "hello", 5, MSG_NOSIGNAL, NULL, 0) = -1 EPIPE (Broken pipe)
+++ exited with 0 +++`,
  },
];

describe('the SIGPIPE demo', () => {
  it.each(VERIFIED)('close=$close sigpipe=$sigpipe call=$call matches the Linux run', ({ close, sigpipe, call, exit, strace }) => {
    const run = runDemo({ close, sigpipe, call });
    expect(traces(run)).toEqual(short(strace, sigpipe === 'ignore' && call === 'write'));
    expect(run.exitStatus).toBe(exit);
    expect(run.killed).toBe(exit === 141);
  });

  it('kills the class demo on the second write, not the first', () => {
    const run = runDemo({ close: 'rst', sigpipe: 'default', call: 'write' });
    const writes = run.lines.filter((line) => line.trace?.startsWith('write('));
    expect(writes).toHaveLength(2);
    expect(writes[0].kind).toBe('error');
    expect(writes[0].trace).toContain('ECONNRESET');
    expect(run.lines.at(-2)?.kind).toBe('signal');
    expect(run.lines.at(-1)?.says).toContain('141');
  });

  it('gives every setting one read, two sends and one end line', () => {
    for (const { close, sigpipe, call } of VERIFIED) {
      const run = runDemo({ close, sigpipe, call });
      expect(run.lines.filter((line) => line.trace?.startsWith('read(')).length).toBe(1);
      expect(run.lines.filter((line) => /^(write|send)\(/.test(line.trace ?? '')).length).toBe(2);
      expect(run.lines.filter((line) => line.kind === 'end').length).toBe(1);
    }
  });
});

describe('the signal board', () => {
  // bash 5 on the same machine: `sleep 5 & p=$!; kill -SIG $p; wait $p; echo $?`
  it.each([
    [129, 'SIGHUP'],
    [130, 'SIGINT'],
    [137, 'SIGKILL'],
    [141, 'SIGPIPE'],
    [143, 'SIGTERM'],
  ])('reads exit status %i as %s', (status, name) => {
    expect(readStatus(status)?.signal?.name).toBe(name);
    expect(deliver(name as never, 'default').exitStatus).toBe(status);
  });

  it('uses the Linux numbers of kill -l on x86', () => {
    // kill -l 1 2 9 13 15 19 20 printed HUP INT KILL PIPE TERM STOP TSTP.
    expect(SIGNALS.map((s) => s.number)).toEqual([1, 2, 9, 13, 15, 19, 20]);
  });

  it('lets no setting change SIGKILL or SIGSTOP', () => {
    for (const setting of ['handler', 'ignore'] as const) {
      expect(deliver('SIGKILL', setting)).toMatchObject({ result: 'ends', exitStatus: 137, settingIgnored: true });
      expect(deliver('SIGSTOP', setting)).toMatchObject({ result: 'stops', exitStatus: null, settingIgnored: true });
    }
  });

  it('lets a handler or ignore keep the process alive for a catchable signal', () => {
    expect(deliver('SIGTERM', 'handler')).toMatchObject({ result: 'handler-runs', exitStatus: null, settingIgnored: false });
    expect(deliver('SIGPIPE', 'ignore')).toMatchObject({ result: 'ignored', exitStatus: null });
    expect(deliver('SIGTSTP', 'default')).toMatchObject({ result: 'stops', exitStatus: null });
  });

  it('reads a status of 128 or less as no signal, and rejects a status out of range', () => {
    expect(readStatus(0)).toMatchObject({ number: null, signal: null });
    expect(readStatus(13)).toMatchObject({ number: null, signal: null });
    expect(readStatus(128)).toMatchObject({ number: null });
    expect(readStatus(134)).toMatchObject({ number: 6, signal: null });
    expect(readStatus(256)).toBeNull();
    expect(readStatus(-1)).toBeNull();
    expect(readStatus(1.5)).toBeNull();
  });
});
