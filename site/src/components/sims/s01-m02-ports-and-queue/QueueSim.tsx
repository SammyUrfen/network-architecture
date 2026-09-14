import { useState } from 'preact/hooks';
import { runQueue, type ClientState, type QueueSetup } from '../../../lib/sims/s01-m02-ports-and-queue';
import './m02.css';

// The visual of Part 3: the break-it toggles of the curriculum. The learner
// sets bind(), accept(), the backlog and the client count, and sees where each
// client ends up, the seats of the accept queue, and the ss line of the listener.

const MAX = 8;
/** The port that listen() picked with no bind() in the lab run of this lesson */
const RANDOM_PORT = 52053;

const ZONES: { state: ClientState; label: string; mark: string }[] = [
  { state: 'served', label: 'Taken by accept(): the program works with them', mark: '✓' },
  { state: 'syn-sent', label: 'No answer: the kernel drops their SYN, so they send it again, then time out', mark: '…' },
  { state: 'refused', label: 'Refused at once: no program on port 2026', mark: '✗' },
];

const list = (numbers: number[]) =>
  numbers.length === 1 ? `Client ${numbers[0]}` : `Clients ${numbers.slice(0, -1).join(', ')} and ${numbers.at(-1)}`;

function Chip({ n, state }: { n: number; state: ClientState }) {
  return <span class={`m02-chip ${state}`}>C{n}</span>;
}

export default function QueueSim({ title }: { title: string }) {
  const [setup, setSetup] = useState<QueueSetup>({ bind: true, accept: 'never', backlog: 1, clients: 4 });
  const set = (change: Partial<QueueSetup>) => setSetup({ ...setup, ...change });
  const r = runQueue(setup);
  const numbersIn = (state: ClientState) => r.clients.flatMap((s, i) => (s === state ? [i + 1] : []));
  const queued = numbersIn('queued');

  const summary = [
    numbersIn('served').length > 0 && `${list(numbersIn('served'))} connect, and accept() takes each one at once.`,
    queued.length > 0 && `${list(queued)} connect and wait in the accept queue.`,
    numbersIn('syn-sent').length > 0 && `${list(numbersIn('syn-sent'))} get no answer, because the queue is full.`,
    numbersIn('refused').length > 0 && `${list(numbersIn('refused'))} get "Connection refused" at once.`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div class="m02-sim" role="group" aria-label={title}>
      <div class="m02-zone-list">
        {setup.bind && setup.accept === 'never' && (
          <div class="m02-box">
            <p class="m02-box-label">
              Accept queue: listen() got {r.backlog}, and Linux holds {r.holds}
            </p>
            <div class="m02-seats">
              {Array.from({ length: r.holds }, (_, s) => (
                <span class={s === r.holds - 1 ? 'm02-seat extra' : 'm02-seat'} key={s}>
                  {queued[s] ? <Chip n={queued[s]} state="queued" /> : <span class="m02-empty">empty</span>}
                </span>
              ))}
            </div>
            <p class="m02-note">The dashed seat is the one extra connection that Linux holds.</p>
          </div>
        )}
        {ZONES.filter((z) => numbersIn(z.state).length > 0).map((z) => (
          <div class={`m02-box ${z.state}`} key={z.state}>
            <p class="m02-box-label">
              <span aria-hidden="true">{z.mark} </span>
              {z.label}
            </p>
            <div class="m02-seats">
              {numbersIn(z.state).map((n) => (
                <Chip n={n} state={z.state} key={n} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p class="m02-summary" aria-live="polite">
        {summary}
      </p>

      <div class="m02-ss">
        <p class="m02-note">
          The Linux tool ss lists sockets. On the listening socket, Recv-Q counts the connections that wait, and Send-Q
          shows the backlog.
        </p>
        <pre>
          <code>
            {`$ ss -ltn\nState   Recv-Q  Send-Q  Local Address:Port\nLISTEN  ${String(r.waiting).padEnd(6)}  ${String(r.backlog).padEnd(6)}  0.0.0.0:${setup.bind ? 2026 : RANDOM_PORT}`}
          </code>
        </pre>
        {!setup.bind && <p class="m02-note">With no bind(), listen() picked a random port. No client knows it.</p>}
      </div>

      <fieldset class="m02-fieldset">
        <legend>The server program</legend>
        <label class="m02-choice">
          <input type="checkbox" checked={!setup.bind} onChange={(e) => set({ bind: !e.currentTarget.checked })} />
          Skip bind()
        </label>
        <label class="m02-choice">
          <input type="radio" name={`${title} accept`} checked={setup.accept === 'never'} onChange={() => set({ accept: 'never' })} />
          Never call accept()
        </label>
        <label class="m02-choice">
          <input type="radio" name={`${title} accept`} checked={setup.accept === 'at-once'} onChange={() => set({ accept: 'at-once' })} />
          Call accept() for each client at once
        </label>
      </fieldset>

      <label class="m02-range">
        <span>
          Backlog, the number in listen(): <strong>{setup.backlog}</strong>
        </span>
        <input type="range" min={0} max={MAX - 1} value={setup.backlog} onInput={(e) => set({ backlog: e.currentTarget.valueAsNumber })} />
      </label>
      <label class="m02-range">
        <span>
          Clients that connect, one after the other: <strong>{setup.clients}</strong>
        </span>
        <input type="range" min={1} max={MAX} value={setup.clients} onInput={(e) => set({ clients: e.currentTarget.valueAsNumber })} />
      </label>

      <p class="m02-simplifies">
        <strong>What this simplifies:</strong> Linux with default settings, and clients that connect and stay. The model
        shows no time: a client with no answer and no timeout of its own gives up after about two minutes. Other systems can refuse a client when
        the queue is full.
      </p>
    </div>
  );
}
