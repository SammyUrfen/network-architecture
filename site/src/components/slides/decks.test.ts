import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { describe, expect, it } from 'vitest';
import { clampPage, deckFile, decks, slideHref } from './decks';

describe('decks', () => {
  it('matches the page count, the size and the 16:9 page of each PDF in public/slides', async () => {
    for (const [session, deck] of Object.entries(decks)) {
      // In Node, pdf.js reads a file: URL from the disk.
      const task = getDocument({ url: new URL(`../../../public/${deckFile(Number(session))}`, import.meta.url).href });
      const doc = await task.promise;
      const { width, height } = (await doc.getPage(1)).getViewport({ scale: 1 });
      const { length } = await doc.getDownloadInfo();
      expect({ session, pages: doc.numPages, mb: Number((length / 1e6).toFixed(1)), width, height }).toEqual({
        session,
        ...deck,
        width: 960,
        height: 540,
      });
      await task.destroy();
    }
  }, 30_000);
});

describe('slideHref', () => {
  it('links to one page of the deck under the base URL', () => {
    expect(slideHref(1, 39)).toMatch(/\/slides\/session-01\.pdf#page=39$/);
  });

  it('throws for an unknown deck or a page outside the deck', () => {
    expect(() => slideHref(6, 1)).toThrow('no deck for session 6');
    expect(() => slideHref(1, 49)).toThrow('pages 1 to 48, not 49');
    expect(() => slideHref(1, 0)).toThrow();
    expect(() => slideHref(1, 2.5)).toThrow();
  });
});

describe('clampPage', () => {
  it('rounds and keeps a typed page inside the deck', () => {
    expect(clampPage(7.4, 3, 48)).toBe(7);
    expect(clampPage(0, 3, 48)).toBe(1);
    expect(clampPage(99, 3, 48)).toBe(48);
    expect(clampPage(Number.NaN, 3, 48)).toBe(3);
  });
});
