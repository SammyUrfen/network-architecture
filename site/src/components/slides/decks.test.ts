import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { describe, expect, it } from 'vitest';
import { clampPage, deckFile, decks, pageLabel, printedNumber, slideHref, slideLabel } from './decks';

describe('decks', () => {
  it('matches the page count, the size, the 16:9 page and the printed numbers of each PDF in public/slides', async () => {
    for (const [session, { numbered, ...deck }] of Object.entries(decks)) {
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

      // The printed number is the text in the bottom-right corner: "20" in
      // Session 1, "02/36" in Session 4. The PDF y axis starts at the bottom.
      const printed: (number | undefined)[] = [];
      const expected: (number | undefined)[] = [];
      for (let page = 1; page <= doc.numPages; page++) {
        const { items } = await (await doc.getPage(page)).getTextContent();
        const corner = items.find(
          (item) => 'str' in item && item.transform[4] > 850 && item.transform[5] < 50 && /^\d+(\/\d+)?$/.test(item.str),
        );
        printed.push(corner && 'str' in corner ? Number(corner.str.split('/')[0]) : undefined);
        expected.push(printedNumber(Number(session), page));
      }
      expect(expected, `the printed numbers of the session ${session} deck`).toEqual(printed);
      await task.destroy();
    }
  }, 60_000);
});

describe('printedNumber and the labels', () => {
  it('gives the printed number of a page, or the page when it prints none', () => {
    expect(printedNumber(1, 21)).toBe(20);
    expect(printedNumber(3, 10)).toBe(8);
    expect(printedNumber(1, 48)).toBeUndefined();
    expect(printedNumber(5, 28)).toBeUndefined();
    expect(slideLabel(1, 21)).toBe('slide 20');
    expect(slideLabel(5, 28)).toBe('page 28');
    expect(pageLabel(1, 21)).toBe('slide 20 (page 21 of 48)');
    expect(pageLabel(1, 1)).toBe('page 1 of 48');
  });
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
