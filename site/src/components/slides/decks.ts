import { href } from '../../lib/url';

/**
 * The decks in public/slides/, by session number: the page count and the file
 * size in megabytes, for the slides page. All five decks have a 960 x 540 pt
 * page, which is 16:9. A new deck needs a copy in public/slides/ and a row
 * here. decks.test.ts reads the PDFs and checks the rows.
 */
export const decks: Readonly<Record<number, { pages: number; mb: number }>> = {
  1: { pages: 48, mb: 2.5 },
  2: { pages: 41, mb: 2.9 },
  3: { pages: 34, mb: 2.2 },
  4: { pages: 36, mb: 2.3 },
  5: { pages: 51, mb: 4.0 },
};

/** `slides/session-01.pdf`, a site path for href() */
export const deckFile = (session: number) => `slides/session-${String(session).padStart(2, '0')}.pdf`;

/** The link to one page of a deck. An unknown session or page throws, so a bad citation fails the build. */
export function slideHref(session: number, page: number): string {
  const deck = decks[session];
  if (!deck) throw new Error(`SlideLink: no deck for session ${session}`);
  if (!Number.isInteger(page) || page < 1 || page > deck.pages) {
    throw new Error(`SlideLink: the session ${session} deck has pages 1 to ${deck.pages}, not ${page}`);
  }
  return `${href(deckFile(session))}#page=${page}`;
}

/** A typed page number, rounded and kept inside 1 to pages. A value that is not a number keeps the current page. */
export const clampPage = (value: number, current: number, pages: number) =>
  Number.isFinite(value) ? Math.min(Math.max(1, Math.round(value)), pages) : current;
