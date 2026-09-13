import { describe, expect, it } from 'vitest';
import { byteChar, escapeBytes, fieldBytes, hex, layout } from './bytes';

describe('fieldBytes', () => {
  it('reads hex with any spacing and case', () => {
    // s01-m08 rung 3: a 2-byte length, 5, then hello
    expect(fieldBytes({ hex: '00 05 68 65 6c 6c 6f' })).toEqual([0, 5, 0x68, 0x65, 0x6c, 0x6c, 0x6f]);
    expect(fieldBytes({ hex: '0005 686C' })).toEqual([0, 5, 0x68, 0x6c]);
  });

  it('encodes text as the same bytes as its hex', () => {
    expect(fieldBytes({ text: 'hello' })).toEqual(fieldBytes({ hex: '68 65 6c 6c 6f' }));
    expect(fieldBytes({ text: '\r\n' })).toEqual([0x0d, 0x0a]);
  });

  it('rejects a field with both, with neither, or with bad hex', () => {
    expect(() => fieldBytes({ hex: '00', text: 'a' })).toThrow();
    expect(() => fieldBytes({})).toThrow();
    expect(() => fieldBytes({ hex: '0' })).toThrow();
    expect(() => fieldBytes({ hex: 'zz' })).toThrow();
    expect(() => fieldBytes({ hex: '' })).toThrow();
  });
});

describe('layout', () => {
  it('matches the s05-m12 worked example: head 62 bytes, body 62 to 66, request 2 at 67', () => {
    const [first, second] = layout([
      {
        fields: [
          { text: 'POST /echo HTTP/1.1\r\n' },
          { text: 'Host: site-a.local\r\n' },
          { text: 'Content-Length: 5\r\n' },
          { text: '\r\n' },
          { text: 'hello' },
        ],
      },
      { fields: [{ text: 'GET /style.css HTTP/1.1\r\n' }] },
    ]);
    expect(first.fields.map((f) => f.bytes.length)).toEqual([21, 20, 19, 2, 5]);
    expect(first.fields[3].end).toBe(61);
    expect([first.fields[4].start, first.fields[4].end]).toEqual([62, 66]);
    expect(second.fields[0].start).toBe(67);
  });

  it('matches the s05-m12 faded example: head 63 bytes, request 2 at 74', () => {
    const [first, second] = layout([
      {
        fields: [
          { text: 'POST /echo HTTP/1.1\r\nHost: site-a.local\r\nContent-Length: 11\r\n\r\n' },
          { text: 'hello world' },
        ],
      },
      { fields: [{ text: 'GET' }] },
    ]);
    expect(first.fields[1].start).toBe(63);
    expect(second.fields[0].start).toBe(74);
  });
});

describe('display', () => {
  it('writes hex in upper case, two digits a byte', () => {
    expect(hex([0, 5, 0xc8])).toBe('00 05 C8');
  });

  it('shows CR, LF and control bytes so no byte is invisible', () => {
    expect([0x47, 0x0d, 0x0a, 0x00, 0x20].map(byteChar)).toEqual(['G', '\\r', '\\n', '·', ' ']);
    expect(escapeBytes(fieldBytes({ text: 'a\\b\r\n' }))).toBe('a\\\\b\\r\\n');
    expect(escapeBytes([0x00, 0x7f])).toBe('\\x00\\x7F');
  });
});
