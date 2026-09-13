import { describe, expect, it } from 'vitest';
import { escapeBytes, hex } from '../../components/diagram/bytes';
import {
  DELIMITER,
  MAX_READ,
  MAX_WIRE,
  frame,
  readAll,
  readSizes,
  sandbox,
  stateText,
  textToBytes,
  verdict,
  type Frame,
  type Rule,
} from './s01-m08-framing';

const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0));
const bytesOf = (h: string) => h.split(' ').map((pair) => parseInt(pair, 16));

/** Frames the messages, or fails the test when the sender cannot frame them. */
function framed(rule: Rule, messages: string[], n = 8) {
  const result = frame(rule, messages.map(textToBytes), n);
  if ('error' in result) throw new Error(result.error);
  return result;
}

const found = (rule: Rule, n: number, wire: number[], sizes: number[]) =>
  readAll(rule, n, wire, sizes).flatMap((read) => read.found);

describe('textToBytes', () => {
  it('reads \\n as one newline byte', () => {
    // docs/curriculum/session-01.md, s01-m08 "Your turn": the user sends the text a\nb as one message.
    expect(textToBytes('a\\nb')).toEqual([0x61, 0x0a, 0x62]);
  });

  it('reads \\r, \\\\ and \\xNN, and keeps any other backslash', () => {
    expect(textToBytes('\\r\\\\\\x00\\xFF')).toEqual([0x0d, 0x5c, 0x00, 0xff]);
    expect(textToBytes('\\t\\x4')).toEqual(ascii('\\t\\x4'));
  });

  it('encodes other text as UTF-8', () => {
    // RFC 3629 section 3: U+00E9 is C3 A9.
    expect(textToBytes('é')).toEqual([0xc3, 0xa9]);
  });

  it('gives back every byte that escapeBytes writes', () => {
    const all = Array.from({ length: 256 }, (_, b) => b);
    expect(textToBytes(escapeBytes(all))).toEqual(all);
  });
});

describe('frame', () => {
  it('writes a 1-byte length before the bytes', () => {
    // sources/cn-at-scaler/lesson1/10_tlv.c prints TLV: 01 05 68 65 6C 6C 6F for "hello".
    // Without its type byte 01, that is the 1-byte length prefix 05 and then hello.
    expect(hex(framed('length', ['hello']).wire)).toBe('05 68 65 6C 6C 6F');
    // docs/curriculum/session-01.md, s01-m08 faded example: 05 68 65 6c 6c 6f 01 21.
    expect(hex(framed('length', ['hello', '!']).wire)).toBe('05 68 65 6C 6C 6F 01 21');
  });

  it('refuses a message longer than one length byte can say', () => {
    // docs/curriculum/session-01.md, s01-m08 check 4: a 1-byte length prefix describes at most 255 bytes.
    expect(framed('length', ['a'.repeat(255)]).wire[0]).toBe(255);
    const result = frame('length', [ascii('a'.repeat(256))], 8);
    expect(result).toEqual({ error: expect.stringContaining('255') });
  });

  it('ends each message with a newline and escapes nothing', () => {
    // docs/curriculum/session-01.md, S01-Q11: a newline delimiter, the first rule most people pick for a chat line.
    expect(framed('delimiter', ['hello', 'world']).wire).toEqual(ascii('hello\nworld\n'));
    expect(framed('delimiter', ['a\\nb']).wire).toEqual(ascii('a\nb\n'));
  });

  it('pads each message to exactly N bytes and refuses a longer one', () => {
    // sources/session-01/slides.txt, slide 39: "every message is exactly N bytes", paid for in padding.
    const { frames, wire } = framed('fixed', ['hello', 'hi'], 8);
    expect(hex(wire)).toBe('68 65 6C 6C 6F 00 00 00 68 69 00 00 00 00 00 00');
    expect(frames[0].fields).toEqual([
      { kind: 'data', bytes: ascii('hello') },
      { kind: 'pad', bytes: [0, 0, 0] },
    ]);
    expect(frames[0].payload).toHaveLength(8);
    expect(framed('fixed', ['12345678'], 8).frames[0].fields).toEqual([{ kind: 'data', bytes: ascii('12345678') }]);
    expect(frame('fixed', [ascii('123456789')], 8)).toEqual({ error: expect.stringContaining('N = 8') });
    expect(frame('fixed', [ascii('a')], 0)).toEqual({ error: expect.stringContaining('N') });
  });

  it('adds nothing with no rule', () => {
    expect(framed('none', ['hello', 'world']).wire).toEqual(ascii('helloworld'));
  });

  it('marks each field with its role', () => {
    expect(framed('length', ['hi']).frames[0].fields).toEqual([
      { kind: 'length', bytes: [2] },
      { kind: 'data', bytes: ascii('hi') },
    ]);
    expect(framed('delimiter', ['hi']).frames[0].fields).toEqual([
      { kind: 'data', bytes: ascii('hi') },
      { kind: 'delimiter', bytes: [DELIMITER] },
    ]);
  });
});

