import { describe, expect, it } from 'vitest';
import { segmentAnchor, segmentTitles } from './segments';

describe('segmentTitles', () => {
  it('finds one title for each tag that the verify script counts', () => {
    const body = [
      '<Segment title="A byte stream has no edges">',
      'text',
      '</Segment>',
      '<Segment',
      '  title="Three rules, or two?"',
      '>',
      '</Segment>',
    ].join('\n');
    expect(segmentTitles(body)).toEqual(['A byte stream has no edges', 'Three rules, or two?']);
    expect(segmentTitles(body)).toHaveLength((body.match(/<Segment\b/g) ?? []).length);
  });
});

describe('segmentAnchor', () => {
  it('gives a plain anchor with a prefix that no other heading uses', () => {
    expect(segmentAnchor('Three rules, or two?')).toBe('seg-three-rules-or-two');
  });
});
