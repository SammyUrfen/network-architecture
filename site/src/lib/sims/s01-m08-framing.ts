// Pure logic for the framing sandbox of s01-m08-framing. The sender frames
// messages with one rule, TCP cuts the bytes into reads of any size, and the
// reader uses the same rule to find the messages again.
//
// Graded-work limit (docs/curriculum/session-01.md, s01-m08 Interactives):
// only a fixed N, a newline delimiter and a 1-byte length prefix. No mode
// that joins two rules, and no CR LF CR LF with Content-Length. The page
// shows the reader state in words, never this code.

/** `none` is the wrong idea that one read gives one message. The sandbox shows it fail. */
export type Rule = 'none' | 'fixed' | 'delimiter' | 'length';
export type FieldKind = 'data' | 'length' | 'delimiter' | 'pad';

/** The newline, the delimiter of a homework 3 chat line (S01-Q11). */
export const DELIMITER = 0x0a;
/** Fixed length fills a short message with zero bytes. The slides name no pad byte, so this is a model choice. */
export const PAD = 0x00;
/** One length byte says 0 to 255 (session-01.md, s01-m08 check 4). */
export const MAX_LENGTH = 0xff;
/** The largest read in a random split. Small reads cut messages often, and that is what the learner must see. */
export const MAX_READ = 8;
/** The most wire bytes the sandbox shows. More bytes make rows too long to follow on a phone. */
export const MAX_WIRE = 64;

export interface Field {
  kind: FieldKind;
  bytes: number[];
}

export interface Frame {
  /** The bytes the sender writes for one message, in order. */
  fields: Field[];
  /** The bytes a correct reader gives back. With fixed length the pad stays in, because the reader counts N bytes. */
  payload: number[];
}

export type Framed = { frames: Frame[]; wire: number[] } | { error: string };

export interface Read {
  /** The bytes that this read() returned. */
  bytes: number[];
  /** The messages that the reader completed with this read. */
  found: number[][];
  /** The bytes that the reader keeps for the next message. */
  held: number[];
}

const ESCAPES: Record<string, number> = { '\\n': 0x0a, '\\r': 0x0d, '\\\\': 0x5c };

/** The learner's text as bytes: UTF-8, plus the escapes \n, \r, \\ and \xNN. Any other backslash stays as it is. */
export function textToBytes(text: string): number[] {
  // split() with a capture group puts each escape at an odd index.
  return text.split(/(\\(?:[nr\\]|x[0-9a-fA-F]{2}))/).flatMap((part, i) => {
    if (i % 2 === 0) return [...new TextEncoder().encode(part)];
    return [ESCAPES[part] ?? parseInt(part.slice(2), 16)];
  });
}

const plural = (count: number) => `${count} ${count === 1 ? 'byte' : 'bytes'}`;

/** The bytes that the sender writes for each message, or the reason it cannot frame one. */
export function frame(rule: Rule, messages: number[][], n: number): Framed {
  if (rule === 'fixed' && !(Number.isInteger(n) && n >= 1)) return { error: 'N must be a whole number of 1 or more.' };
  const frames: Frame[] = [];
  for (const [i, data] of messages.entries()) {
    const size = `Message ${i + 1} has ${plural(data.length)}.`;
    let fields: Field[];
    let payload = data;
    if (rule === 'fixed') {
      if (data.length > n) return { error: `${size} With fixed length, a message can have at most N = ${plural(n)}.` };
      const pad = Array<number>(n - data.length).fill(PAD);
      fields = [{ kind: 'data', bytes: data }, { kind: 'pad', bytes: pad }];
      payload = [...data, ...pad];
    } else if (rule === 'length') {
      if (data.length > MAX_LENGTH) return { error: `${size} One length byte can say at most ${MAX_LENGTH}.` };
      fields = [{ kind: 'length', bytes: [data.length] }, { kind: 'data', bytes: data }];
    } else if (rule === 'delimiter') {
      fields = [{ kind: 'data', bytes: data }, { kind: 'delimiter', bytes: [DELIMITER] }];
    } else {
      fields = [{ kind: 'data', bytes: data }];
    }
    frames.push({ fields: fields.filter((field) => field.bytes.length > 0), payload });
  }
  return { frames, wire: frames.flatMap((f) => f.fields.flatMap((field) => field.bytes)) };
}

