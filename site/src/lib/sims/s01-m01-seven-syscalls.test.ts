import { describe, expect, it } from 'vitest';
import { act, can, fds, run, start, type Action } from './s01-m01-seven-syscalls';

// strace output of the instructor servers on loopback, as short log lines.
// The theater drops the arguments that the page does not teach.
const short = (trace: string) =>
  trace
    .trim()
    .split('\n')
    .map((line) =>
      line
        .replace(/\s+=\s+/, ' = ')
        .replace(/^socket\(.*\) = /, 'socket() = ')
        .replace(/^bind\((\d+), .*htons\(\d+\).*\) = /, 'bind($1, port 2026) = ')
        .replace(/^accept\((\d+), NULL, NULL\) = /, 'accept($1) = '),
    );

const setup: Action[] = ['next', 'next', 'next'];

describe('the loop server', () => {
  it('matches the verified strace run of 02_echo_server_persistent.c', () => {
    // docs/curriculum/session-01.md, s01-m01 rung 3: one client sends two lines, then quits.
    const verified = short(String.raw`
socket(AF_INET, SOCK_STREAM, IPPROTO_IP) = 3
bind(3, {sin_port=htons(2037), sin_addr=inet_addr("0.0.0.0")}, 16) = 0
listen(3, 1)               = 0
accept(3, NULL, NULL)      = 4
read(4, "one\n", 4096)     = 4
write(4, "one\n", 4)       = 4
read(4, "two\n", 4096)     = 4
write(4, "two\n", 4)       = 4
read(4, "", 4096)          = 0
close(4)                   = 0`);
    const s = run('loop', [...setup, 'connect', 'next', 'send', 'next', 'next', 'send', 'next', 'next', 'quit', 'next', 'next']);
    expect(s.log).toEqual(verified);
    expect(s.conn?.echoed).toBe('one\ntwo\n');
    expect(s.next).toBe('accept');
    expect(can(s, 'connect')).toBe(true);
  });

  it('waits inside read() and returns when the client acts', () => {
    const waiting = run('loop', [...setup, 'connect', 'next', 'next']);
    expect(waiting.blocked).toBe(true);
    expect(can(waiting, 'next')).toBe(false);
    expect(waiting.log.at(-1)).toBe('accept(3) = 4');
    const woke = act(waiting, 'send');
    expect(woke.blocked).toBe(false);
    expect(woke.log.at(-1)).toBe('read(4, "one\\n", 4096) = 4');
    const ended = act(run('loop', [...setup, 'connect', 'next', 'next']), 'quit');
    expect(ended.log.at(-1)).toBe('read(4, "", 4096) = 0');
    expect(ended.next).toBe('close');
  });
});

describe('the one-read server', () => {
  it('echoes only the first line when the second comes later, as the nc run showed', () => {
    // docs/curriculum/session-01.md, s01-m01 predict: lines 0.5 s apart, and only "one" comes back.
    const s = run('one-read', [...setup, 'next', 'connect', 'next', 'send', 'next', 'next', 'send']);
    expect(short(String.raw`
accept(3, NULL, NULL)                   = 4
read(4, "one\n", 4096)                  = 4
write(4, "one\n", 4)                    = 4
close(4)                                = 0`)).toEqual(s.log.slice(3));
    expect(s.conn?.echoed).toBe('one\n');
    expect(s.conn).toMatchObject({ sent: 2, reset: true });
    expect(can(s, 'connect')).toBe(true);
  });

  it('resets the connection when it closes while bytes still wait', () => {
    // A verified run on 2026-09-14: 10,000 bytes gave 4096 bytes back, then "Connection reset by peer" (RFC 9293 §3.6.1).
    const s = run('one-read', [...setup, 'next', 'connect', 'next', 'send', 'send', 'next', 'next']);
    expect(s.log.slice(3)).toEqual(['accept(3) = 4', 'read(4, "one\\n", 4096) = 4', 'write(4, "one\\n", 4) = 4', 'close(4) = 0']);
    expect(s.conn).toMatchObject({ waiting: '', reset: true, echoed: 'one\n' });
    expect(s.caption).toMatch(/reset/);
    expect(can(s, 'send')).toBe(false);
    expect(can(s, 'connect')).toBe(true);
  });

  it('echoes both lines when both wait before the one read', () => {
    // A verified run on 2026-09-14: printf 'one\ntwo\n' | nc gave read(4, "one\ntwo\n", 4096) = 8.
    const s = run('one-read', [...setup, 'connect', 'send', 'send', 'next', 'next', 'next', 'next']);
    expect(s.log.slice(3)).toEqual(['accept(3) = 4', 'read(4, "one\\ntwo\\n", 4096) = 8', 'write(4, "one\\ntwo\\n", 8) = 8', 'close(4) = 0']);
    expect(s.conn?.echoed).toBe('one\ntwo\n');
  });

  it('writes 0 bytes and closes when the client sends nothing', () => {
    // A verified run on 2026-09-14: read(4, "", 4096) = 0, write(4, "", 0) = 0, close(4) = 0.
    const s = run('one-read', [...setup, 'connect', 'quit', 'next', 'next', 'next', 'next']);
    expect(s.log.slice(3)).toEqual(['accept(3) = 4', 'read(4, "", 4096) = 0', 'write(4, "", 0) = 0', 'close(4) = 0']);
  });
});

describe('the kernel before accept()', () => {
  it('refuses a client before listen()', () => {
    const s = run('loop', ['next', 'next', 'connect']);
    expect(s.conn).toBeNull();
    expect(s.caption).toMatch(/refuses/);
  });

  it('finishes the handshake and keeps bytes while the program has not called accept()', () => {
    const s = run('loop', [...setup, 'connect', 'send']);
    expect(s.conn).toMatchObject({ place: 'in-line', waiting: 'one\n' });
    expect(s.log).toHaveLength(3);
    expect(fds(s)).toEqual([{ fd: 3, what: 'listening socket, port 2026' }]);
    expect(fds(act(s, 'next'))).toHaveLength(2);
  });

  it('lets accept() that waits return at once when a client connects', () => {
    const s = run('loop', [...setup, 'next', 'connect']);
    expect(s.blocked).toBe(false);
    expect(s.log.at(-1)).toBe('accept(3) = 4');
  });
});

describe('the controls', () => {
  it('allows one client at a time, three lines, and one quit', () => {
    const s = run('loop', [...setup, 'connect']);
    expect(can(s, 'connect')).toBe(false);
    const three = run('loop', [...setup, 'connect', 'send', 'send', 'send']);
    expect(can(three, 'send')).toBe(false);
    expect(can(act(s, 'quit'), 'quit')).toBe(false);
    expect(can(start('loop'), 'send')).toBe(false);
  });

  it('never changes the state it gets', () => {
    const s = run('loop', [...setup, 'connect']);
    const copy = structuredClone(s);
    act(act(s, 'send'), 'next');
    expect(s).toEqual(copy);
  });
});
