import { describe, expect, it } from 'vitest';
import { continueModule } from './_Today';

const modules = ['s01-m08-framing', 's05-m12-assignment-prep', 's05-m13-project-studio'].map((id) => ({ id }));
const at = (time: string) => `2026-09-14T${time}.000Z`;

describe('continueModule', () => {
  it('gives the unfinished module that started last', () => {
    const next = continueModule(modules, {
      // 09:30 UTC. As text it sorts after 10:00, so a text sort picks the wrong module.
      's01-m08-framing': { startedAt: '2026-09-14T15:00:00+05:30' },
      's05-m12-assignment-prep': { startedAt: at('10:00:00') },
      's05-m13-project-studio': { startedAt: at('12:00:00'), completedAt: at('12:30:00') },
    });
    expect(next).toEqual({ module: { id: 's05-m12-assignment-prep' }, started: true });
  });

  it('with no unfinished module, gives the first module in course order with no start', () => {
    const next = continueModule(modules, { 's01-m08-framing': { startedAt: at('10:00:00'), completedAt: at('10:20:00') } });
    expect(next).toEqual({ module: { id: 's05-m12-assignment-prep' }, started: false });
    expect(continueModule(modules, {})).toEqual({ module: { id: 's01-m08-framing' }, started: false });
  });

  it('gives nothing when every module is done', () => {
    const done = { startedAt: at('10:00:00'), completedAt: at('10:20:00') };
    expect(continueModule(modules, Object.fromEntries(modules.map((m) => [m.id, done])))).toBeUndefined();
    expect(continueModule([], {})).toBeUndefined();
  });
});
