import { useState } from 'preact/hooks';
import { MAX_PORT, SLIDE_PORTS, UNPRIVILEGED_START, bindCheck, isPrivileged, type Who } from '../../../lib/sims/s01-m02-ports-and-queue';
import './m02.css';

// The visual of Part 1. The learner picks a port, who starts the server and
// the address, and sees the result of bind() and who can connect. The two
// zones of the ruler are not to scale: 1023 ports on the left, 64512 on the right.

const WHO: { value: Who; label: string }[] = [
  { value: 'user', label: 'A normal user' },
  { value: 'root', label: 'Root, the admin account' },
  { value: 'capability', label: 'A normal user with the one right to bind low ports' },
];

type Address = 'any' | 'loopback';
const ADDRESS: { value: Address; label: string }[] = [
  { value: 'any', label: 'Every address of the computer (INADDR_ANY)' },
  { value: 'loopback', label: 'Only 127.0.0.1, this computer' },
];

const nameOf = (port: number) => SLIDE_PORTS.find((p) => p.port === port)?.name;

function Zone({ low, port, pick }: { low: boolean; port: number; pick: (p: number) => void }) {
  return (
    <div class={low ? 'm02-zone low' : 'm02-zone high'}>
      <p class="m02-zone-label">
        {low ? `1 to ${UNPRIVILEGED_START - 1}: root only` : `${UNPRIVILEGED_START} to ${MAX_PORT}: any user`}
      </p>
      <div class="m02-ports">
        {SLIDE_PORTS.filter((p) => isPrivileged(p.port) === low).map((p) => (
          <button type="button" class="m02-port" aria-pressed={p.port === port} onClick={() => pick(p.port)} key={p.port}>
            <span class="m02-port-number">{p.port}</span>
            <span class="m02-port-name">{p.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PortPicker({ title }: { title: string }) {
  const [port, setPort] = useState(80);
  const [who, setWho] = useState<Who>('user');
  const [address, setAddress] = useState<Address>('any');
  const check = bindCheck(port, who);
  const name = nameOf(port);
  const what = `bind() on port ${Number.isNaN(port) ? '?' : port}${name ? ` (${name})` : ''}`;

  let result: string;
  let risk = '';
  if (port === 0) result = 'Port 0 asks the kernel to pick any free port, as listen() does in Part 2. Pick a port from 1 up here.';
  else if (check === 'invalid') result = `A port is a whole number from 1 to ${MAX_PORT}.`;
  else if (check === 'denied') {
    result = `✗ ${what} fails with "Permission denied". Only root may bind a port below ${UNPRIVILEGED_START}.`;
    risk = 'The usual design: the program binds 8080 as a normal user, and a front proxy owns 80 and 443.';
  } else {
    result = `✓ ${what} works.`;
    if (who === 'root') {
      risk = isPrivileged(port)
        ? 'The program runs as root. If it keeps root while it reads requests, a bug in that code gives an attacker root.'
        : 'Any user may bind this port, so root adds only risk here. A bug in a root program gives an attacker root.';
    } else if (who === 'capability') {
      risk = 'The program keeps the rights of a normal user. A bug gives an attacker only those rights, plus the low ports.';
    }
  }
  const reach =
    check !== 'ok'
      ? ''
      : address === 'any'
        ? 'Programs on this computer and on other computers can connect to it.'
        : 'Only programs on this computer can connect. Another computer finds no program on this port.';

  return (
    <div class="m02-sim" role="group" aria-label={title}>
      <div class="m02-ruler">
        <Zone low port={port} pick={setPort} />
        <Zone low={false} port={port} pick={setPort} />
      </div>
      <p class="m02-note">The two zones are not to scale. The ports on the buttons are the ones on the slide.</p>

      <label class="m02-number">
        Or type any port
        <input
          type="number"
          min={0}
          max={MAX_PORT}
          value={Number.isNaN(port) ? '' : port}
          onInput={(e) => setPort(e.currentTarget.valueAsNumber)}
        />
      </label>

      <fieldset class="m02-fieldset">
        <legend>Who starts the server program</legend>
        {WHO.map((w) => (
          <label class="m02-choice" key={w.value}>
            <input type="radio" name={`${title} who`} checked={who === w.value} onChange={() => setWho(w.value)} />
            {w.label}
          </label>
        ))}
      </fieldset>

      <fieldset class="m02-fieldset">
        <legend>The address that bind() gets</legend>
        {ADDRESS.map((a) => (
          <label class="m02-choice" key={a.value}>
            <input type="radio" name={`${title} address`} checked={address === a.value} onChange={() => setAddress(a.value)} />
            {a.label}
          </label>
        ))}
      </fieldset>

      <div class={`m02-result ${check === 'ok' ? 'ok' : check === 'denied' ? 'bad' : 'info'}`} aria-live="polite">
        <p>
          <strong>{result}</strong>
        </p>
        {risk && <p>{risk}</p>}
        {reach && <p>{reach}</p>}
      </div>

      <p class="m02-simplifies">
        <strong>What this simplifies:</strong> Linux with the line at its default, 1024. The model leaves out a port that
        another program already holds, a program that starts as root and then drops root, and firewalls.
      </p>
    </div>
  );
}
