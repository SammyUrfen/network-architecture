import { useState } from 'preact/hooks';
import { byteChar, escapeBytes, hex } from '../../diagram/bytes';
import { stepForKey } from '../../diagram/stepper';
import {
  MAX_READ,
  MAX_WIRE,
  readAll,
  readSizes,
  sandbox,
  stateText,
  verdict,
  type FieldKind,
  type Rule,
} from '../../../lib/sims/s01-m08-framing';

// The island inside FramingSandbox.astro. The learner picks messages, a rule
// and a cut, then steps through the reads with Back and Next, or with the
// arrow keys, Home and End. No autoplay (PEDAGOGY rule 7). The page shows the
// reader state in words, not parser code (the graded-work limit of s01-m08).
export interface Props {
  /** The accessible name of the sandbox. Also names its radio groups, so keep it unique on the page. */
  title: string;
  /** The first messages, one string each. Write \n for a newline byte and \xNN for any byte. */
  messages: string[];
  rule: Rule;
  /** N for fixed length, in bytes. Default 8. */
  n?: number;
  /** one: every byte in one read, as in the loopback run. random: reads of 1 to 8 bytes. Default random. */
  split?: 'one' | 'random';
}

const RULES: { value: Rule; label: string }[] = [
  { value: 'none', label: 'No rule: each read is one message' },
  { value: 'fixed', label: 'Fixed length: every message is N bytes' },
  { value: 'delimiter', label: 'Delimiter: a newline ends each message' },
  { value: 'length', label: 'Length prefix: the first byte gives the length' },
];

const count = (k: number, word: string) => `${k} ${word}${k === 1 ? '' : 's'}`;
const shown = (bytes: number[]) => (bytes.length === 0 ? '(empty)' : escapeBytes(bytes));

function Cells({ bytes, kinds }: { bytes: number[]; kinds: FieldKind[] }) {
  return (
    <span class="bytes" aria-hidden="true">
      {bytes.map((b, i) => (
        <span class={`cell ${kinds[i]}`} key={i}>
          <span>{hex([b])}</span>
          <span class="char">{byteChar(b)}</span>
        </span>
      ))}
    </span>
  );
}

