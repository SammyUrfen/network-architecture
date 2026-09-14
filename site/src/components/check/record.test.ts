import { describe, expect, it } from 'vitest';
import { emptyProgress } from '../../lib/progress';
import { addAnswer } from './record';

const now = new Date(2026, 8, 14, 10, 0);

describe('addAnswer', () => {
  it('logs every answer', () => {
    const progress = addAnswer(addAnswer(emptyProgress(), 's01-m08-q01', false, 'guess', now), 's01-m08-q01', true, 'think', now);
    expect(progress.answers['s01-m08-q01'].map((a) => [a.correct, a.confidence])).toEqual([
      [false, 'guess'],
      [true, 'think'],
    ]);
    expect(progress.cards).toEqual({});
  });

  it('puts a sure but wrong answer in the review queue for tomorrow', () => {
    const progress = addAnswer(emptyProgress(), 's01-m08-q01', false, 'sure', now);
    expect(progress.cards['s01-m08-q01']).toEqual({ box: 1, due: '2026-09-15', lapses: 1 });
  });

  it('moves an item that is already in the queue back to box 1', () => {
    const progress = emptyProgress();
    progress.cards['s01-m08-q01'] = { box: 4, due: '2026-10-01', lapses: 0 };
    expect(addAnswer(progress, 's01-m08-q01', false, 'sure', now).cards['s01-m08-q01']).toEqual({ box: 1, due: '2026-09-15', lapses: 1 });
  });

  it('leaves the queue alone for a sure right answer and an unsure wrong answer', () => {
    const progress = addAnswer(addAnswer(emptyProgress(), 's01-m08-q01', true, 'sure', now), 's01-m08-q02', false, 'think', now);
    expect(progress.cards).toEqual({});
  });

  it('saves an exit answer with no confidence field, and a wrong one stays out of the queue', () => {
    const progress = addAnswer(emptyProgress(), 's01-m08-q09', false, null, now);
    expect(progress.answers['s01-m08-q09']).toEqual([{ at: now.toISOString(), correct: false }]);
    expect(progress.cards).toEqual({});
  });
});
