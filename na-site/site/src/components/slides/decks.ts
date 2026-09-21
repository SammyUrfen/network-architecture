import { href } from '../../lib/url';

/**
 * The decks in public/slides/, by session number: the page count and the file
 * size in megabytes, for the slides page. All five decks have a 960 x 540 pt
 * page, which is 16:9. A new deck needs a copy in public/slides/ and a row
 * here. decks.test.ts reads the PDFs and checks the rows.
 *
 * `numbered` maps a PDF page to the number printed in the bottom-right corner
 * of the slide. The pages `from` to `to` print a number, and that number is
 * the page plus `offset`. So Session 1 page 21 prints 20. The other pages,
 * such as a title page, print no number. The Session 5 deck prints none.
 */
export const decks: Readonly<
  Record<number, { pages: number; mb: number; numbered?: { from: number; to: number; offset: number } }>
> = {
  1: { pages: 48, mb: 2.5, numbered: { from: 3, to: 47, offset: -1 } },
  2: { pages: 41, mb: 2.9, numbered: { from: 2, to: 41, offset: 0 } },
  3: { pages: 34, mb: 2.2, numbered: { from: 3, to: 34, offset: -2 } },
  4: { pages: 36, mb: 2.3, numbered: { from: 2, to: 35, offset: 0 } },
  5: { pages: 51, mb: 4.0 },
};

/** The number printed on a PDF page of a deck, or undefined when the page prints none. */
export function printedNumber(session: number, page: number): number | undefined {
  const numbered = decks[session]?.numbered;
  return numbered && page >= numbered.from && page <= numbered.to ? page + numbered.offset : undefined;
}

/** The text of a slide citation: "slide 20" with the printed number, or "page 1" for a page with no number. */
export function slideLabel(session: number, page: number): string {
  const slide = printedNumber(session, page);
  return slide === undefined ? `page ${page}` : `slide ${slide}`;
}

/** The place in the viewer: "slide 20 (page 21 of 48)", or "page 1 of 48" for a page with no number. */
export function pageLabel(session: number, page: number): string {
  const slide = printedNumber(session, page);
  const of = `page ${page} of ${decks[session].pages}`;
  return slide === undefined ? of : `slide ${slide} (${of})`;
}

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