describe('sandbox', () => {
  it('frames one message for each line that is not empty', () => {
    expect(sandbox(['abc', '', 'hi'], 'length', 8)).toEqual(framed('length', ['abc', 'hi']));
  });

  it('gives a problem for no messages, a sender error, or too many bytes', () => {
    expect(sandbox(['', ''], 'delimiter', 8)).toEqual({ error: 'Type at least one message.' });
    expect(sandbox(['123456789'], 'fixed', 8)).toEqual({ error: expect.stringContaining('N = 8') });
    expect(sandbox(['a'.repeat(MAX_WIRE)], 'none', 8)).not.toHaveProperty('error');
    expect(sandbox(['a'.repeat(MAX_WIRE - 1)], 'delimiter', 8)).not.toHaveProperty('error');
    expect(sandbox(['a'.repeat(MAX_WIRE)], 'delimiter', 8)).toEqual({ error: expect.stringContaining(`${MAX_WIRE + 1} bytes`) });
  });
});

describe('readAll', () => {
  it('shows that one read is not one message', () => {
    // docs/curriculum/session-01.md, s01-m08 rung 3 (verified): send(b"hello") and send(b"world") on
    // loopback gave the persistent echo server one read(4, "helloworld", 4096) = 10.
    const { frames, wire } = framed('none', ['hello', 'world']);
    const oneRead = found('none', 8, wire, [10]);
    expect(oneRead).toEqual([ascii('helloworld')]);
    expect(verdict(frames, oneRead)).toEqual({ matches: [false], ok: false });
    // docs/curriculum/session-01.md, s01-m08 rung 2: the receiver can get hel and then loworld.
    expect(found('none', 8, wire, [3, 7])).toEqual([ascii('hel'), ascii('loworld')]);
  });

  it('follows the worked example of a 1-byte length prefix read by read', () => {
    // docs/curriculum/session-01.md, s01-m08 worked example: 03 61 62 63 02 68 69 arrives as
    // 03 61, then 62 63 02 68, then 69. Message 1 is "abc", message 2 is "hi", each across two reads.
    const { frames, wire } = framed('length', ['abc', 'hi']);
    expect(hex(wire)).toBe('03 61 62 63 02 68 69');
    const reads = readAll('length', 8, wire, [2, 4, 1]);
    expect(reads.map((r) => hex(r.bytes))).toEqual(['03 61', '62 63 02 68', '69']);
    expect(reads.map((r) => r.found)).toEqual([[], [ascii('abc')], [ascii('hi')]]);
    expect(reads.map((r) => hex(r.held))).toEqual(['03 61', '02 68', '']);
    expect(verdict(frames, reads.flatMap((r) => r.found)).ok).toBe(true);
  });

  it('shows that a delimiter inside the data breaks the reader', () => {
    // docs/curriculum/session-01.md, s01-m08 "Your turn": a\nb as one message gives two messages, "a" and "b".
    const { frames, wire } = framed('delimiter', ['a\\nb']);
    const got = found('delimiter', 8, wire, [wire.length]);
    expect(got).toEqual([ascii('a'), ascii('b')]);
    expect(verdict(frames, got)).toEqual({ matches: [false, false], ok: false });
  });

  it('finds several messages in one read and keeps the start of the next', () => {
    const { wire } = framed('fixed', ['ab', 'cd', 'ef'], 2);
    const reads = readAll('fixed', 2, wire, [5, 1]);
    expect(reads[0].found).toEqual([ascii('ab'), ascii('cd')]);
    expect(reads[0].held).toEqual(ascii('e'));
    expect(reads[1].found).toEqual([ascii('ef')]);
  });

  it('gives back every message for every split when the rule fits the data', () => {
    const messages = ['hello', 'world', 'hi'];
    for (const rule of ['fixed', 'delimiter', 'length'] as const) {
      const { frames, wire } = framed(rule, messages, 8);
      for (let seed = 1; seed <= 200; seed++) {
        const reads = readAll(rule, 8, wire, readSizes(wire.length, seed));
        expect(reads.flatMap((r) => r.bytes)).toEqual(wire);
        expect(verdict(frames, reads.flatMap((r) => r.found)).ok).toBe(true);
      }
    }
  });

  it('refuses a split that does not cover the bytes', () => {
    expect(() => readAll('length', 8, [1, 2, 3], [2])).toThrow();
    expect(() => readAll('length', 8, [1, 2, 3], [3, 0])).toThrow();
    expect(() => readAll('fixed', 0, [1], [1])).toThrow();
  });
});

