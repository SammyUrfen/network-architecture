// The shared confidence picker. Not an island: an island renders it and
// passes the callback. The confidence finds misconceptions. It is not a score.
import type { Confidence as Level } from '../../lib/progress';

export interface Props {
  /** The radio group name. It must be unique on the page. */
  name: string;
  value: Level | null;
  onChange: (value: Level) => void;
  disabled?: boolean;
}

const LEVELS: Array<[Level, string]> = [
  ['sure', 'Sure'],
  ['think', 'Think so'],
  ['guess', 'Guessing'],
];

export default function Confidence({ name, value, onChange, disabled = false }: Props) {
  return (
    <fieldset class="chk-confidence" disabled={disabled}>
      <legend>How sure are you?</legend>
      <div class="chk-confidence-row">
        {LEVELS.map(([level, label]) => (
          <label key={level}>
            <input type="radio" name={name} value={level} checked={value === level} onChange={() => onChange(level)} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
