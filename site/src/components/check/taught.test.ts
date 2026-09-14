import { describe, expect, it } from 'vitest';
import { keyIdeas, taughtInLabel } from './taught';

const body = `
Opening story.

<KeyIdea id="bytes-not-messages" title="TCP carries bytes, not messages">
Before any part.
</KeyIdea>

<Segment title="A byte stream has no edges">
<KeyIdea title="A read returns what is there" id="a-read-returns-what-is-there">
One read can hold half a message.
</KeyIdea>
</Segment>

<Segment title="Fixed length and delimiters">
<Picture breaks="x">story</Picture>
<KeyIdea id="two-answers" title="Two answers to one question">
Text.
</KeyIdea>
</Segment>
`;

describe('keyIdeas', () => {
  it('reads id and title in any order, with the part that holds each tag', () => {
    expect(keyIdeas(body)).toEqual([
      { id: 'bytes-not-messages', title: 'TCP carries bytes, not messages', part: 0 },
      { id: 'a-read-returns-what-is-there', title: 'A read returns what is there', part: 1 },
      { id: 'two-answers', title: 'Two answers to one question', part: 2 },
    ]);
  });
});

describe('taughtInLabel', () => {
  it('gives the part number and the part title for a part anchor', () => {
    expect(taughtInLabel(body, 'seg-fixed-length-and-delimiters')).toBe('Part 2, Fixed length and delimiters');
  });

  it('gives the number of the part that holds a KeyIdea, and the KeyIdea title', () => {
    expect(taughtInLabel(body, 'a-read-returns-what-is-there')).toBe('Part 1, A read returns what is there');
    expect(taughtInLabel(body, 'two-answers')).toBe('Part 2, Two answers to one question');
  });

  it('gives only the title for a KeyIdea before the first part', () => {
    expect(taughtInLabel(body, 'bytes-not-messages')).toBe('TCP carries bytes, not messages');
  });

  it('gives null for an anchor that the page does not have', () => {
    expect(taughtInLabel(body, 'seg-no-such-part')).toBeNull();
    expect(taughtInLabel(body, 'two')).toBeNull();
    expect(taughtInLabel('', 'two-answers')).toBeNull();
  });
});