describe('readSizes', () => {
  it('splits every byte into reads of 1 to MAX_READ bytes', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const sizes = readSizes(40, seed);
      expect(sizes.reduce((a, b) => a + b, 0)).toBe(40);
      expect(sizes.every((s) => Number.isInteger(s) && s >= 1 && s <= MAX_READ)).toBe(true);
    }
  });

  it('gives the same split for the same seed, and other splits for other seeds', () => {
    expect(readSizes(40, 7)).toEqual(readSizes(40, 7));
    const splits = new Set(Array.from({ length: 20 }, (_, i) => readSizes(40, i + 1).join()));
    expect(splits.size).toBeGreaterThan(15);
    expect(readSizes(0, 3)).toEqual([]);
  });

  it('with no rule, many splits give back the wrong messages', () => {
    const { frames, wire } = framed('none', ['hello', 'world', 'hi']);
    const wrong = Array.from({ length: 50 }, (_, i) => readSizes(wire.length, i + 1)).filter(
      (sizes) => !verdict(frames, found('none', 8, wire, sizes)).ok,
    );
    expect(wrong.length).toBeGreaterThan(45);
  });
});

describe('verdict', () => {
  const frames: Frame[] = [
    { fields: [], payload: [1] },
    { fields: [], payload: [2] },
  ];

  it('needs the same count and the same bytes in order', () => {
    expect(verdict(frames, [[1], [2]])).toEqual({ matches: [true, true], ok: true });
    expect(verdict(frames, [[1]])).toEqual({ matches: [true], ok: false });
    expect(verdict(frames, [[2], [1]])).toEqual({ matches: [false, false], ok: false });
    expect(verdict(frames, [[1], [2], [3]])).toEqual({ matches: [true, true, false], ok: false });
  });
});

describe('stateText', () => {
  it('says what the reader holds and what it waits for', () => {
    expect(stateText('none', 8, [])).toMatch(/each read as one whole message/);
    expect(stateText('fixed', 8, bytesOf('68 65 6c'))).toBe('It holds 3 of 8 bytes for the next message.');
    expect(stateText('fixed', 1, [])).toBe('It holds 0 of 1 byte for the next message.');
    expect(stateText('delimiter', 8, [])).toBe('It holds nothing. It looks for a newline in the next read.');
    expect(stateText('delimiter', 8, [0x68])).toBe('It holds 1 byte and no newline yet. It reads again.');
    expect(stateText('length', 8, [])).toBe('It holds nothing. The next byte is a length.');
    expect(stateText('length', 8, bytesOf('03 61'))).toBe('The next message has length 3. It holds 1 of those 3 bytes.');
    expect(stateText('length', 8, [0x03])).toBe('The next message has length 3. It holds 0 of those 3 bytes.');
  });
});
