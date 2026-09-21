import { useStore } from '@nanostores/preact';
import type { TargetedEvent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  $progress,
  $progressProblem,
  exportProgress,
  importProgress,
  parseProgress,
  resetProgress,
  type Progress,
} from '../lib/progress';
import { localDay } from '../lib/schedule';

/** The page island takes no props. */
export interface Props {}

type Action = 'export' | 'import' | 'reset';
type Pending = { action: 'import'; name: string; json: string } | { action: 'reset' };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const summary = (p: Progress) => {
  const answers = Object.values(p.answers).reduce((n, list) => n + list.length, 0);
  return `${plural(Object.keys(p.modules).length, 'module')}, ${plural(Object.keys(p.cards).length, 'review card')}, ${plural(answers, 'answer')}`;
};

const isEmpty = (p: Progress) => [p.modules, p.answers, p.cards].every((record) => Object.keys(record).length === 0);

export default function ProgressTools(_: Props) {
  const progress = useStore($progress);
  const problem = useStore($progressProblem);
  const [pending, setPending] = useState<Pending | null>(null);
  const [status, setStatus] = useState<{ action: Action; ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const cancelButton = useRef<HTMLButtonElement>(null);

  // A confirm step opens with the focus on "Cancel", the safe choice.
  useEffect(() => cancelButton.current?.focus(), [pending]);

  function download() {
    const name = `network-architecture-progress-${localDay(new Date())}.json`;
    const url = URL.createObjectURL(new Blob([exportProgress()], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    // Revoke on the next task, after the click gives the file to the browser.
    setTimeout(() => URL.revokeObjectURL(url));
    setStatus({ action: 'export', ok: true, text: `Exported ${name}: ${summary(progress)}.` });
  }

  async function choose(event: TargetedEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const json = await file.text();
    input.value = ''; // so the same file can be chosen again
    // A bad file shows its error now, not after a confirm step that it can never pass.
    try {
      parseProgress(json);
    } catch (error) {
      setPending(null);
      setStatus({ action: 'import', ok: false, text: `${(error as Error).message} Your saved progress did not change.` });
      return;
    }
    // Ask first only when the import can replace saved progress.
    if (isEmpty($progress.get())) apply(file.name, json);
    else ask({ action: 'import', name: file.name, json });
  }

  // An old message under a new question reads as its answer, so it goes.
  function ask(next: Pending) {
    setStatus(null);
    setPending(next);
  }

  function apply(name: string, json: string) {
    try {
      importProgress(json);
      setStatus({ action: 'import', ok: true, text: `Imported ${name}: ${summary($progress.get())}.` });
    } catch (error) {
      setStatus({ action: 'import', ok: false, text: `${(error as Error).message} Your saved progress did not change.` });
    }
  }

  function confirm() {
    if (pending?.action === 'import') apply(pending.name, pending.json);
    if (pending?.action === 'reset') {
      resetProgress();
      setStatus({ action: 'reset', ok: true, text: 'All progress on this site is deleted.' });
    }
    close();
  }

  function close() {
    (pending?.action === 'reset' ? resetButton : fileInput).current?.focus();
    setPending(null);
  }

  const confirmStep = (question: string, label: string) => (
    <div class="confirm" role="group" aria-label="Confirm">
      <p>{question}</p>
      <div class="buttons">
        <button type="button" class="btn" ref={cancelButton} onClick={close}>
          Cancel
        </button>
        <button type="button" class="btn danger" onClick={confirm}>
          {label}
        </button>
      </div>
    </div>
  );

  // One live region for each action, always in the page, so a screen reader reads each new message.
  const note = (action: Action) => (
    <p class="note" role="status">
      {status?.action === action && (
        <span class={status.ok ? 'ok' : 'bad'}>
          <span aria-hidden="true">{status.ok ? '✓ ' : '✗ '}</span>
          {status.text}
        </span>
      )}
    </p>
  );

  return (
    <>
      {problem && (
        <p class="problem" role="alert">
          <strong>Your progress is not saved.</strong> {problem} Import a good file, or reset to start again.
        </p>
      )}
      <p class="summary">
        {problem ? 'In this tab only' : 'Saved in this browser'}: {summary(progress)}.
      </p>

      <h2>Export</h2>
      <p>Save your progress as a JSON file. Export before you clear the browser data or open the site at a new address. The file does not hold the theme choice.</p>
      <button type="button" class="btn" onClick={download}>
        Export progress
      </button>
      {note('export')}

      <h2>Import</h2>
      <p>Load a file that the export made. The file replaces all progress on this site.</p>
      <label class="file">
        Choose a progress file
        <input ref={fileInput} type="file" accept=".json,application/json" onChange={choose} />
      </label>
      {pending?.action === 'import' &&
        confirmStep(`Replace your saved progress (${summary(progress)}) with ${pending.name}?`, 'Replace my progress')}
      {note('import')}

      <h2>Reset</h2>
      <p>Delete all progress on this site: modules, answers and review cards. The theme choice stays.</p>
      <button type="button" class="btn" ref={resetButton} onClick={() => ask({ action: 'reset' })}>
        Reset progress
      </button>
      {pending?.action === 'reset' &&
        confirmStep(`Delete all saved progress (${summary(progress)})? You cannot undo this.`, 'Delete all progress')}
      {note('reset')}
    </>
  );
}
