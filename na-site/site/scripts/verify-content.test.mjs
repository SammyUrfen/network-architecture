import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { parseSession, parseThreads, verify } from './verify-content.mjs';

const fixture = (path) => fileURLToPath(new URL(`fixtures/${path}`, import.meta.url));
const curriculum = fixture('curriculum');

describe('curriculum parsers', () => {
  test('read each line pattern of docs/PLAN.md section 5', () => {
    const session = parseSession(readFileSync(fixture('curriculum/session-01.md'), 'utf8'));
    expect([...session.claims]).toEqual([
      ['S01-C01', 'core'],
      ['S01-C02', 'core'],
      ['S01-C03', 'measured'],
    ]);
    // S01-M03 appears only in a reference bullet, so it has no definition.
    expect([...session.misconceptions]).toEqual(['S01-M01', 'S01-M02']);
    expect(session.modules).toEqual(['s01-m01-alpha']);
    expect([...parseThreads(readFileSync(fixture('curriculum/README.md'), 'utf8'))]).toEqual([
      'T-framing',
      'T-round-trip-tax',
    ]);
  });
});

describe('content rules', () => {
  test('a tree that obeys every rule passes', () => {
    const { failures, counts } = verify(fixture('content/good'), curriculum);
    expect(failures).toEqual([]);
    expect(counts).toMatchObject({ sessions: 2, plannedModules: 2, claims: 4, pages: 1, quizItems: 6, cards: 3 });
  });

  test('missing or empty content folders pass', () => {
    expect(verify(fixture('content/missing'), curriculum).failures).toEqual([]);
    const empty = mkdtempSync(join(tmpdir(), 'verify-content-'));
    try {
      for (const folder of ['modules', 'quiz', 'cards', 'sessions']) mkdirSync(join(empty, folder));
      expect(verify(empty, curriculum).failures).toEqual([]);
    } finally {
      rmSync(empty, { recursive: true });
    }
  });

  // [rule, the number of defects planted in fixtures/content/rule<N>]
  test.each([
    [1, 4],
    [2, 2],
    [3, 3],
    [4, 3],
    [5, 5],
    [6, 2],
    [7, 1],
    [8, 1],
    [9, 1],
    [10, 2],
    [11, 1],
  ])('rule %i fails on its fixture, with %i failures', (rule, defects) => {
    const { failures } = verify(fixture(`content/rule${rule}`), curriculum);
    expect(failures.map((failure) => failure.rule)).toEqual(Array(defects).fill(rule));
  });

  test('rule 5 counts a digest with the digest sizes', () => {
    const messages = verify(fixture('content/digest5'), curriculum).failures.map((failure) => failure.message);
    expect(messages).toEqual([
      's01-digest: 4 checks, needs 12 to 15',
      's01-digest: 0 exit items, needs 3 to 6',
      's01-digest: 2 cards, needs 25 to 30',
      's01-digest: 4 checks in segment 1, needs 2 to 3',
      's01-digest: 0 checks in segment 2, needs 2 to 3',
    ]);
  });

  test('rule 11 counts and names the core claims that the digest misses', () => {
    const [failure] = verify(fixture('content/rule11'), curriculum).failures;
    expect(failure.file).toMatch(/s01-digest\.mdx$/);
    expect(failure.message).toBe('1 core claim is in no ready lesson and in no digest: S01-C02');
  });

  test('rule 9 names the file and the position of the right option', () => {
    const [failure] = verify(fixture('content/rule9'), curriculum).failures;
    expect(failure.file).toMatch(/s01-m01-alpha\.yaml$/);
    expect(failure.message).toMatch(/option 2 in all 3 mcq and predict items/);
  });

  test('rule 10 names each item with no taughtIn or with an unknown anchor', () => {
    const messages = verify(fixture('content/rule10'), curriculum).failures.map((failure) => failure.message);
    expect(messages).toEqual([
      's01-m01-alpha-q01: no taughtIn',
      's01-m01-alpha-q04: taughtIn length-last is not a KeyIdea id or a segment anchor of s01-m01-alpha',
    ]);
  });
});
