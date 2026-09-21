import { useStore } from '@nanostores/preact';
import { $progress, type Progress } from '../lib/progress';
import { dueCards } from './_queue';

interface PageModule {
  id: string;
  title: string;
  href: string;
}

export interface Props {
  /** Every card ID and quiz item ID, the same list that /review/ holds. */
  reviewIds: string[];
  reviewHref: string;
  /** The modules with a page, in course order. */
  modules: PageModule[];
}

/**
 * The module for the "continue" link: the started module with the latest
 * `startedAt` and no `completedAt`. With none, the first module in course
 * order with no `startedAt`. With none of those either, undefined.
 */
export function continueModule<T extends { id: string }>(modules: readonly T[], saved: Progress['modules']): { module: T; started: boolean } | undefined {
  const started = modules
    .filter((m) => saved[m.id] && !saved[m.id].completedAt)
    .sort((a, b) => Date.parse(saved[b.id].startedAt) - Date.parse(saved[a.id].startedAt))[0];
  if (started) return { module: started, started: true };
  const fresh = modules.find((m) => !saved[m.id]);
  return fresh && { module: fresh, started: false };
}

// The "Today" part of the home page: the cards due today and a link back into a lesson.
export default function Today({ reviewIds, reviewHref, modules }: Props) {
  const progress = useStore($progress);
  const due = dueCards(
    reviewIds.map((id) => ({ id })),
    progress.cards,
    new Date(),
  ).length;
  const next = continueModule(modules, progress.modules);

  return (
    <>
      <p>
        {due === 0 ? 'No card is due today.' : `${due} ${due === 1 ? 'card is' : 'cards are'} due today.`}{' '}
        <a href={reviewHref}>Go to the review queue</a>
      </p>
      {next && (
        <p>
          {next.started ? 'Continue where you stopped: ' : 'Start the next lesson: '}
          <a href={next.module.href}>{next.module.title}</a>
        </p>
      )}
    </>
  );
}
