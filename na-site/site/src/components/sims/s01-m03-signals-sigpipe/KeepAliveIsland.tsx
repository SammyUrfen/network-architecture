import { useState } from 'preact/hooks';
import { runDemo, type Close, type DemoSettings, type SendCall, type SigpipeSetting } from '../../../lib/sims/s01-m03-signals-sigpipe';
import './m03.css';

// The SIGPIPE simulator of Part 4. Three choices change the class demo: how
// the client closes, what the server does with SIGPIPE, and how the server
// sends. The run shows each call with its result and the exit status. The
// learner looks for every setting that keeps the server alive.

interface Choice<T> {
  value: T;
  label: string;
}
const CLOSES: Choice<Close>[] = [
  { value: 'rst', label: 'Linger 0, then close(): RST (the class client)' },
  { value: 'fin', label: 'A normal close(): FIN' },
];
const SIGPIPES: Choice<SigpipeSetting>[] = [
  { value: 'default', label: 'Keep the default (the class server)' },
  { value: 'ignore', label: 'Ignore it, with signal(SIGPIPE, SIG_IGN)' },
];
const CALLS: Choice<SendCall>[] = [
  { value: 'write', label: 'write() (the class server)' },
  { value: 'send-nosignal', label: 'send() with the flag MSG_NOSIGNAL' },
];
const SETTINGS_COUNT = CLOSES.length * SIGPIPES.length * CALLS.length;

const KIND_WORD = { ok: 'works', error: 'error', signal: 'signal', note: 'note', end: 'end' } as const;

function Group<T extends string>({ legend, name, choices, value, onPick }: { legend: string; name: string; choices: Choice<T>[]; value: T; onPick: (v: T) => void }) {
  return (
    <fieldset class="s1m3-group">
      <legend>{legend}</legend>
      <div class="s1m3-options">
        {choices.map((c) => (
          <label class="s1m3-choice" key={c.value}>
            <input type="radio" name={name} checked={value === c.value} onChange={() => onPick(c.value)} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const keyOf = ({ close, sigpipe, call }: DemoSettings) => `${close} ${sigpipe} ${call}`;
const FIRST: DemoSettings = { close: 'rst', sigpipe: 'default', call: 'write' };

export default function KeepAliveIsland() {
  const [settings, setSettings] = useState(FIRST);
  // The setting of each run the learner tried, and whether the server died in it.
  const [tried, setTried] = useState<Record<string, boolean>>(() => ({ [keyOf(FIRST)]: runDemo(FIRST).killed }));
  const run = runDemo(settings);
  const key = keyOf(settings);
  const alive = Object.values(tried).filter((killed) => !killed).length;
  const change = (patch: Partial<DemoSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setTried((t) => ({ ...t, [keyOf(next)]: runDemo(next).killed }));
  };

  return (
    <div class="s1m3-board">
      <Group legend="1. How does the client close?" name="s1m3-close" choices={CLOSES} value={settings.close} onPick={(close) => change({ close })} />
      <Group legend="2. What does the server do with SIGPIPE?" name="s1m3-sigpipe" choices={SIGPIPES} value={settings.sigpipe} onPick={(sigpipe) => change({ sigpipe })} />
      <Group legend="3. How does the server send?" name="s1m3-call" choices={CALLS} value={settings.call} onPick={(call) => change({ call })} />

      <section class="s1m3-result" aria-label="The run">
        <p class="s1m3-sub">The calls of the server, in a short form of strace output</p>
        <ol class="s1m3-run">
          {run.lines.map((line, i) => (
            <li key={`${key}-${i}`} class={`s1m3-line s1m3-line-${line.kind}`}>
              <span class="s1m3-kind">{KIND_WORD[line.kind]}</span>
              <span class="s1m3-line-body">
                {line.trace && <code>{line.trace}</code>}
                <span>{line.says}</span>
              </span>
            </li>
          ))}
        </ol>
        <div class={`s1m3-verdict ${run.killed ? 's1m3-verdict-ends' : 's1m3-verdict-handler-runs'}`} aria-live="polite">
          <p class="s1m3-verdict-head">
            <span aria-hidden="true">{run.killed ? '✕ ' : '✓ '}</span>
            {run.killed ? 'The server died.' : 'The server stayed alive.'} Exit status: <strong class="s1m3-num">{run.exitStatus}</strong>
          </p>
        </div>
        <p class="s1m3-muted">
          Settings tried: {Object.keys(tried).length} of {SETTINGS_COUNT}. Settings that kept the server alive: {alive}.
        </p>
      </section>

      <p class="s1m3-simplifies">
        What this simplifies: the client and the server run on one computer, so a reset comes back at once. Over a real network, a reset takes a round trip, so the results can differ. The server checks no result, as in the class code. Real strace writes send() as sendto(), and it also prints a line for an ignored SIGPIPE. This list leaves both out.
      </p>
    </div>
  );
}
