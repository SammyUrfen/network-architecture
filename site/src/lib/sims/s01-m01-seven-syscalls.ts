// Pure logic for the syscall theater of s01-m01-seven-syscalls. The learner
// steps a server through its calls and plays one client beside it. The two
// server kinds follow the instructor repo, lesson1: 01_echo_server.c reads
// one time, and 02_echo_server_persistent.c reads in a loop.
//
// What this simplifies: one client at a time, a line arrives whole, no call
// fails, and a client that writes to a closed connection sees nothing. A real
// kernel can split bytes, and it answers such a write with a reset.

export type ServerKind = 'one-read' | 'loop';
export type Call = 'socket' | 'bind' | 'listen' | 'accept' | 'read' | 'write' | 'close';
export type Action = 'next' | 'connect' | 'send' | 'quit';

/** The port of every class demo (slide 1). */
export const PORT = 2026;
/** Both servers read into `char buf[4096]`, so one read() takes at most 4096 bytes. */
export const BUFFER = 4096;
/** 0, 1 and 2 are standard input, output and error, so the first socket gets 3. */
export const LISTEN_FD = 3;
/** accept() returns the lowest free number, 4, while 3 stays open. */
export const CLIENT_FD = 4;
/** The lines of the client, in order. The first two are the lines of the verified run in session-01.md. */
export const LINES = ['one\n', 'two\n', 'three\n'];

export interface Connection {
  /** in-line: the kernel finished the handshake and the connection waits for accept(). served: accept() returned it. */
  place: 'in-line' | 'served';
  /** Bytes that arrived and wait in the kernel for a read(). */
  waiting: string;
  /** How many of LINES the client sent. */
  sent: number;
  /** The bytes that came back to the client. */
  echoed: string;
  clientClosed: boolean;
  serverClosed: boolean;
}

export interface Theater {
  kind: ServerKind;
  /** The call that the server makes next. */
  next: Call;
  /** True while the server sits inside accept() or read() and waits. */
  blocked: boolean;
  listening: boolean;
  conn: Connection | null;
  /** The bytes of the last read, for the write after it. */
  held: string;
  /** One line for each finished call, oldest first, in a short strace form. */
  log: string[];
  /** What the last action did, in plain words. */
  caption: string;
}

/** A string as strace shows it: in quotes, with a newline as \n. */
export const quoted = (text: string) => `"${text.replace(/\n/g, '\\n')}"`;

const bytes = (n: number) => `${n} ${n === 1 ? 'byte' : 'bytes'}`;

export function start(kind: ServerKind): Theater {
  return {
    kind,
    next: 'socket',
    blocked: false,
    listening: false,
    conn: null,
    held: '',
    log: [],
    caption: 'The server program has started, but it has no socket yet. Press "Next call".',
  };
}

/** A connection is gone when both sides closed it. Then a new client can connect. */
const gone = (conn: Connection | null) => !conn || (conn.clientClosed && conn.serverClosed);

/** The open file descriptors of the server, with what each one names. */
export function fds(s: Theater): { fd: number; what: string }[] {
  const table: { fd: number; what: string }[] = [];
  if (s.log.length > 0) {
    const what = s.listening ? `listening socket, port ${PORT}` : s.next === 'bind' ? 'new socket, no port yet' : `socket, port ${PORT}`;
    table.push({ fd: LISTEN_FD, what });
  }
  if (s.conn?.place === 'served' && !s.conn.serverClosed) table.push({ fd: CLIENT_FD, what: 'connection to the client' });
  return table;
}

/** Whether the learner can take the action now. The island disables the other buttons. */
export function can(s: Theater, action: Action): boolean {
  switch (action) {
    case 'next':
      return !s.blocked;
    case 'connect':
      return gone(s.conn);
    case 'send':
      return !gone(s.conn) && !s.conn!.clientClosed && s.conn!.sent < LINES.length;
    case 'quit':
      return !gone(s.conn) && !s.conn!.clientClosed;
  }
}

/** The state after one action. The input state does not change. */
export function act(state: Theater, action: Action): Theater {
  const s: Theater = { ...state, log: [...state.log], conn: state.conn && { ...state.conn } };
  if (!can(state, action)) return { ...s, caption: 'That action cannot happen now.' };
  switch (action) {
    case 'next':
      return call(s);
    case 'connect':
      return connect(s);
    case 'send':
      return send(s);
    case 'quit':
      return quit(s);
  }
}

function call(s: Theater): Theater {
  switch (s.next) {
    case 'socket':
      s.log.push(`socket() = ${LISTEN_FD}`);
      s.next = 'bind';
      s.caption = `socket() asks the kernel for a new socket. The kernel returns ${LISTEN_FD}, the number that names it.`;
      return s;
    case 'bind':
      s.log.push(`bind(${LISTEN_FD}, port ${PORT}) = 0`);
      s.next = 'listen';
      s.caption = `bind() asks the kernel to give socket ${LISTEN_FD} the port ${PORT}. It returns 0, which means that it worked.`;
      return s;
    case 'listen':
      s.log.push(`listen(${LISTEN_FD}, 1) = 0`);
      s.listening = true;
      s.next = 'accept';
      s.caption = `listen() tells the kernel to take clients on port ${PORT} and keep them in a line. From now on the kernel answers clients by itself.`;
      return s;
    case 'accept':
      return accept(s);
    case 'read':
      return read(s);
    case 'write':
      return write(s);
    case 'close':
      return close(s);
  }
}