/** Frames the lines that the learner typed, one message for each line that is not empty, or gives the problem to show. */
export function sandbox(lines: string[], rule: Rule, n: number): Framed {
  const messages = lines.filter((line) => line !== '').map(textToBytes);
  if (messages.length === 0) return { error: 'Type at least one message.' };
  const framed = frame(rule, messages, n);
  if ('error' in framed || framed.wire.length <= MAX_WIRE) return framed;
  return { error: `These messages need ${plural(framed.wire.length)}. The sandbox shows at most ${MAX_WIRE}. Use shorter messages.` };
}

/** Cuts `total` bytes into reads of 1 to `max` bytes. The same seed gives the same cuts (mulberry32). */
export function readSizes(total: number, seed: number, max = MAX_READ): number[] {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
  const sizes: number[] = [];
  for (let left = total; left > 0; left -= sizes.at(-1)!) {
    sizes.push(Math.min(left, 1 + Math.floor(random() * max)));
  }
  return sizes;
}

/** One message off the front of the held bytes, or null when the rule needs more bytes. */
function take(rule: Exclude<Rule, 'none'>, n: number, buf: number[]) {
  let start = 0;
  let end: number;
  let next: number;
  if (rule === 'fixed') {
    end = next = n;
  } else if (rule === 'delimiter') {
    end = buf.indexOf(DELIMITER);
    next = end + 1;
  } else {
    start = 1;
    end = next = 1 + (buf[0] ?? 0);
  }
  if (end < 0 || buf.length === 0 || next > buf.length) return null;
  return { message: buf.slice(start, end), rest: buf.slice(next) };
}

/** Runs the reader over the wire, one read for each size, and gives its state after each read. */
export function readAll(rule: Rule, n: number, wire: number[], sizes: number[]): Read[] {
  if (sizes.some((size) => !(Number.isInteger(size) && size >= 1)) || sizes.reduce((a, b) => a + b, 0) !== wire.length) {
    throw new Error('The read sizes must be whole numbers of 1 or more that add up to the wire length.');
  }
  if (rule === 'fixed' && !(Number.isInteger(n) && n >= 1)) throw new Error('N must be a whole number of 1 or more.');
  let offset = 0;
  let held: number[] = [];
  return sizes.map((size) => {
    const bytes = wire.slice(offset, (offset += size));
    if (rule === 'none') return { bytes, found: [bytes], held };
    const found: number[][] = [];
    held = [...held, ...bytes];
    for (let got = take(rule, n, held); got; got = take(rule, n, held)) {
      found.push(got.message);
      held = got.rest;
    }
    return { bytes, found, held };
  });
}

/** The offset after each message that the reader finds when every byte is in hand: the places where it cuts. */
export function messageEnds(rule: Exclude<Rule, 'none'>, n: number, wire: number[]): number[] {
  const ends: number[] = [];
  let rest = wire;
  for (let got = take(rule, n, rest); got; got = take(rule, n, rest)) {
    rest = got.rest;
    ends.push(wire.length - rest.length);
  }
  return ends;
}

/** The slot of byte i in a row of groups of the given sizes, with one empty slot between two groups. */
export function groupSlot(i: number, sizes: number[]): number {
  let end = 0;
  for (const [group, size] of sizes.entries()) {
    end += size;
    if (i < end) return i + group;
  }
  throw new Error(`Byte ${i} is not in the groups ${sizes.join(', ')}.`);
}

/** Compares the messages that the reader found with the frames that the sender wrote, in order. */
export function verdict(frames: Frame[], found: number[][]) {
  const matches = found.map((message, i) => {
    const payload = frames[i]?.payload;
    return payload !== undefined && payload.length === message.length && payload.every((b, j) => b === message[j]);
  });
  return { matches, ok: found.length === frames.length && matches.every(Boolean) };
}

/** The reader state after a read, in plain words for the page. */
export function stateText(rule: Rule, n: number, held: number[]): string {
  const count = held.length;
  switch (rule) {
    case 'none':
      return 'It keeps nothing. It takes each read as one whole message.';
    case 'fixed':
      return `It holds ${count} of ${plural(n)} for the next message.`;
    case 'delimiter':
      return count === 0
        ? 'It holds nothing. It looks for a newline in the next read.'
        : `It holds ${plural(count)} and no newline yet. It reads again.`;
    case 'length':
      return count === 0
        ? 'It holds nothing. The next byte is a length.'
        : `The next message has length ${held[0]}. It holds ${count - 1} of those ${plural(held[0])}.`;
  }
}
