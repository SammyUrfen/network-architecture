import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ProgressModule = typeof import('./progress');

// A Map-backed localStorage that counts every call.
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    calls: 0,
    data,
    getItem(key: string) {
      storage.calls++;
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      storage.calls++;
      data.set(key, value);
    },
    removeItem(key: string) {
      storage.calls++;
      data.delete(key);
    },
  };
  return storage;
}

const saved = {
  version: 1,
  modules: { 's01-m08-framing': { startedAt: '2026-09-14T10:00:00.000Z', pretest: { right: 1, total: 3 } } },
  answers: { 's01-m08-q01': [{ at: '2026-09-14T10:05:00.000Z', correct: false, confidence: 'sure' }] },
  cards: { 's01-m08-c04': { box: 2, due: '2026-09-17', lapses: 0 } },
};
const savedJson = JSON.stringify(saved);

let storage: ReturnType<typeof fakeStorage>;
let p: ProgressModule;

// A fresh module for each test, so the store starts empty and unmounted.
async function load(initial: Record<string, string> = {}) {
  storage = fakeStorage(initial);
  vi.stubGlobal('localStorage', storage);
  vi.resetModules();
  p = await import('./progress');
}

beforeEach(() => load());
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('module load', () => {
  it('does not touch localStorage at import', async () => {
    await load({ 'na-progress': savedJson });
    expect(storage.calls).toBe(0);
  });

  it('works with no localStorage at all, as in the build', async () => {
    vi.unstubAllGlobals();
    vi.resetModules();
    const server = await import('./progress');
    expect(server.$progress.get()).toEqual(server.emptyProgress());
    server.updateProgress((progress) => ({ ...progress, cards: { c: { box: 1, due: '2026-09-15', lapses: 0 } } }));
    expect(server.$progress.get().cards.c?.box).toBe(1);
    expect(server.$progressProblem.get()).toBeNull();
  });
});

describe('empty store', () => {
  it('gives empty progress when nothing is stored', () => {
    expect(p.$progress.get()).toEqual({ version: 1, modules: {}, answers: {}, cards: {} });
    expect(p.$progressProblem.get()).toBeNull();
  });

  it('exports empty progress that imports again', () => {
    const file = p.exportProgress();
    expect(JSON.parse(file)).toEqual(p.emptyProgress());
    p.importProgress(file);
    expect(p.$progress.get()).toEqual(p.emptyProgress());
  });
});

describe('write-through', () => {
  it('reads the stored progress on the first subscriber', async () => {
    await load({ 'na-progress': savedJson });
    const seen: unknown[] = [];
    p.$progress.subscribe((value) => seen.push(value));
    expect(seen.at(-1)).toEqual(saved);
  });

  it('writes a change to the one key and to the store', () => {
    const listener = vi.fn();
    p.$progress.listen(listener);
    p.updateProgress((progress) => {
      progress.cards['s01-m08-c01'] = { box: 1, due: '2026-09-15', lapses: 0 };
      return progress;
    });
    const stored = JSON.parse(storage.data.get('na-progress') ?? 'null');
    expect(stored.cards['s01-m08-c01']).toEqual({ box: 1, due: '2026-09-15', lapses: 0 });
    expect(p.$progress.get()).toEqual(stored);
    // A change made in place still reaches the listeners.
    expect(listener).toHaveBeenCalled();
    expect([...storage.data.keys()]).toEqual(['na-progress']);
  });

  it('keeps what another tab saved after this tab read the store', () => {
    p.$progress.get();
    storage.data.set('na-progress', savedJson);
    p.updateProgress((progress) => ({ ...progress, cards: { ...progress.cards, new: { box: 1, due: '2026-09-15', lapses: 0 } } }));
    expect(Object.keys(p.$progress.get().cards).sort()).toEqual(['new', 's01-m08-c04']);
    expect(p.$progress.get().answers).toEqual(saved.answers);
  });
});

describe('import', () => {
  it('replaces the store and the stored data with a valid file', () => {
    p.importProgress(savedJson);
    expect(p.$progress.get()).toEqual(saved);
    expect(JSON.parse(storage.data.get('na-progress') ?? 'null')).toEqual(saved);
  });

  const bad: Array<[string, string, RegExp]> = [
    ['text that is not JSON', 'not json', /not JSON/],
    ['a file with no version', JSON.stringify({ modules: {} }), /no progress version/],
    ['an old schema version', JSON.stringify({ ...saved, version: 0 }), /version 0.*version 1/],
    ['a newer schema version', JSON.stringify({ ...saved, version: 2 }), /version 2.*version 1/],
    ['a JSON array', '[]', /no progress version/],
    ['a card in box 6', JSON.stringify({ ...saved, cards: { x: { box: 6, due: '2026-09-17', lapses: 0 } } }), /cards\.x/],
    ['a due date with a time', JSON.stringify({ ...saved, cards: { x: { box: 1, due: '2026-09-17T00:00', lapses: 0 } } }), /cards\.x/],
    ['a wrong confidence', JSON.stringify({ ...saved, answers: { q: [{ at: '2026-09-14T10:05:00Z', correct: true, confidence: 'maybe' }] } }), /answers\.q/],
    ['a pretest with more right than total', JSON.stringify({ ...saved, modules: { m: { startedAt: '2026-09-14T10:00:00Z', pretest: { right: 4, total: 3 } } } }), /modules\.m/],
    ['a missing section', JSON.stringify({ version: 1, modules: {}, answers: {} }), /cards/],
  ];

  it.each(bad)('rejects %s with a clear error and changes no data', async (_name, file, message) => {
    await load({ 'na-progress': savedJson, 'na-theme': 'dark' });
    p.$progress.get();
    const before = new Map(storage.data);
    expect(() => p.importProgress(file)).toThrow(message);
    expect(storage.data).toEqual(before);
    expect(p.$progress.get()).toEqual(saved);
  });
});

describe('reset', () => {
  it('clears the progress key and keeps the theme key', async () => {
    await load({ 'na-progress': savedJson, 'na-theme': 'dark' });
    p.resetProgress();
    expect(p.$progress.get()).toEqual(p.emptyProgress());
    expect(Object.fromEntries(storage.data)).toEqual({ 'na-theme': 'dark' });
  });
});

describe('stored data that cannot be read', () => {
  const newer = JSON.stringify({ ...saved, version: 2 });

  beforeEach(() => load({ 'na-progress': newer }));

  it('reports the problem and does not overwrite the stored data', () => {
    expect(p.$progress.get()).toEqual(p.emptyProgress());
    expect(p.$progressProblem.get()).toMatch(/version 2/);
    p.updateProgress((progress) => ({ ...progress, cards: { c: { box: 1, due: '2026-09-15', lapses: 0 } } }));
    expect(storage.data.get('na-progress')).toBe(newer);
    // The change stays in memory, so the page still works.
    expect(p.$progress.get().cards.c?.box).toBe(1);
  });

  it('clears the problem after a reset', () => {
    p.$progress.get();
    p.resetProgress();
    expect(p.$progressProblem.get()).toBeNull();
    p.updateProgress((progress) => ({ ...progress, cards: { c: { box: 1, due: '2026-09-15', lapses: 0 } } }));
    expect(JSON.parse(storage.data.get('na-progress') ?? 'null').cards.c.box).toBe(1);
  });

  it('clears the problem after an import', () => {
    p.$progress.get();
    p.importProgress(savedJson);
    expect(p.$progressProblem.get()).toBeNull();
    expect(storage.data.get('na-progress')).toBe(JSON.stringify(saved));
  });
});
