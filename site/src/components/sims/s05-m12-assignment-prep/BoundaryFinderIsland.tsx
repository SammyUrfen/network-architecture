import type { JSX } from 'preact';
import { useState } from 'preact/hooks';
import { PRESETS, buildStream, cutReads, parseSizes, viewAfterRead, type Phase, type RequestLayout } from '../../../lib/sims/s05-m12-assignment-prep';
import { byteChar } from '../../diagram/bytes';
import { clampStep, stepForKey } from '../../diagram/stepper';

// The island inside BoundaryFinder.astro. The learner picks a stream and the
// bytes in each read, then moves one read at a time with Back and Next, or with
// the arrow keys, Home and End. No autoplay (PEDAGOGY rule 7).
export interface Props {}

function phaseText(phase: Phase, r: RequestLayout, arrived: number) {
  if (phase === 'waiting') return 'no bytes yet.';
  if (phase === 'head') return 'the head is not complete, because its empty line did not fully arrive.';
  if (phase === 'body') return `the head is complete, but the body has ${arrived - r.headEnd - 1} of its ${r.end - r.headEnd} bytes.`;
  return 'complete.';
}

export default function BoundaryFinderIsland(_: Props) {
  const [presetAt, setPresetAt] = useState(0);
  const [sizesText, setSizesText] = useState(PRESETS[0].sizes);
  const [sizes, setSizes] = useState(parseSizes(PRESETS[0].sizes)!);
  const [step, setStep] = useState(0);

  const stream = buildStream(PRESETS[presetAt].requests);
  const { text, requests } = stream;
  const reads = cutReads(text.length, sizes);
  const at = clampStep(step, reads.length);
  const last = reads.length - 1;
  const read = reads[at];
  const view = viewAfterRead(stream, reads, at);
  const valid = parseSizes(sizesText) !== null;
  const go = (n: number) => setStep(clampStep(n, reads.length));

  const pickPreset = (i: number) => {
    setPresetAt(i);
    setSizesText(PRESETS[i].sizes);
    setSizes(parseSizes(PRESETS[i].sizes)!);
    setStep(0);
  };
  const typeSizes = (value: string) => {
    setSizesText(value);
    const parsed = parseSizes(value);
    if (parsed) {
      setSizes(parsed);
      setStep(0);
    }
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const target = stepForKey(event.key, at, reads.length);
    if (target === null) return;
    event.preventDefault();
    go(target);
  };

  // One ruler row for each line of the stream. A row breaks after LF only, so a
  // body with no LF runs straight into the next request, as it does on the wire.
  const cutAfter = new Set(reads.slice(0, at + 1).map((r) => r.end));
  const rows: { offset: number; cells: JSX.Element[] }[] = [{ offset: 0, cells: [] }];
  let request = -1;
  for (let i = 0; i < text.length; i++) {
    const cells = rows[rows.length - 1].cells;
    if (requests[request + 1]?.start === i) {
      request++;
      cells.push(
        <span class="mark start" key={`r${i}`}>
          R{request + 1}
        </span>,
      );
    }
    const when = i < read.start ? 'before' : i <= read.end ? 'now' : 'later';
    cells.push(
      <span class={`byte ${when} req-${request % 2}`} key={i}>
        {byteChar(text.charCodeAt(i))}
      </span>,
    );
    if (cutAfter.has(i)) {
      cells.push(
        <span class="mark cut" key={`c${i}`}>
          ✂
        </span>,
      );
    }
    if (text[i] === '\n' && i < text.length - 1) rows.push({ offset: i + 1, cells: [] });
  }

  const finished = view.finished.map((i) => i + 1);
  const bufferOwner = view.buffer && requests.findIndex((r) => r.start === view.buffer!.start) + 1;

  return (
    <div class="finder" role="group" aria-label="Request boundary finder">
      <div class="inputs">
        <fieldset>
          <legend>Stream</legend>
          {PRESETS.map((preset, i) => (
            <label class="choice" key={preset.name}>
              <input type="radio" name="s05-m12-stream" checked={i === presetAt} onChange={() => pickPreset(i)} />
              {` ${preset.name}, ${buildStream(preset.requests).text.length} bytes`}
            </label>
          ))}
        </fieldset>
        <label class="sizes">
          Bytes in each read
          <input
            type="text"
            inputMode="numeric"
            value={sizesText}
            aria-invalid={!valid}
            aria-describedby="s05-m12-sizes-hint"
            onInput={(event) => typeSizes(event.currentTarget.value)}
          />
        </label>
        <p id="s05-m12-sizes-hint" class="hint">
          Put commas between the sizes. The last size repeats until the stream ends.
        </p>
        {!valid && (
          <p class="error" role="alert">
            Type whole numbers from 1 to 999999. The finder keeps the last good sizes.
          </p>
        )}
      </div>

      <div class="steps" onKeyDown={onKeyDown}>
        <div class="ruler" aria-hidden="true">
          {rows.map((row) => (
            <div class="row" key={row.offset}>
              <span class="offset">{row.offset}</span>
              <span class="cells">{row.cells}</span>
            </div>
          ))}
        </div>
        <p class="legend" aria-hidden="true">
          R1 and R2 mark where a request starts. ✂ marks where a read ends. The bytes of this read have a thick
          underline. Faded bytes did not arrive yet.
        </p>
        <div class="status" aria-live="polite">
          <p>
            <strong>
              Read {at + 1} of {reads.length}
            </strong>{' '}
            gets bytes {read.start} to {read.end}, {read.end - read.start + 1} bytes.{' '}
            {finished.length === 0
              ? 'It finishes no request.'
              : `It finishes request${finished.length > 1 ? 's' : ''} ${finished.join(' and ')}.`}
          </p>
          <ul>
            {requests.map((r, i) => (
              <li key={i}>
                Request {i + 1}, bytes {r.start} to {r.end}: {phaseText(view.phases[i], r, read.end + 1)}
              </li>
            ))}
          </ul>
          <p>
            {view.buffer
              ? `The buffer keeps bytes ${view.buffer.start} to ${view.buffer.end}, a part of request ${bufferOwner}.`
              : 'The buffer is empty.'}
            {at === last &&
              ' The stream ends here. The client keeps the connection open, so no end of file comes. The next read waits for more bytes.'}
          </p>
        </div>
        {at < last && (
          <p class="ask">
            <strong>Predict before you press Next:</strong> does read {at + 2} finish a request?
          </p>
        )}
        <div class="controls">
          <button type="button" aria-disabled={at === 0} onClick={() => go(at - 1)}>
            Back
          </button>
          <button type="button" aria-disabled={at === last} onClick={() => go(at + 1)}>
            Next
          </button>
          <span class="keys">Keys: ← → Home End</span>
        </div>
      </div>
    </div>
  );
}
