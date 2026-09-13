// The request boundary finder of s05-m12: where the reads cut a byte stream,
// and where the requests in it really end.
//
// Graded-work guard (CLAUDE.md rule 4). This model does not read or parse
// bytes. It builds the stream from requests that it already knows, so it
// knows every boundary before the first read. A server knows none of them.
// The model gives no reading loop and no piece of a server.

export interface RequestSpec {
  /** The request line and the header lines, with no CRLF. */
  lines: string[];
  /** The body. The model adds a Content-Length line for it. */
  body?: string;
}

/** Offsets count from 0 and include the end, as in ByteView. */
export interface Span {
  start: number;
  end: number;
}

export interface RequestLayout {
  start: number;
  /** The last byte of the empty line that ends the head. */
  headEnd: number;
  /** The last byte of the request. It equals headEnd when the request has no body. */
  end: number;
}

export interface Stream {
  text: string;
  requests: RequestLayout[];
}

/** waiting: no byte arrived yet. head: the empty line did not arrive. body: body bytes are missing. */
export type Phase = 'waiting' | 'head' | 'body' | 'complete';

export interface ReadView {
  /** Where each request stands after this read. */
  phases: Phase[];
  /** The requests whose last byte came in this read. */
  finished: number[];
  /** The bytes that stay after the complete requests leave the buffer, or null for none. */
  buffer: Span | null;
}

/** Joins the requests into one stream. Text is printable ASCII, so one character is one byte. */
export function buildStream(specs: RequestSpec[]): Stream {
  let text = '';
  const requests = specs.map(({ lines, body = '' }) => {
    if (/[^\x20-\x7e]/.test(lines.join('') + body)) throw new Error('A request must be printable ASCII with no CR or LF.');
    const fields = body ? [...lines, `Content-Length: ${body.length}`] : lines;
    const head = fields.map((line) => `${line}\r\n`).join('') + '\r\n';
    const start = text.length;
    text += head + body;
    return { start, headEnd: start + head.length - 1, end: text.length - 1 };
  });
  return { text, requests };
}

/** Cuts the stream into reads of the given sizes. The last size repeats, and a read gets no more bytes than are left. */
export function cutReads(total: number, sizes: number[]): Span[] {
  if (sizes.length === 0 || sizes.some((n) => !Number.isInteger(n) || n < 1)) {
    throw new Error('Read sizes must be whole numbers of 1 or more.');
  }
  const reads: Span[] = [];
  for (let start = 0; start < total; start = reads.at(-1)!.end + 1) {
    const size = sizes[Math.min(reads.length, sizes.length - 1)];
    reads.push({ start, end: Math.min(start + size, total) - 1 });
  }
  return reads;
}

/** Reads "30, 50, 34" as sizes. Gives null for anything that is not a list of whole numbers from 1 to 999999. */
export function parseSizes(input: string): number[] | null {
  const parts = input.trim().split(/[\s,]+/);
  return parts.every((part) => /^[1-9]\d{0,5}$/.test(part)) ? parts.map(Number) : null;
}

/** The state of every request after read k. */
export function viewAfterRead({ requests }: Stream, reads: Span[], k: number): ReadView {
  const read = reads[k];
  const arrived = read.end + 1;
  const phases = requests.map((r): Phase => {
    if (arrived <= r.start) return 'waiting';
    if (arrived <= r.headEnd) return 'head';
    return arrived <= r.end ? 'body' : 'complete';
  });
  const finished = requests.flatMap((r, i) => (r.end >= read.start && r.end <= read.end ? [i] : []));
  const open = requests.find((r) => r.start < arrived && r.end >= arrived);
  return { phases, finished, buffer: open ? { start: open.start, end: read.end } : null };
}

export interface Preset {
  name: string;
  requests: RequestSpec[];
  /** The default text of the sizes field. */
  sizes: string;
}

export const PRESETS: Preset[] = [
  {
    // The stream of the s05-m12 worked example
    name: 'A POST with a body, then a GET',
    requests: [
      { lines: ['POST /echo HTTP/1.1', 'Host: site-a.local'], body: 'hello' },
      { lines: ['GET /style.css HTTP/1.1', 'Host: site-a.local'] },
    ],
    sizes: '30, 50, 34',
  },
  {
    // The pair that tools/talk.py sends in the s05-m12 predict, observe, explain block
    name: 'Two GETs in one send',
    requests: [
      { lines: ['GET /style.css HTTP/1.1', 'Host: site-a.local'] },
      { lines: ['GET /app.js HTTP/1.1', 'Host: site-a.local'] },
    ],
    sizes: '4096',
  },
];
