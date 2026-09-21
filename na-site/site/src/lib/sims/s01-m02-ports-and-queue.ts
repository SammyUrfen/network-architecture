// Pure logic for the two simulations of s01-m02-ports-and-queue: who may bind
// a port, and what each client sees when it connects to a listener. The model
// is Linux with default settings, the system of the verified runs in
// docs/curriculum/session-01.md (s01-m02, rung 3).

/** The first port that any user can bind: /proc/sys/net/ipv4/ip_unprivileged_port_start (slide 8, verified 1024). */
export const UNPRIVILEGED_START = 1024;
/** The highest TCP port number: the port field has 16 bits. */
export const MAX_PORT = 65535;
/** The Linux cap on the listen() backlog: net.core.somaxconn, 4096 by default since Linux 5.4 (listen(2)). */
export const SOMAXCONN = 4096;

/** A normal user, root, or a normal user with the CAP_NET_BIND_SERVICE capability. */
export type Who = 'user' | 'root' | 'capability';
export type BindCheck = 'ok' | 'denied' | 'invalid';

/** The ports on slide 8, low ports first. */
export const SLIDE_PORTS: { port: number; name: string }[] = [
  { port: 21, name: 'FTP' },
  { port: 25, name: 'SMTP' },
  { port: 80, name: 'HTTP' },
  { port: 110, name: 'POP' },
  { port: 443, name: 'HTTPS' },
  { port: 2026, name: 'the class server' },
  { port: 3000, name: 'node' },
  { port: 6379, name: 'redis' },
  { port: 8080, name: 'alt-http' },
];

/** A port below the line needs privilege. */
export const isPrivileged = (port: number, start = UNPRIVILEGED_START) => port < start;

/** The result of bind() on a port. Port 0 asks the kernel to pick, so the model leaves it out. */
export function bindCheck(port: number, who: Who, start = UNPRIVILEGED_START): BindCheck {
  if (!Number.isInteger(port) || port < 1 || port > MAX_PORT) return 'invalid';
  if (isPrivileged(port, start) && who === 'user') return 'denied';
  return 'ok';
}

export interface QueueSetup {
  /** false: the code skips bind(), or bind() failed and nobody checked. */
  bind: boolean;
  /** never: the program never calls accept(). at-once: it accepts each client as soon as it arrives. */
  accept: 'never' | 'at-once';
  /** The second argument of listen(). */
  backlog: number;
  /** How many clients connect, one after the other. */
  clients: number;
  somaxconn?: number;
}

/**
 * refused: RST at once. served: accept() took it. queued: connected, waits in the accept queue.
 * syn-sent: the kernel dropped its SYN, so the client sends it again and later times out.
 */
export type ClientState = 'refused' | 'served' | 'queued' | 'syn-sent';

export interface QueueResult {
  /** The backlog in effect, after the somaxconn cap. ss shows it as Send-Q on the listener. */
  backlog: number;
  /** The most connections that can wait for accept(). */
  holds: number;
  clients: ClientState[];
  /** The connections that wait now. ss shows it as Recv-Q on the listener. */
  waiting: number;
}

/** The backlog in effect: Linux caps it at somaxconn (listen(2)). A negative backlog counts as 0 here. */
export const backlogInEffect = (backlog: number, somaxconn = SOMAXCONN) => Math.min(Math.max(0, Math.floor(backlog)), somaxconn);

/**
 * Linux calls the accept queue full only when it holds more than the backlog
 * (sk_acceptq_is_full in include/net/sock.h), so it holds backlog + 1. A SYN
 * that finds the queue full gets no answer.
 */
export const queueHolds = (backlog: number, somaxconn = SOMAXCONN) => backlogInEffect(backlog, somaxconn) + 1;

export function runQueue({ bind, accept, backlog, clients, somaxconn = SOMAXCONN }: QueueSetup): QueueResult {
  const inEffect = backlogInEffect(backlog, somaxconn);
  const holds = inEffect + 1;
  const count = Math.max(0, Math.floor(clients));
  const states: ClientState[] = Array.from({ length: count }, (_, i) => {
    // With no bind(), listen() picks a random port, so a client that aims at the intended port finds no listener.
    if (!bind) return 'refused';
    if (accept === 'at-once') return 'served';
    return i < holds ? 'queued' : 'syn-sent';
  });
  return {
    backlog: inEffect,
    holds,
    clients: states,
    waiting: states.filter((s) => s === 'queued').length,
  };
}
