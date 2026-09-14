// The visuals of s05-m12: the reading animation of part 1 (layoutCells), the
// request boundary finder of part 2 (buildStream to viewAfterRead), and the
// status picker of part 3 (CARDS, judge).
//
// Graded-work guard (CLAUDE.md rule 4). This model does not read or parse
// bytes. It builds the stream from requests that it already knows, so it
// knows every boundary before the first read. A server knows none of them.
// The model gives no reading loop and no piece of a server. The status picker
// holds a hand-written answer for each request of the assignment slide, and no
// rule that finds a status.

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

/** One byte of the stream, placed on a row of the reading animation. */
export interface Cell {
  byte: number;
  row: number;
  /** The left edge, in SVG units. */
  x: number;
  width: number;
  /** The text of the cell: the character, or \r and \n for CR and LF. */
  label: string;
}

/** Cell widths in SVG units. CR and LF show as two characters, so they get a wider cell. */
export const CELL = { char: 10, control: 14 } as const;

/** Places each byte on a row. A row ends after LF only, so a body with no LF runs into the next request, as on the wire. */
export function layoutCells(text: string, x0 = 0): Cell[] {
  let row = 0;
  let x = x0;
  return [...text].map((ch, byte) => {
    const control = ch === '\r' || ch === '\n';
    const cell = { byte, row, x, width: control ? CELL.control : CELL.char, label: control ? (ch === '\r' ? '\\r' : '\\n') : ch };
    x += cell.width;
    if (ch === '\n') {
      row++;
      x = x0;
    }
    return cell;
  });
}

export type Status = 200 | 400 | 404 | 405 | 500 | 501;

/** The statuses of the picker. `means` follows RFC 9110 §15.3.1, §15.5.1, §15.5.5, §15.5.6, §15.6.1 and §15.6.2. */
export const STATUSES: { code: Status; name: string; means: string }[] = [
  { code: 200, name: 'OK', means: '200 says that the request worked.' },
  { code: 400, name: 'Bad Request', means: '400 says that the client sent something wrong, so the server does not do the request.' },
  { code: 404, name: 'Not Found', means: '404 says that the server has no such path.' },
  { code: 405, name: 'Method Not Allowed', means: '405 says that the path exists, but it does not allow this method.' },
  { code: 500, name: 'Internal Server Error', means: '500 says that something unexpected broke inside the server.' },
  { code: 501, name: 'Not Implemented', means: '501 says that the server does not know this method for any path.' },
];

export interface RequestCard {
  id: string;
  /** The request of a slide row. A second line says what the request leaves out. */
  lines: string[];
  status: Status;
  /** What is wrong with the request, or why nothing is. It never names a status code. */
  problem: string;
  /** Said only after a right drop. */
  extra?: string;
}

/**
 * The requests and statuses of the assignment slide (session 5 deck, PDF page 3).
 * Each card has one problem or none. The slide writes the no-Host row as
 * "GET /add". The card adds the values of row 1, so a missing value is not a
 * second problem.
 */
export const CARDS: RequestCard[] = [
  { id: 'add', lines: ['GET /add?a=2&b=3'], status: 200, problem: 'Nothing is wrong: /add exists, it allows GET, and both values are numbers.', extra: 'The body is 5.' },
  { id: 'div-zero', lines: ['GET /div?a=1&b=0'], status: 400, problem: 'The input is wrong: b is 0, and nobody can divide by zero.' },
  { id: 'not-number', lines: ['GET /add?a=x&b=3'], status: 400, problem: 'The input is wrong: x is not a number.' },
  { id: 'pow', lines: ['GET /pow?a=2&b=8'], status: 404, problem: 'The path is wrong: the calculator has no /pow.' },
  { id: 'post', lines: ['POST /add'], status: 405, problem: 'The method is wrong for this path: /add exists, but it takes GET only.', extra: 'The answer also carries an Allow line that lists GET.' },
  { id: 'no-host', lines: ['GET /add?a=2&b=3', 'with no Host line'], status: 400, problem: 'The request is not complete: every HTTP/1.1 request must carry a Host line.' },
  { id: 'div', lines: ['GET /div?a=9&b=3'], status: 200, problem: 'Nothing is wrong: /div exists, it allows GET, and 9 divided by 3 is 3.', extra: 'The body is 3.' },
];

/** The feedback for one drop. A wrong drop says what that status means and what is wrong, but not the right status. */
export function judge(card: RequestCard, code: Status): { correct: boolean; feedback: string } {
  const picked = STATUSES.find((s) => s.code === code);
  if (!picked) throw new Error(`The picker has no status ${code}.`);
  if (code !== card.status) return { correct: false, feedback: `Not ${code}. ${picked.means} ${card.problem}` };
  return { correct: true, feedback: [`${card.problem} So it earns ${code} ${picked.name}.`, card.extra].filter(Boolean).join(' ') };
}