export default function SandboxIsland({ title, messages, rule: firstRule, n: firstN = 8, split: firstSplit = 'random' }: Props) {
  const [text, setText] = useState(messages.join('\n'));
  const [rule, setRule] = useState(firstRule);
  const [n, setN] = useState(firstN);
  const [split, setSplit] = useState(firstSplit);
  const [seed, setSeed] = useState(1);
  const [at, setAt] = useState(0);
  // Every change of input starts the reads again from step 0.
  const change = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setAt(0);
  };

  const framed = sandbox(text.split('\n'), rule, n);
  const inputs = (
    <div class="inputs">
      <label class="messages">
        <span>Messages, one on each line</span>
        <textarea rows={3} spellcheck={false} value={text} onInput={(e) => change(setText)(e.currentTarget.value)} />
      </label>
      <p class="hint">
        Write <code>\n</code> for a newline byte inside a message, and <code>\xNN</code> for any byte.
      </p>
      <fieldset>
        <legend>The rule that the sender and the reader share</legend>
        {RULES.map((r) => (
          <label class="choice" key={r.value}>
            <input type="radio" name={`${title} rule`} checked={rule === r.value} onChange={() => change(setRule)(r.value)} />
            {r.label}
          </label>
        ))}
        {rule === 'fixed' && (
          <label class="number">
            N, in bytes
            <input type="number" min={1} max={MAX_WIRE} value={Number.isNaN(n) ? '' : n} onInput={(e) => change(setN)(e.currentTarget.valueAsNumber)} />
          </label>
        )}
      </fieldset>
      <fieldset>
        <legend>How TCP cuts the bytes into reads</legend>
        <label class="choice">
          <input type="radio" name={`${title} split`} checked={split === 'one'} onChange={() => change(setSplit)('one')} />
          All bytes in one read, as in the loopback run
        </label>
        <label class="choice">
          <input type="radio" name={`${title} split`} checked={split === 'random'} onChange={() => change(setSplit)('random')} />
          Random reads of 1 to {MAX_READ} bytes
        </label>
        {split === 'random' && (
          <button type="button" onClick={() => change(setSeed)(seed + 1)}>
            New random cut (cut {seed})
          </button>
        )}
      </fieldset>
    </div>
  );

  const simplifies = (
    <p class="simplifies">
      <strong>What this simplifies:</strong> a random number picks the read sizes here. Real TCP sizes come from segments,
      timing and buffer space. Each message leaves in one write(), and fixed length pads with zero bytes. Like real TCP,
      the model never loses, reorders or changes a byte.
    </p>
  );

  if ('error' in framed) {
    return (
      <div class="sandbox" role="group" aria-label={title}>
        {inputs}
        <p class="problem" role="alert">
          {framed.error}
        </p>
        {simplifies}
      </div>
    );
  }

  const { frames, wire } = framed;
  const kinds = frames.flatMap((f) => f.fields.flatMap((field) => field.bytes.map(() => field.kind)));
  const sizes = split === 'one' ? [wire.length] : readSizes(wire.length, seed);
  const reads = readAll(rule, n, wire, sizes);
  const steps = reads.length + 1;
  const step = Math.min(at, steps - 1);
  const done = reads.slice(0, step);
  const found = done.flatMap((r) => r.found);
  const { matches, ok } = verdict(frames, found);
  const misses = matches.filter((m) => !m).length;
  const current = done.at(-1);
  const start = done.reduce((sum, r) => sum + r.bytes.length, 0);
  const left = wire.length - start;

  const onKeyDown = (event: KeyboardEvent) => {
    const target = stepForKey(event.key, step, steps);
    if (target === null) return;
    event.preventDefault();
    setAt(target);
  };

  let offset = 0;
  return (
    <div class="sandbox" role="group" aria-label={title}>
      {inputs}

      <div class="lane">
        <p class="lane-label">The sender writes</p>
        <div class="groups">
          {frames.map((f, m) => {
            const bytes = f.fields.flatMap((field) => field.bytes);
            const from = offset;
            offset += bytes.length;
            return (
              <div class="group" key={m}>
                <span class="group-label">message {m + 1}</span>
                <Cells bytes={bytes} kinds={kinds.slice(from, offset)} />
                <span class="sr-only">{`Message ${m + 1}: ${hex(bytes)}`}</span>
              </div>
            );
          })}
        </div>
        <p class="legend">
          The line under a byte shows its role:{' '}
          {(['length', 'delimiter', 'pad', 'data'] as const)
            .filter((kind) => kinds.includes(kind))
            .map((kind) => (
              <span class={`key ${kind}`} key={kind}>
                {kind}
              </span>
            ))}
        </p>
      </div>

      <div class="lane">
        <p class="lane-label">read() returns</p>
        <div class="groups">
          {done.length === 0 && <span class="empty">no read yet</span>}
          {done.map((r, k) => {
            const from = done.slice(0, k).reduce((sum, d) => sum + d.bytes.length, 0);
            return (
              <div class={k === step - 1 ? 'group now' : 'group'} key={k}>
                <span class="group-label">read {k + 1}</span>
                <Cells bytes={r.bytes} kinds={kinds.slice(from, from + r.bytes.length)} />
                <span class="sr-only">{`Read ${k + 1}: ${hex(r.bytes)}`}</span>
              </div>
            );
          })}
          {left > 0 && <span class="empty">{count(left, 'byte')} still in TCP</span>}
        </div>
      </div>

      <div class="reads" role="group" aria-label={`${title}: reads, one at a time`} onKeyDown={onKeyDown}>
        <p class="caption" aria-live="polite">
          <strong>
            Step {step + 1} of {steps}.
          </strong>{' '}
          {current
            ? `Read ${step} returns ${count(current.bytes.length, 'byte')}: ${hex(current.bytes)}. The reader finds ${count(current.found.length, 'message')} in it.`
            : `The sender wrote ${count(wire.length, 'byte')} in ${count(frames.length, 'message')}. Predict how many messages the reader finds, then press Next.`}
        </p>
        <p class="state">
          <strong>The reader.</strong> {stateText(rule, n, current?.held ?? [])}
          {current && current.held.length > 0 && <> Held bytes: {hex(current.held)}.</>}
        </p>
        {found.length > 0 && (
          <ol class="found">
            {found.map((message, i) => (
              <li class={matches[i] ? 'match' : 'miss'} key={i}>
                <code>{shown(message)}</code>{' '}
                {matches[i]
                  ? `✓ matches message ${i + 1}`
                  : i < frames.length
                    ? `✗ the sender wrote message ${i + 1} as ${shown(frames[i].payload)}`
                    : `✗ the sender wrote no message ${i + 1}`}
              </li>
            ))}
          </ol>
        )}
        {step === steps - 1 && (
          <p class={ok ? 'verdict match' : 'verdict miss'}>
            {ok
              ? `✓ The reader found ${count(frames.length, 'message')}. Each one matches what the sender wrote.`
              : found.length !== frames.length
                ? `✗ The reader found ${count(found.length, 'message')}, but the sender wrote ${frames.length}.`
                : `✗ The reader found ${count(found.length, 'message')}, but ${misses} of them ${misses === 1 ? 'does' : 'do'} not match what the sender wrote.`}
          </p>
        )}
        <div class="controls">
          <button type="button" aria-disabled={step === 0} onClick={() => setAt(Math.max(step - 1, 0))}>
            Back
          </button>
          <button type="button" aria-disabled={step === steps - 1} onClick={() => setAt(Math.min(step + 1, steps - 1))}>
            Next
          </button>
          <span class="keys">Keys: ← → Home End</span>
        </div>
      </div>

      {simplifies}
    </div>
  );
}
