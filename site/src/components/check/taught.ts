// "Taught in" links. A quiz item names the anchor where its page teaches the
// answer (verify rule 10): a KeyIdea id or a part anchor. The check wrappers
// turn it into a link label at build time. This file reads the raw MDX body
// with the same patterns as verify-content.mjs, so a test needs no content
// collection.
import { segmentAnchor, segmentTitles } from '../lesson/segments';

/** The island prop: a link to the place that taught the item. */
export interface TaughtIn {
  href: string;
  /** "Part 2, Fixed length and delimiters". The page adds "Taught in:". */
  label: string;
}

/**
 * The KeyIdea tags of a raw MDX body, in page order. `part` is the number of
 * the part that holds the tag: the count of <Segment> tags before it, so 0
 * before the first part. The id and the title must be plain string attributes.
 */
export function keyIdeas(mdxBody: string) {
  return [...mdxBody.matchAll(/<KeyIdea\b[^>]*>/g)].map(({ 0: tag, index }) => ({
    id: /\bid="([^"]*)"/.exec(tag)?.[1] ?? '',
    title: /\btitle="([^"]*)"/.exec(tag)?.[1] ?? '',
    part: (mdxBody.slice(0, index).match(/<Segment\b/g) ?? []).length,
  }));
}

/** The link label of an anchor, or null when no part and no KeyIdea of the body has it. */
export function taughtInLabel(mdxBody: string, anchor: string): string | null {
  const titles = segmentTitles(mdxBody);
  const part = titles.findIndex((title) => segmentAnchor(title) === anchor);
  if (part >= 0) return `Part ${part + 1}, ${titles[part]}`;
  const idea = keyIdeas(mdxBody).find(({ id }) => id === anchor);
  if (!idea) return null;
  return idea.part > 0 ? `Part ${idea.part}, ${idea.title}` : idea.title;
}
