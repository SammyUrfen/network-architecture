import { useState } from 'preact/hooks';
import { act, can, fds, LINES, PORT, quoted, start, type Action, type ServerKind } from '../../../lib/sims/s01-m01-seven-syscalls';
import './sims.css';

// The syscall theater of s01-m01-seven-syscalls. The learner steps the server
// with "Next call" and plays the client with three buttons. Nothing moves by
// itself. A button that cannot act now stays in the Tab order with
// aria-disabled, so the focus does not jump away after a press.
export interface Props {
  /** The accessible name of the theater. Also names its radio group, so keep it unique on the page. */
  title: string;
  /** The server at the start. */
  kind: ServerKind;
  /** Show the choice between the two servers. */
  choose?: boolean;
}

const KINDS: { value: ServerKind; label: string }[] = [
  { value: 'one-read', label: 'First server: one read, then close' },
  { value: 'loop', label: 'Second server: read in a loop' },
];
/** The log shows the newest calls only, so the theater stays short in the rail. */
const LOG_LINES = 8;

export default function TheaterIsland({ title, kind: firstKind, choose = false }: Props) {
  const [state, setState] = useState(() => start(firstKind));
  const conn = state.conn;
  const table = fds(state);
  const log = state.log.slice(-LOG_LINES);
  const hidden = state.log.length - log.length;

  const button = (action: Action, label: string) => (
    <button type="button" class="s1m1-btn" aria-disabled={!can(state, action)} onClick={() => can(state, action) && setState(act(state, action))}>
      {label}
    </button>
  );

  const clientStatus = !conn
    ? 'Not connected.'
    : conn.reset
      ? 'The kernel of the server sent a reset. The connection is gone.'
      : conn.clientClosed && conn.serverClosed
      ? 'Both sides closed. The connection is gone.'
      : conn.clientClosed
        ? 'The client closed its side.'
        : conn.serverClosed
          ? 'Connected, but the server closed its side.'
          : conn.place === 'in-line'
            ? 'Connected. It waits in the line.'
            : 'Connected. The server serves it.';

  return (
    <div class="s1m1-theater" role="group" aria-label={title}>
      {choose && (
        <fieldset class="s1m1-kinds">
          <legend>Pick a server. A new pick starts again.</legend>
          {KINDS.map((k) => (
            <label class="s1m1-choice" key={k.value}>
              <input
                type="radio"
                name={`${title}-kind`}
                checked={state.kind === k.value}
                onChange={() => setState(start(k.value))}
              />
              {k.label}
            </label>
          ))}
        </fieldset>
      )}

      <div class="s1m1-panels">
        <section class="s1m1-panel" aria-label="Server program">
          <h3>Server program</h3>
          {button('next', `Next call: ${state.next}()`)}
          <p class={state.blocked ? 's1m1-wait' : 's1m1-muted'}>{state.blocked ? `Waits inside ${state.next}().` : `Next: ${state.next}().`}</p>
          <p class="s1m1-sub">File descriptors</p>
          {table.length === 0 ? (
            <p class="s1m1-empty">none yet</p>
          ) : (
            <ul class="s1m1-fds">
              {table.map(({ fd, what }) => (
                <li key={fd}>
                  <span class="s1m1-fd">{fd}</span> {what}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section class="s1m1-panel" aria-label="Kernel of the server">
          <h3>Kernel</h3>
          <p class="s1m1-sub">Port {PORT}</p>
          <p>{state.listening ? 'Listening: clients can connect.' : 'Nothing listens yet.'}</p>
          <p class="s1m1-sub">Line of clients</p>
          {conn?.place === 'in-line' ? <p class="s1m1-token">1 client waits</p> : <p class="s1m1-empty">empty</p>}
          <p class="s1m1-sub">Bytes that wait for read()</p>
          {conn?.waiting ? <p class="s1m1-token"><code>{quoted(conn.waiting)}</code></p> : <p class="s1m1-empty">none</p>}
        </section>

        <section class="s1m1-panel" aria-label="Client">
          <h3>Client</h3>
          <div class="s1m1-buttons">
            {button('connect', 'Connect')}
            {button('send', 'Send a line')}
            {button('quit', 'Quit')}
          </div>
          <p>{clientStatus}</p>
          <p class="s1m1-sub">Sent</p>
          <p>{conn && conn.sent > 0 ? <code>{quoted(LINES.slice(0, conn.sent).join(''))}</code> : <span class="s1m1-empty">nothing</span>}</p>
          <p class="s1m1-sub">Came back</p>
          <p>{conn?.echoed ? <code>{quoted(conn.echoed)}</code> : <span class="s1m1-empty">nothing</span>}</p>
        </section>
      </div>

      <p class="s1m1-caption" aria-live="polite">
        {state.caption}
      </p>

      <div class="s1m1-log">
        <p class="s1m1-sub">The calls of the server, as strace prints them</p>
        <p class="s1m1-muted">strace is a Linux tool that prints each system call of a program, then its result after the = sign.</p>
        {log.length === 0 ? (
          <p class="s1m1-empty">No call yet.</p>
        ) : (
          <ol start={hidden + 1}>
            {log.map((line, i) => (
              <li key={hidden + i} class={i === log.length - 1 ? 's1m1-new' : undefined}>
                <code>{line}</code>
                {i === log.length - 1 && <span class="sr-only"> (newest)</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      <div class="s1m1-buttons">
        <button type="button" class="s1m1-btn" onClick={() => setState(start(state.kind))}>
          <span aria-hidden="true">⟲ </span>Start again
        </button>
      </div>
      <p class="s1m1-simplifies">
        What this simplifies: one client at a time, each line arrives whole, and no call fails. A real client learns about a reset only at its next read or write. The log leaves out arguments that this lesson does not use.
      </p>
    </div>
  );
}
