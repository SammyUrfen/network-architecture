import { expect, test } from 'vitest';
import { stripMdx } from './lint-prose.mjs';

test('stripMdx keeps only the prose', () => {
  const mdx = [
    '---',
    'id: s01-m08-framing',
    '---',
    "import Segment from '../../components/lesson/Segment.astro';",
    '<Segment title="Two writes">',
    'A read returns `helloworld` in one call.',
    '```py',
    's.send(b"hello")',
    '```',
    '<Check id="s01-m08-q01" />',
    '</Segment>',
  ].join('\n');
  expect(stripMdx(mdx).split('\n').map((line) => line.trim()).filter(Boolean)).toEqual(['A read returns  in one call.']);
});
