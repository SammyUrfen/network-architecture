import { describe, expect, it } from 'vitest';
import { PRESETS, buildStream, cutReads, parseSizes, viewAfterRead, type RequestSpec } from './s05-m12-assignment-prep';

const post = (body: string): RequestSpec => ({ lines: ['POST /echo HTTP/1.1', 'Host: site-a.local'], body });
const get = (path: string): RequestSpec => ({ lines: [`GET ${path} HTTP/1.1`, 'Host: site-a.local'] });

describe('buildStream', () => {
  it('matches the worked example: head 62 bytes, body 62 to 66, request 2 at 67', () => {
    // docs/curriculum/session-05.md, s05-m12 worked example: 21 + 20 + 19 + 2 = 62
    const { text, requests } = buildStream([post('hello'), get('/style.css')]);
    expect(text.slice(0, 62)).toBe('POST /echo HTTP/1.1\r\nHost: site-a.local\r\nContent-Length: 5\r\n\r\n');
    expect(requests[0]).toEqual({ start: 0, headEnd: 61, end: 66 });
    expect(requests[1].start).toBe(67);
  });

  it('matches the faded example: head 63 bytes, request 2 at 74', () => {
    // docs/curriculum/session-05.md, s05-m12 faded example (63. 74.)
    const { requests } = buildStream([post('hello world'), get('/style.css')]);
    expect(requests[0].headEnd + 1).toBe(63);
    expect(requests[1].start).toBe(74);
  });

  it('matches the your-turn example: the second GET starts at byte 28', () => {
    // docs/curriculum/session-05.md, s05-m12 "Your turn" (Byte 28.)
    const { requests } = buildStream([{ lines: ['GET /a HTTP/1.1', 'Host: x'] }, { lines: ['GET /b HTTP/1.1', 'Host: x'] }]);
    expect(requests[1].start).toBe(28);
  });

  it('matches the talk.py capture of the pipelined pair: 91 bytes', () => {
    // tools/talk.py prints "--- sent 91 bytes" for /style.css then /app.js
    // (docs/curriculum/session-05.md, s05-m12 predict, observe, explain)
    const { text, requests } = buildStream([get('/style.css'), get('/app.js')]);
    expect(text.length).toBe(91);
    expect(requests[1].start).toBe(47);
  });

  it('ends every head with CRLF CRLF', () => {
    // RFC 9112 §2.1: HTTP-message = start-line CRLF *( field-line CRLF ) CRLF [ message-body ]
    const { text, requests } = buildStream([post('hello'), get('/style.css'), post('hello world')]);
    for (const r of requests) expect(text.slice(r.headEnd - 3, r.headEnd + 1)).toBe('\r\n\r\n');
  });

  it('gives a body exactly Content-Length bytes, and no body without it', () => {
    // RFC 9112 §6.3: Content-Length "defines the expected message body length in octets".
    // A request with no Content-Length and no Transfer-Encoding has a body length of zero.
    const { text, requests } = buildStream([post('hello world'), get('/app.js')]);
    expect(text.slice(requests[0].start, requests[0].headEnd)).toContain('Content-Length: 11\r\n');
    expect(requests[0].end - requests[0].headEnd).toBe(11);
    expect(text.slice(requests[1].start, requests[1].headEnd)).not.toContain('Content-Length');
    expect(requests[1].end).toBe(requests[1].headEnd);
  });

  it('rejects CR, LF or non-ASCII text, so one character is one byte', () => {
    expect(() => buildStream([{ lines: ['GET / HTTP/1.1\r\n'] }])).toThrow();
    expect(() => buildStream([{ lines: ['GET / HTTP/1.1'], body: 'héllo' }])).toThrow();
  });
});

describe('cutReads', () => {
  it('gives a big read only the bytes that are left', () => {
    // recv(2): "return any data available, up to the requested amount"
    expect(cutReads(91, [4096])).toEqual([{ start: 0, end: 90 }]);
  });

  it('repeats the last size until the stream ends', () => {
    expect(cutReads(114, [30, 50, 34])).toEqual([
      { start: 0, end: 29 },
      { start: 30, end: 79 },
      { start: 80, end: 113 },
    ]);
    expect(cutReads(20, [7])).toEqual([
      { start: 0, end: 6 },
      { start: 7, end: 13 },
      { start: 14, end: 19 },
    ]);
  });

  it('covers every byte one time, in order', () => {
    for (const sizes of [[1], [3, 1], [50, 2, 9], [200]]) {
      const reads = cutReads(114, sizes);
      expect(reads[0].start).toBe(0);
      expect(reads.at(-1)!.end).toBe(113);
      reads.slice(1).forEach((read, i) => expect(read.start).toBe(reads[i].end + 1));
    }
  });

  it('rejects an empty list, zero and fractions', () => {
    expect(() => cutReads(10, [])).toThrow();
    expect(() => cutReads(10, [0])).toThrow();
    expect(() => cutReads(10, [2.5])).toThrow();
  });
});

