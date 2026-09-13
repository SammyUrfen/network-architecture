// The module page lists the segments in its header before the MDX renders,
// so it reads the titles from the raw MDX body. Segment and ModuleHeader use
// the same anchor, so an outline link always finds its segment.

export const segmentAnchor = (title: string) =>
  'seg-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * The title of each <Segment> in page order. The title must be a plain string
 * attribute. verify-content.mjs counts the same tags with /<Segment\b/.
 */
export function segmentTitles(mdxBody: string) {
  return [...mdxBody.matchAll(/<Segment\b[^>]*?\btitle="([^"]*)"/g)].map((match) => match[1]);
}
