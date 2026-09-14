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

/**
 * Splits the rendered HTML of a segment after its first paragraph, the place
 * of the visual on a narrow screen. Astro puts hydration scripts before the
 * first island of a slot, so the split skips them. A segment that does not
 * start with a paragraph gives an empty lead, and the visual goes first.
 */
export function splitLead(html: string): [string, string] {
  const lead = html.match(/^(?:\s*<script\b[^>]*>[\s\S]*?<\/script>)*\s*<p>[\s\S]*?<\/p>/)?.[0] ?? '';
  return [lead, html.slice(lead.length)];
}
