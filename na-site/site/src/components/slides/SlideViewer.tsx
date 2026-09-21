import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist/legacy/build/pdf.mjs';
// The legacy build, because the default build of pdf.js needs the latest
// browsers, and phones often run an older one.
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { render } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { clampPage, pageLabel, printedNumber } from './decks';
import './slides.css';

GlobalWorkerOptions.workerSrc = workerSrc;

// A deck downloads and parses one time for each page view, however often the
// viewer opens. A failed load leaves the map, so the next open tries again.
const docs = new Map<string, Promise<PDFDocumentProxy>>();
function load(url: string) {
  if (!docs.has(url)) {
    docs.set(
      url,
      getDocument({ url }).promise.catch((error: unknown) => {
        docs.delete(url);
        throw error;
      }),
    );
  }
  return docs.get(url)!;
}

export interface Props {
  /** The PDF URL, with no #page part */
  url: string;
  session: number;
  /** The page that opens first, from 1 */
  page: number;
  pages: number;
  /** Called after the dialog closes */
  onClose: () => void;
}

// The in-page slide viewer: one page of a deck at a time, in a modal dialog.
// The native dialog gives Escape and keeps Tab inside it. Arrow keys also
// change the page.
export default function SlideViewer({ url, session, page: first, pages, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(first);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [drawn, setDrawn] = useState(0);
  const [problem, setProblem] = useState<string | null>(null);
  const go = (value: number) => setPage(clampPage(value, page, pages));

  useEffect(() => dialog.current!.showModal(), []);

  useEffect(() => {
    load(url).then(setDoc, () =>
      setProblem('The slides did not load. Check the connection, or open the full deck.'),
    );
  }, [url]);

  useEffect(() => {
    if (!doc) return;
    let task: RenderTask | undefined;
    let stale = false;
    setProblem(null);
    doc
      .getPage(page)
      .then((pdfPage) => {
        if (stale) return;
        const el = canvas.current!;
        // Draw at the device pixel width of the frame, so the slide text stays sharp.
        // ponytail: no redraw on resize. CSS scales the bitmap, a little soft after a big resize.
        const scale = (el.clientWidth * devicePixelRatio) / pdfPage.getViewport({ scale: 1 }).width;
        const viewport = pdfPage.getViewport({ scale });
        el.width = Math.floor(viewport.width);
        el.height = Math.floor(viewport.height);
        task = pdfPage.render({ canvas: el, viewport });
        return task.promise.then(() => setDrawn(page));
      })
      .catch((error: { name?: string }) => {
        if (error?.name !== 'RenderingCancelledException') setProblem('This slide did not show. Open the full deck.');
      });
    return () => {
      stale = true;
      task?.cancel();
    };
  }, [doc, page]);

  const commit = (input: HTMLInputElement) => {
    const next = clampPage(input.valueAsNumber, page, pages);
    input.value = String(next);
    setPage(next);
  };

  const loading = drawn !== page && !problem;
  // "Slide 20 (page 21 of 48)": the number printed on the slide, and the PDF page.
  const place = (p: number) => pageLabel(session, p).replace(/^./, (c) => c.toUpperCase());
  const slide = printedNumber(session, page);
  const status = problem ?? (loading ? `Loading ${pageLabel(session, page)}` : place(page));

  return (
    <dialog
      ref={dialog}
      class="sv"
      aria-labelledby="sv-title"
      onClose={onClose}
      // A click on the backdrop lands on the dialog itself, not on its content.
      onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
      onKeyDown={(event) => {
        if ((event.target as Element).tagName === 'INPUT') return;
        if (event.key === 'ArrowRight') go(page + 1);
        if (event.key === 'ArrowLeft') go(page - 1);
      }}
    >
      <div class="sv-body">
        <div class="sv-head">
          <h2 id="sv-title">Session {session} slides</h2>
          <button type="button" class="btn sv-close" onClick={() => dialog.current!.close()}>
            <span aria-hidden="true">✕</span>
            <span class="sr-only">Close the slides</span>
          </button>
        </div>

        <div class="sv-frame" aria-busy={loading}>
          <canvas ref={canvas} width={960} height={540} role="img" aria-label={place(drawn || page)} />
          {(loading || problem) && (
            <p class={problem ? 'sv-note sv-problem' : 'sv-note'} aria-hidden="true">
              {status}
            </p>
          )}
        </div>
        <p class="sr-only" aria-live="polite">
          {status}
        </p>

        <div class="sv-bar">
          {/* aria-disabled, not disabled: a disabled button drops the focus of a keyboard user. go() already stops at the ends. */}
          <button type="button" class="btn" onClick={() => go(page - 1)} aria-disabled={page === 1}>
            <span aria-hidden="true">←</span> Previous
          </button>
          <form
            class="sv-page"
            onSubmit={(event) => {
              event.preventDefault();
              commit(event.currentTarget.elements.namedItem('page') as HTMLInputElement);
            }}
          >
            {/* The field takes the PDF page, so a printed number that differs sits outside it. */}
            <label>
              {slide === undefined ? 'Page' : `Slide ${slide} (page`}{' '}
              <input
                name="page"
                aria-label={`Page number, 1 to ${pages}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={pages}
                value={page}
                onChange={(event) => commit(event.currentTarget)}
              />{' '}
              of {pages}
              {slide !== undefined && ')'}
            </label>
          </form>
          <button type="button" class="btn" onClick={() => go(page + 1)} aria-disabled={page === pages}>
            Next <span aria-hidden="true">→</span>
          </button>
        </div>

        <p class="sv-links">
          <a href={`${url}#page=${page}`} target="_blank" rel="noopener">
            Open the full deck<span class="sr-only"> in a new tab</span>
          </a>
          <a href={url} download>
            Download the PDF
          </a>
        </p>
      </div>
    </dialog>
  );
}

let host: HTMLElement | undefined;

/** Opens the viewer for a slide link. SlideLink.astro calls it on the first click. */
export function openSlides(link: HTMLAnchorElement) {
  if (host?.firstChild) return;
  host ??= document.body.appendChild(document.createElement('div'));
  const { slideSession, slidePage, slidePages } = link.dataset;
  const close = () => {
    render(null, host!);
    link.focus();
  };
  render(
    <SlideViewer
      url={link.href.split('#')[0]}
      session={Number(slideSession)}
      page={Number(slidePage)}
      pages={Number(slidePages)}
      onClose={close}
    />,
    host,
  );
}
