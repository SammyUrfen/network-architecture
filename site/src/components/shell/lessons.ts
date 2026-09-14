// Readable names for the sidebar, the session page and ModuleLink, so the UI
// never shows a raw module ID or thread ID. A lesson with no page yet takes
// its title from the curriculum file of its session.

export interface Lesson {
  id: string;
  title: string;
}

/**
 * The planned lessons of one curriculum file, in the order of their headings.
 * The heading pattern is the one of scripts/verify-content.mjs. The title is
 * the `- **Title:**` line under the heading, without its last period.
 */
export function parseCurriculum(markdown: string): Lesson[] {
  const parts = markdown.split(/^### (s\d\d-m\d\d-[a-z0-9-]+)$/m);
  const lessons: Lesson[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i + 1].match(/^- \*\*Title:\*\* (.+?)\.?(?: \*\*Minutes:\*\*.*)?$/m)?.[1];
    lessons.push({ id: parts[i], title: title ?? slugTitle(parts[i].slice(8)) });
  }
  return lessons;
}

/** "setup-off-path" gives "Setup off path". */
const slugTitle = (slug: string) => slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll('-', ' ');

/** The thread table has no title column, so the name comes from the ID: T-skip-unknown is "Skip unknown". */
export const threadTitle = (id: string) => slugTitle(id.replace(/^T-/, ''));

// Sessions 6 to 8 have no curriculum file until after their class.
const curriculum = import.meta.glob<string>('../../../../docs/curriculum/session-*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export const plannedLessons = (session: number) =>
  parseCurriculum(curriculum[`../../../../docs/curriculum/session-${String(session).padStart(2, '0')}.md`] ?? '');

/** The title of a lesson with no page yet. */
export const plannedTitle = (id: string) =>
  plannedLessons(Number(id.slice(1, 3))).find((lesson) => lesson.id === id)?.title ?? slugTitle(id.slice(8));

/**
 * Every lesson of a session: the planned ones in curriculum order, then any
 * page with no heading. A lesson with a page takes the title of its page.
 */
export function sessionLessons(planned: Lesson[], pages: Lesson[]) {
  return [
    ...planned.map((lesson) => ({ ...lesson, ...pages.find((page) => page.id === lesson.id) })),
    ...pages.filter((page) => !planned.some((lesson) => lesson.id === page.id)),
  ].map((lesson) => ({ ...lesson, hasPage: pages.some((page) => page.id === lesson.id) }));
}
