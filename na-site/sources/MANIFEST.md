# Source manifest

Everything in `sources/` except this file is git-ignored. This file records
what should be here, where it came from, and whether it is complete.

| Path | What it is | Status |
|---|---|---|
| `session-01/slides.pdf` | Session 1 deck "Computer Networks: network programming, from the socket up", 48 pages | complete |
| `session-01/notes.md` | AI revision notes from the class platform | complete, low detail |
| `session-02/slides.pdf` | Session 2 deck "OSI, SS7, Hands-on Protocols", 41 pages | complete, replaced 2026-09-13 |
| `session-02/notes.md` | AI revision notes from the class platform | complete, low detail |
| `session-03/slides.pdf` | Session 3 deck "One Process, Many Clients: Scaling Servers", 34 pages | complete, replaced 2026-09-13 |
| `session-04/slides.pdf` | Session 4 deck "nginx and the code that explains it", 36 pages | complete, replaced 2026-09-13 |
| `session-05/slides.pdf` | Session 5 deck "HTTP, 1996 to now", 51 pages | complete, replaced 2026-09-13 |
| `session-06/slides.pdf` | Session 6 deck, 38 pages, saved 2026-09-22 | complete, text extracted to `session-06/slides.txt` |
| `session-07/slides.pdf` | Session 7 deck "Building for Failures", 37 pages, saved 2026-10-09 | complete, text extracted to `session-07/slides.txt` |
| `session-08/slides.pdf` | Session 8 deck "Streaming video at large scale", 48 pages, saved 2026-10-09 | complete. The pages are images, so `pdftotext` gives nothing. |
| `session-08/pages/p-NN.txt` | One transcription for each page of the Session 8 deck | complete. Four agents read the page images on 2026-10-09 and wrote every word, number, table and code block. |
| `session-08/slides.txt` | The 48 page files joined with form feeds, so `awk 'BEGIN{RS="\f"} NR==12'` works as for the other decks | complete |
| `assignment/calculator.pdf` | The graded assignment "Build a calculator that stays on the line", 2 pages. Page 2 holds the course project "HTTP, in binary". | complete. `pdftotext` gives no text, because the pages hold outlines. Read it as an image. One line of the marking box is behind another box and stays unreadable. |
| `session-0N/slides.txt` | `pdftotext -layout` output. A form feed separates pages. | complete |
| `cn-at-scaler/` | clone of the instructor repo `github.com/jitendraag/cn-at-scaler` | at commit `073f869`, pulled 2026-09-22, adds `lesson6/` |

## Published decks

The site also holds a copy of each deck, for the slide viewer and the
downloads (`CLAUDE.md` rule 5). Git tracks these copies. When a deck in
`sources/` changes, copy it again. Then update the page count and size in
`site/src/components/slides/decks.ts`, and the row below.

| Source | Published copy | Public URL after the deploy | Copied |
|---|---|---|---|
| `session-01/slides.pdf` | `site/public/slides/session-01.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-01.pdf | 2026-09-14, same bytes |
| `session-02/slides.pdf` | `site/public/slides/session-02.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-02.pdf | 2026-09-14, same bytes |
| `session-03/slides.pdf` | `site/public/slides/session-03.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-03.pdf | 2026-09-14, same bytes |
| `session-04/slides.pdf` | `site/public/slides/session-04.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-04.pdf | 2026-09-14, same bytes |
| `session-05/slides.pdf` | `site/public/slides/session-05.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-05.pdf | 2026-09-14, same bytes |
| `session-06/slides.pdf` | `site/public/slides/session-06.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-06.pdf | 2026-10-09, same bytes |
| `session-07/slides.pdf` | `site/public/slides/session-07.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-07.pdf | 2026-10-09, same bytes |
| `session-08/slides.pdf` | `site/public/slides/session-08.pdf` | https://sammyurfen.github.io/network-architecture/slides/session-08.pdf | 2026-10-09, downsampled to 120 dpi with ghostscript: 40 MB to 4 MB, and every slide stays readable |

## Class transcripts

None. The class platform gave AI revision notes for Sessions 1 and 2 only.
The notes cite `transcript.txt` and `handwritten.pdf`, but those files are
not available. Sessions 3 to 5 have no notes.

## How the decks were saved

Open the deck in the browser, use Print, and select "Save as PDF". A direct
download of Sessions 2 to 5 stopped early and gave truncated files. The
truncated files are gone. `tools/pdf_salvage.py` stays for the next time a
download stops early. Its output also separates pages with form feeds, but
its page order follows the streams in the file, not the PDF page order. Mark
a salvaged deck "salvaged, page order not checked" in the table.

## To update the instructor code

```sh
git -C sources/cn-at-scaler pull
git -C sources/cn-at-scaler log --oneline -5
```

Record the new commit in the table above.
