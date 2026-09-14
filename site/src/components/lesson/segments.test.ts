import { describe, expect, it } from 'vitest';
import { segmentAnchor, segmentTitles, splitLead } from './segments';

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

describe('splitLead', () => {
  it('splits after the first paragraph, past the hydration scripts', () => {
    const html = '<script>a<b</script>\n<p>In this <code>part</code>.</p>\n<p>Two.</p>';
    expect(splitLead(html)).toEqual(['<script>a<b</script>\n<p>In this <code>part</code>.</p>', '\n<p>Two.</p>']);
  });

  it('gives an empty lead when the segment starts with another block', () => {
    const html = '<details><p>Inside a box.</p></details><p>After.</p>';
    expect(splitLead(html)).toEqual(['', html]);
  });
});