describe('parseSizes', () => {
  it('reads whole numbers split by commas or spaces', () => {
    expect(parseSizes('30, 50, 34')).toEqual([30, 50, 34]);
    expect(parseSizes(' 7 ')).toEqual([7]);
    expect(parseSizes('30 50,,4096')).toEqual([30, 50, 4096]);
  });

  it('gives null for text that is not a list of sizes', () => {
    for (const bad of ['', '   ', '0', '-3', '3.5', 'abc', '10, x', '1234567']) expect(parseSizes(bad)).toBeNull();
  });
});

describe('viewAfterRead', () => {
  it('keeps a request that is cut inside a header line in the buffer', () => {
    // docs/curriculum/session-05.md, s05-m12 local test plan 2: one request split inside a header line.
    // The Host line of this request is bytes 25 to 44, so a 30-byte read cuts it.
    const stream = buildStream([get('/style.css')]);
    const reads = cutReads(stream.text.length, [30]);
    expect(viewAfterRead(stream, reads, 0)).toEqual({ phases: ['head'], finished: [], buffer: { start: 0, end: 29 } });
    expect(viewAfterRead(stream, reads, 1)).toEqual({ phases: ['complete'], finished: [0], buffer: null });
  });

  it('shows one read that holds the end of request 1 and the start of request 2', () => {
    // Slide 3 of the session 5 deck: "byte n+1 belongs to somebody else" (S05-C09)
    const stream = buildStream([post('hello'), get('/style.css')]);
    const reads = cutReads(stream.text.length, [30, 50]);
    expect(viewAfterRead(stream, reads, 0)).toEqual({ phases: ['head', 'waiting'], finished: [], buffer: { start: 0, end: 29 } });
    expect(viewAfterRead(stream, reads, 1)).toEqual({ phases: ['complete', 'head'], finished: [0], buffer: { start: 67, end: 79 } });
    expect(viewAfterRead(stream, reads, 2)).toEqual({ phases: ['complete', 'complete'], finished: [1], buffer: null });
  });

  it('keeps a request with a full head but a short body unfinished', () => {
    // S05-C09 and RFC 9112 §6.3: the request ends after Content-Length body bytes, not at the empty line
    const stream = buildStream([post('hello'), get('/style.css')]);
    const phaseAfter = (bytes: number) => viewAfterRead(stream, cutReads(stream.text.length, [bytes, 1000]), 0).phases[0];
    // The last LF of the empty line is byte 61, and the last body byte is byte 66
    expect(phaseAfter(61)).toBe('head');
    expect(phaseAfter(62)).toBe('body');
    expect(phaseAfter(66)).toBe('body');
    expect(phaseAfter(67)).toBe('complete');
    const reads = cutReads(stream.text.length, [62, 1000]);
    expect(viewAfterRead(stream, reads, 0)).toEqual({ phases: ['body', 'waiting'], finished: [], buffer: { start: 0, end: 61 } });
  });

  it('empties the buffer when a read ends exactly where a request ends', () => {
    const stream = buildStream([post('hello'), get('/style.css')]);
    const reads = cutReads(stream.text.length, [67, 1000]);
    expect(viewAfterRead(stream, reads, 0)).toEqual({ phases: ['complete', 'waiting'], finished: [0], buffer: null });
  });

  it('finishes a request on the last byte of its body, even when that byte comes alone', () => {
    // Bytes 0 to 65 hold all but the last body byte, and byte 66 is a read of its own
    const stream = buildStream([post('hello'), get('/style.css')]);
    const reads = cutReads(stream.text.length, [66, 1, 1000]);
    expect(viewAfterRead(stream, reads, 0)).toEqual({ phases: ['body', 'waiting'], finished: [], buffer: { start: 0, end: 65 } });
    expect(viewAfterRead(stream, reads, 1)).toEqual({ phases: ['complete', 'waiting'], finished: [0], buffer: null });
  });

  it('finishes two requests in one read', () => {
    // docs/curriculum/session-05.md, s05-m12 local test plan 3 and 4: two requests in one write give two responses
    for (const pair of [
      [post('hello'), get('/style.css')],
      [get('/style.css'), get('/app.js')],
    ]) {
      const stream = buildStream(pair);
      const reads = cutReads(stream.text.length, [4096]);
      expect(viewAfterRead(stream, reads, 0)).toEqual({ phases: ['complete', 'complete'], finished: [0, 1], buffer: null });
    }
  });
});

describe('PRESETS', () => {
  it('holds the worked example stream and the talk.py pair', () => {
    const [worked, pair] = PRESETS.map((p) => buildStream(p.requests));
    expect([worked.text.length, worked.requests[1].start]).toEqual([114, 67]);
    expect([pair.text.length, pair.requests[1].start]).toEqual([91, 47]);
  });

  it('uses generic requests, never a calculator request (CLAUDE.md rule 4)', () => {
    // docs/curriculum/session-05.md, s05-m12 interactives: "not calculator requests"
    for (const p of PRESETS) expect(buildStream(p.requests).text).not.toMatch(/\/(add|sub|mul|div|pow)\b/);
  });

  it('gives each preset valid default sizes', () => {
    for (const p of PRESETS) expect(parseSizes(p.sizes)).not.toBeNull();
  });
});
