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
| `session-0N/slides.txt` | `pdftotext -layout` output. A form feed separates pages. | complete |
| `cn-at-scaler/` | clone of the instructor repo `github.com/jitendraag/cn-at-scaler` | at commit `4398388`, 2026-09-11 |

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
