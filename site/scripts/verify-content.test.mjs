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
  ])('rule %i fails on its fixture, with %i failures', (rule, defects) => {
    const { failures } = verify(fixture(`content/rule${rule}`), curriculum);
    expect(failures.map((failure) => failure.rule)).toEqual(Array(defects).fill(rule));
  });
});
