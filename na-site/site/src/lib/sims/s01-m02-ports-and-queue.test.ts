import { describe, expect, it } from 'vitest';
import { SLIDE_PORTS, bindCheck, backlogInEffect, isPrivileged, queueHolds, runQueue } from './s01-m02-ports-and-queue';

describe('bindCheck', () => {
  it('denies a port below 1024 to a normal user only', () => {
    // sources/session-01 slide 8: "< 1024 root only", ">= 1024 anyone".
    // Verified 2026-09-14, Fedora, Linux 7.1: a normal user binding 127.0.0.1:80 gets [Errno 13] Permission denied.
    expect(bindCheck(80, 'user')).toBe('denied');
    expect(bindCheck(1023, 'user')).toBe('denied');
    expect(bindCheck(1024, 'user')).toBe('ok');
    expect(bindCheck(8080, 'user')).toBe('ok');
  });

  it('lets root and the CAP_NET_BIND_SERVICE capability bind a low port', () => {
    // capabilities(7): CAP_NET_BIND_SERVICE binds a socket to Internet domain privileged ports (below 1024).
    expect(bindCheck(80, 'root')).toBe('ok');
    expect(bindCheck(443, 'capability')).toBe('ok');
  });

  it('follows a lower ip_unprivileged_port_start', () => {
    // docs/curriculum/session-01.md, s01-m02 rung 4: a lower ip_unprivileged_port_start lifts the rule.
    expect(bindCheck(80, 'user', 80)).toBe('ok');
    expect(bindCheck(79, 'user', 80)).toBe('denied');
  });

  it('rejects a port outside 1 to 65535', () => {
    expect(bindCheck(0, 'root')).toBe('invalid');
    expect(bindCheck(65536, 'root')).toBe('invalid');
    expect(bindCheck(80.5, 'root')).toBe('invalid');
    expect(bindCheck(65535, 'user')).toBe('ok');
  });

  it('puts the slide ports on the right side of the line', () => {
    // Slide 8 lists 80, 443, 25, 21, 110 under "root only", and 3000, 8080, 6379, 2026 under "anyone".
    const low = SLIDE_PORTS.filter((p) => isPrivileged(p.port)).map((p) => p.port);
    expect(low).toEqual([21, 25, 80, 110, 443]);
  });
});

describe('runQueue', () => {
  it('holds backlog + 1 connections when nobody accepts', () => {
    // Verified 2026-09-14, Linux 7.1, loopback: listen(1), no accept, four clients.
    // ss: LISTEN Recv-Q 2 Send-Q 1, two ESTAB clients, two SYN-SENT clients.
    const r = runQueue({ bind: true, accept: 'never', backlog: 1, clients: 4 });
    expect(r.clients).toEqual(['queued', 'queued', 'syn-sent', 'syn-sent']);
    expect(r.waiting).toBe(2);
    expect(r.backlog).toBe(1);
  });

  it('holds one connection with backlog 0', () => {
    // Verified 2026-09-14, Linux 7.1, loopback: listen(0), three clients. ss: LISTEN Recv-Q 1 Send-Q 0, one ESTAB, two SYN-SENT.
    const r = runQueue({ bind: true, accept: 'never', backlog: 0, clients: 3 });
    expect(r.clients).toEqual(['queued', 'syn-sent', 'syn-sent']);
    expect([r.waiting, r.backlog]).toEqual([1, 0]);
  });

  it('counts only waiting connections, so accept() at once serves every client', () => {
    // docs/curriculum/session-01.md, s01-m02 check 6. Verified 2026-09-14: listen(1), accept at once, three clients connect, Recv-Q 0.
    const r = runQueue({ bind: true, accept: 'at-once', backlog: 1, clients: 3 });
    expect(r.clients).toEqual(['served', 'served', 'served']);
    expect(r.waiting).toBe(0);
  });

  it('refuses every client when the code skips bind()', () => {
    // Slide 9: no bind, "Connection refused". Verified 2026-09-14: listen() on an unbound socket picks 0.0.0.0:52653.
    const r = runQueue({ bind: false, accept: 'never', backlog: 1, clients: 3 });
    expect(r.clients).toEqual(['refused', 'refused', 'refused']);
    expect(r.waiting).toBe(0);
  });

  it('matches the faded example: backlog 3, six clients', () => {
    // docs/curriculum/session-01.md, s01-m02 faded example: in the queue 4, in SYN-SENT 2.
    const { clients } = runQueue({ bind: true, accept: 'never', backlog: 3, clients: 6 });
    expect(clients.filter((c) => c === 'queued')).toHaveLength(4);
    expect(clients.filter((c) => c === 'syn-sent')).toHaveLength(2);
  });

  it('caps the backlog at somaxconn', () => {
    // listen(2): a backlog above /proc/sys/net/core/somaxconn is silently capped to it. Verified value 4096.
    // docs/curriculum/session-01.md, s01-m02 your turn: listen(fd, 10000) with somaxconn 4096 holds 4097.
    expect(backlogInEffect(10000)).toBe(4096);
    expect(queueHolds(10000)).toBe(4097);
    expect(queueHolds(10000, 128)).toBe(129);
    expect(runQueue({ bind: true, accept: 'never', backlog: 10000, clients: 2 }).backlog).toBe(4096);
  });
});
