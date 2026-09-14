import { useState } from 'preact/hooks';
import { deliver, MAX_SIGNAL, readStatus, SIGNAL_STATUS_BASE, SIGNALS, signalInfo, type Setting, type SignalName } from '../../../lib/sims/s01-m03-signals-sigpipe';
import './m03.css';

// The signal board of Part 2. The learner picks a signal and what the
// program set up for it, and sees what the kernel does and the exit status.
// A second tool reads an exit status back into a signal number. Nothing
// moves by itself.

const SETTINGS: { value: Setting; label: string }[] = [
  { value: 'default', label: 'Nothing: keep the default' },
  { value: 'handler', label: 'A handler: run its own code' },
  { value: 'ignore', label: 'Ignore the signal' },
];

const RESULT_WORD = {
  ends: 'The process ends',
  stops: 'The process pauses',
  'handler-runs': 'The handler runs',
  ignored: 'The signal is dropped',
} as const;

export default function SignalBoardIsland() {
  const [name, setName] = useState<SignalName>('SIGPIPE');
  const [setting, setSetting] = useState<Setting>('default');
  const [typed, setTyped] = useState('141');

  const info = signalInfo(name);
  const delivery = deliver(name, setting);
  const reading = typed.trim() === '' ? null : readStatus(Number(typed));

  return (
    <div class="s1m3-board">
      <fieldset class="s1m3-group">
        <legend>1. Pick a signal</legend>
        <div class="s1m3-signals">
          {SIGNALS.map((s) => (
            <label class="s1m3-choice" key={s.name}>
              <input type="radio" name="s1m3-signal" checked={name === s.name} onChange={() => setName(s.name)} />
              <span>
                <code>{s.name}</code> {s.number}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset class="s1m3-group">
        <legend>2. What did the program set up for it?</legend>
        <div class="s1m3-options">
          {SETTINGS.map((s) => (
            <label class="s1m3-choice" key={s.value}>
              <input type="radio" name="s1m3-setting" checked={setting === s.value} onChange={() => setSetting(s.value)} />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section class="s1m3-result" aria-label="What happens">
        <p class="s1m3-sub">
          {info.name}, signal {info.number}
          {!info.numberOnSlide && <span class="s1m3-flag">number from Linux, not from the slide</span>}
        </p>
        <p>
          <strong>Sent when:</strong> {info.sender}
        </p>
        <p>
          <strong>Can a handler catch it?</strong> {info.catchable ? 'Yes.' : 'No. No process can catch or ignore it.'}
        </p>
        <div class={`s1m3-verdict s1m3-verdict-${delivery.result}`} aria-live="polite">
          <p class="s1m3-verdict-head">
            <span aria-hidden="true">{delivery.result === 'ends' ? '✕ ' : delivery.result === 'stops' ? '❚❚ ' : '✓ '}</span>
            {RESULT_WORD[delivery.result]}
          </p>
          <p>{delivery.says}</p>
          <p class="s1m3-status-line">
            Exit status: {delivery.exitStatus === null ? <span>none, because the process did not end</span> : <strong class="s1m3-num">{delivery.exitStatus}</strong>}
          </p>
        </div>
      </section>

      <section class="s1m3-group s1m3-reader" aria-label="Read an exit status">
        <label class="s1m3-field">
          <span>3. Read an exit status. Type a number from 0 to 255:</span>
          <input type="number" inputMode="numeric" min={0} max={255} value={typed} onInput={(e) => setTyped(e.currentTarget.value)} />
        </label>
        <p aria-live="polite">
          {reading ? reading.says : `Type a whole number from 0 to 255. A shell shows ${SIGNAL_STATUS_BASE} + N when signal N ends a process.`}
        </p>
        <p class="s1m3-simplifies">
          Linux signal numbers go from 1 to {MAX_SIGNAL}, so no signal gives a status over {SIGNAL_STATUS_BASE + MAX_SIGNAL}.
        </p>
      </section>

      <p class="s1m3-simplifies">
        What this simplifies: a handler here always lets the process go on. Real code in a handler can also clean up and end the process. The numbers are the Linux numbers on x86 and ARM computers.
      </p>
    </div>
  );
}
