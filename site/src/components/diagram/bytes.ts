// Pure byte logic for ByteView. The offsets on a page must be exact, so the
// tests check them against the byte counts in the curriculum files.

/** length and delimiter mark how a reader finds an end. pad is filler. No kind is plain data. */
export type FieldKind = 'length' | 'delimiter' | 'pad';

export interface ByteField {
  /** Hex pairs, such as "00 05". Give hex or text, not both. */
  hex?: string;
  /** Text, encoded as UTF-8. In MDX, write CR LF as {"\r\n"} so the escapes become bytes. */
  text?: string;
  label?: string;
  kind?: FieldKind;
}

export interface ByteMessage {
  /** Shown at the boundary where the message starts. */
  name?: string;
  fields: ByteField[];
}

export function fieldBytes(field: ByteField): number[] {
  if ((field.hex === undefined) === (field.text === undefined)) {
    throw new Error('A ByteView field needs hex or text, not both.');
  }
  if (field.text !== undefined) return [...new TextEncoder().encode(field.text)];
  const digits = field.hex!.replace(/\s+/g, '');
  if (!/^(?:[0-9a-f]{2})+$/i.test(digits)) throw new Error(`A ByteView field has bad hex: "${field.hex}"`);
  return digits.match(/../g)!.map((pair) => parseInt(pair, 16));
}

/** Gives each field its bytes and its offsets. Offsets count from 0 across all messages and include the end. */
export function layout(messages: ByteMessage[]) {
  let offset = 0;
  return messages.map((message) => ({
    ...message,
    fields: message.fields.map((field) => {
      const bytes = fieldBytes(field);
      const start = offset;
      offset += bytes.length;
      return { ...field, bytes, start, end: offset - 1 };
    }),
  }));
}

export const hex = (bytes: number[]) => bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');

/** The character under a hex byte: printable ASCII as it is, CR and LF as \r and \n, anything else as a dot. */
export function byteChar(b: number) {
  if (b === 0x0d) return '\\r';
  if (b === 0x0a) return '\\n';
  return b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : '·';
}

/** Bytes as text the way the lessons write it: \r and \n for CR and LF, \xNN for other control bytes. */
export function escapeBytes(bytes: number[]) {
  return bytes
    .map((b) => {
      if (b === 0x0d) return '\\r';
      if (b === 0x0a) return '\\n';
      if (b === 0x5c) return '\\\\';
      return b >= 0x20 && b <= 0x7e ? String.fromCharCode(b) : `\\x${hex([b])}`;
    })
    .join('');
}