function accept(s: Theater): Theater {
  if (s.conn?.place !== 'in-line') {
    s.blocked = true;
    s.caption = 'accept() waits, because no client is in the line. Press "Connect" to send a client.';
    return s;
  }
  s.conn.place = 'served';
  s.blocked = false;
  s.log.push(`accept(${LISTEN_FD}) = ${CLIENT_FD}`);
  s.next = 'read';
  s.caption = `accept() takes the client from the line and returns ${CLIENT_FD}, a new number for this one client. Socket ${LISTEN_FD} stays open for the next client.`;
  return s;
}

function read(s: Theater): Theater {
  const conn = s.conn!;
  if (conn.waiting) {
    const got = conn.waiting.slice(0, BUFFER);
    conn.waiting = conn.waiting.slice(got.length);
    s.held = got;
    s.blocked = false;
    s.log.push(`read(${CLIENT_FD}, ${quoted(got)}, ${BUFFER}) = ${got.length}`);
    s.next = 'write';
    const lines = got.split('\n').length - 1;
    s.caption = `read() returns ${got.length}: it takes the ${bytes(got.length)} that waited.${lines > 1 ? ` That is ${lines} lines in one read, because a read takes every byte that waits.` : ''}`;
    return s;
  }
  if (conn.clientClosed) {
    s.held = '';
    s.blocked = false;
    s.log.push(`read(${CLIENT_FD}, "", ${BUFFER}) = 0`);
    s.next = s.kind === 'loop' ? 'close' : 'write';
    s.caption =
      'read() returns 0, because the client closed its side and no bytes wait. That is the end of the conversation. ' +
      (s.kind === 'loop' ? 'The loop stops, and the server calls close().' : 'This server still writes its 0 bytes back, then it closes.');
    return s;
  }
  s.blocked = true;
  s.caption = 'read() waits, because no bytes wait yet. Press "Send a line" for the client.';
  return s;
}

function write(s: Theater): Theater {
  const conn = s.conn!;
  s.log.push(`write(${CLIENT_FD}, ${quoted(s.held)}, ${s.held.length}) = ${s.held.length}`);
  conn.echoed += s.held;
  s.next = s.kind === 'loop' ? 'read' : 'close';
  s.caption =
    `write() sends the same ${bytes(s.held.length)} back to the client. ` +
    (s.kind === 'loop' ? 'The loop goes back to read().' : 'This server reads only one time, so it calls close() next.');
  s.held = '';
  return s;
}

function close(s: Theater): Theater {
  const conn = s.conn!;
  s.log.push(`close(${CLIENT_FD}) = 0`);
  conn.serverClosed = true;
  s.next = 'accept';
  s.caption =
    `close() ends the connection to this client, and the server goes back to accept() for the next one.` +
    (conn.clientClosed ? '' : ' The client did not quit, so a line that it sends now gets no answer.');
  return s;
}

function connect(s: Theater): Theater {
  if (!s.listening) {
    s.caption = `The client calls connect(), but nothing listens on port ${PORT} yet. The kernel refuses the connection. Step the server through listen() first.`;
    return s;
  }
  s.conn = { place: 'in-line', waiting: '', sent: 0, echoed: '', clientClosed: false, serverClosed: false };
  const queued = `The client calls connect(). The kernel of the server finishes the handshake at once, and the connection waits in the line.`;
  if (s.blocked) return { ...accept(s), caption: `${queued} accept() was waiting, so it returns ${CLIENT_FD} now.` };
  s.caption = `${queued} The program has not called accept(), so it does not know about this client yet.`;
  return s;
}

function send(s: Theater): Theater {
  const conn = s.conn!;
  const line = LINES[conn.sent];
  conn.sent += 1;
  if (conn.serverClosed) {
    s.caption = `The client sends ${quoted(line)}, but the server closed this connection. Nothing comes back.`;
    return s;
  }
  conn.waiting += line;
  const sent = `The client sends ${quoted(line)}, ${bytes(line.length)}.`;
  if (s.blocked && s.next === 'read') return { ...read(s), caption: `${sent} read() was waiting, so it returns ${line.length} now.` };
  s.caption = `${sent} The bytes wait in the kernel until the server calls read().`;
  return s;
}

function quit(s: Theater): Theater {
  const conn = s.conn!;
  conn.clientClosed = true;
  if (conn.serverClosed) {
    s.caption = 'The client closes its side too. The connection is gone, and a new client can connect.';
    return s;
  }
  const closed = 'The client closes its side of the connection.';
  if (s.blocked && s.next === 'read') return { ...read(s), caption: `${closed} read() was waiting, so it returns 0 now.` };
  s.caption = `${closed} When no bytes wait, the next read() on the server returns 0.`;
  return s;
}

/** Runs actions from a start state, for tests and for a first frame. */
export const run = (kind: ServerKind, actions: Action[]) => actions.reduce(act, start(kind));
