# Build plan

A living document. Update the status table when a phase changes state.

## Status

| Phase | What | Status | Estimate |
|---|---|---|---|
| 0 | Foundation: repo, sources, pedagogy, curriculum maps for sessions 1–5 | done 2026-09-14 | — |
| 1 | Site skeleton, theme, content schema, gate scripts | not started | 1 session, 3–4 h |
| 2 | Components for the two pilot pages, progress store, review page | not started | 2 sessions, 6–8 h |
| 3 | Pilot: `s01-m08-framing` and `s05-m12-assignment-prep`, then Bibek uses them | not started | 1 session + 1–2 days of use |
| 4 | Remaining components, practice page, HTTP path: `s05-m01`, `s05-m02`, `s01-m04` | not started | 3–4 sessions |
| 5 | Sessions 1 and 2, remaining modules (20) | not started | 40–80 h of packets, 3–6 sessions |
| 6 | Sessions 3 and 4 (22) | not started | 44–88 h of packets, 3–6 sessions |
| 7 | Session 5, remaining modules and project studio (10) | not started | 20–40 h of packets, 2–3 sessions |
| 8 | Threads, practice exam, glossary, end-term pack | not started | 1–2 sessions |
| R | Each new session (6, 7, 8): run `docs/ADD-A-SESSION.md` | recurring | within 48 h of the class |
| D | Public GitHub repo and GitHub Pages deploy | deferred: Bibek wants a public repo later. Checklist in section 4. | 1–2 h |

A "session" in the Estimate column is one Claude Code working session of 3
to 4 hours. Phases 5 to 7 assume 2 to 4 hours for each packet and 4 packets
in parallel. One packet at a time needs about four times as many sessions.

---

## 1. What we build

A static website that re-teaches the course "Network Architecture" (CN @
Scaler), one lesson page per idea. First contact is simple enough for a
10-year-old. The same page goes deep enough for exam and design questions.
Every page asks questions, shows pictures that step, and feeds a review queue
that brings ideas back over days.

**Non-goals**

- No backend, no accounts, no analytics. Progress lives in the browser.
- No solutions to graded work.
- No copy of the instructor's slides. Original explanations with short
  quotes and source pointers.
- No lesson for a session before its sources exist.
- No public deploy until Bibek asks.
- No offline mode.

---

## 2. Decisions

Each decision names what it rejects and why.

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Framework | Astro, static output, MDX for lesson pages | Plain HTML, Next.js static export, Starlight, mdBook | Plain HTML repeats the layout 57 times and cannot validate quiz data. Next.js ships a React runtime to every page. Starlight gives a docs layout, not a lesson flow. mdBook has weak interactivity. Astro ships zero JS by default and hydrates only the widgets. |
| Interactive widgets | Preact islands, TypeScript strict | React, Svelte, vanilla custom elements | Preact has the React API that Bibek knows, at about 4 KB. One pattern for every widget. |
| Widget logic | Pure TypeScript functions in `src/lib/`, unit-tested with RFC test vectors | Logic inside components | A simulator that teaches a wrong rule is worse than no simulator. Pure functions can be tested against RFC 4648, RFC 7541 and the nginx behavior. |
| Content data | Astro content collections: modules (MDX), quiz items (YAML), review cards (YAML), sessions, threads, assessments. Zod schemas. | Questions written inline in MDX | Review and practice pages need every item from every module. A schema catches a bad item at build time. |
| Diagrams | Hand-written inline SVG as Astro components, colored by CSS custom properties | Mermaid, Excalidraw images | Mermaid runs JS at view time and gives little control over steps. Images cannot switch theme or step. |
| State | `localStorage`, one versioned key, export and import as JSON | IndexedDB, a backend | The data is small. Export covers the loss case. |
| Review schedule | Five fixed boxes: 1, 3, 7, 14, 30 days, capped by exam dates when a date is known | SM-2, FSRS | Research shows no gain from growing gaps over fixed gaps (docs/PEDAGOGY.md). Fixed boxes are a few lines. |
| Shared widget state | One store module (nanostores, as the Astro docs advise) that writes through to `localStorage`. Progress widgets read storage only on the client. | `storage` events, React context | The `storage` event fires only in other tabs. Context does not cross islands. Astro prerenders islands at build time, where `localStorage` does not exist. |
| Search | None at first. Pagefind in Phase 8 if needed | Algolia | Pagefind is static. Search is not a need at 57 pages with a clear map. |
| Theme | "Patch Panel", hand-rolled tokens, light and dark | A UI kit | Bibek designs a named theme per project. |
| Sources in git | Ignored. Only `sources/MANIFEST.md` is tracked. | Commit the PDFs and the instructor clone | The repo can go public later. The material belongs to the instructor. |
| Unit tests | Vitest | `node --test` | Astro is Vite-based, so Vitest shares its TypeScript setup with no extra config. |

Confirm the current Astro, MDX, Preact and Vitest APIs with the context7 tools
at the start of Phase 1. See section 9 for the facts checked on 2026-09-13.

---

## 3. Site architecture

### Folders

```
site/
  astro.config.mjs
  package.json                 scripts: dev, build, preview, check, test, verify, lint:prose
  scripts/
    verify-content.mjs         the content gate (section 5)
    lint-prose.mjs             strips MDX and code, pipes the prose to ste-lint
  src/
    content.config.ts          all collections, loaders and zod schemas
    content/
      sessions/s01.yaml        one file per session, stubs for Sessions 6 to 8
      modules/s01/s01-m08-framing.mdx
      quiz/s01-m08-framing.yaml    one file per module, items in a list
      cards/s01-m08-framing.yaml   one file per module, items in a list
      assessments.yaml         quizzes, assignment, project, exam, with dates
    components/
      lesson/                  ModuleHeader, Segment, Picture, ExamDepth, Story, Myth, Beyond, WordCard, InventFirst, Lab, CardsAdded, ThreadLink, ModuleLink
      check/                   Pretest, Check, ExitQuiz, Predict, ExplainBack, FadedExample, Generator, ExamPrompts
      diagram/                 Stepper, SequenceDiagram, LayerStack, ByteView, Terminal, Timeline
      sims/<module-id>/        one folder per simulator
    lib/
      progress.ts              localStorage store, schema version, export, import
      schedule.ts              review boxes and due dates
      grade.ts                 grading for each question type
      sims/<module-id>.ts      pure simulator logic
      generators/<name>.ts     problem generators
    pages/                     routes (below)
    styles/tokens.css          theme tokens
  tests/                       Vitest files, next to the logic they test is also fine
```

### Components, data and theme

- **Astro or island.** `lesson/` blocks are `.astro` components with no
  client JavaScript. Every `check/` component, `Stepper` and every simulator
  is a Preact island with an `.astro` wrapper. Phase 2 writes
  `docs/COMPONENTS.md`: each component, its kind, and its props. That file is
  the component catalog.
- **How a page gets a quiz item.** The MDX writes `<Check id="s01-m08-q03" />`.
  The `.astro` wrapper finds the item in the `quiz` collection at build time
  and passes it to the island as a plain object. Island props must be
  serializable.
- **Boxes.** Rung 1 and the word card render in `<details open>`. Rung 4
  renders in a closed `<details>`. No view state.
- **Theme before paint.** An inline script in the `<head>` of the base layout
  reads the `na-theme` key (`light`, `dark` or `system`) from `localStorage`
  and sets `data-theme` on `<html>` before the first paint. The theme toggle
  writes the key and the attribute. The theme is not progress, so export
  leaves it out.
- **Links.** `ModuleLink id="s01-m07-see-the-bytes-tls"` joins
  `import.meta.env.BASE_URL`, the route and a trailing slash. For a planned
  module with no page yet, it shows the module ID as plain text with
  "(planned)". Lesson MDX never uses a root-relative Markdown link.

### Loaders

| Collection | Loader | Notes |
|---|---|---|
| `modules` | `glob({ pattern: '**/*.mdx', base: './src/content/modules', generateId: ({ data }) => String(data.id) })` | Without `generateId`, the ID is `s01/s01-m08-framing`. |
| `quiz`, `cards` | `glob({ pattern: '*.yaml', base: ... })` | One entry per module, and its ID is the module ID. The file holds `items:`, a list. Pages flatten the lists. Verify rule 6 keeps item IDs unique. |
| `sessions` | `glob({ pattern: '*.yaml', base: './src/content/sessions' })` | |
| `assessments` | `file('src/content/assessments.yaml')` | A list, each entry with an `id`. |
| `threads` | `file('../docs/curriculum/README.md', { parser })` | The parser reads the rows of the thread table. No copy of the table. |

Links between entries are plain ID strings, not `reference()`. Verify rule 3
checks them. `getEntry()` returns `undefined` for a module with no page yet,
and `ModuleLink` handles that case.

### Routes

| Route | Page |
|---|---|
| `/` | Mastery map of all 8 sessions, cards due today, next assessment, "continue" link |
| `/s01/` | Session overview: one paragraph, module list with minutes, source status badge |
| `/s01/m08-framing/` | A module page |
| `/review/` | Due cards, one at a time, with confidence |
| `/practice/` | Phase 4. Mixed questions from the sessions the learner picks. Exam mode (Phase 8) holds feedback to the end. |
| `/threads/` and `/threads/T-framing/` | Each thread with links to every module that uses it |
| `/assessments/` | Dates, weights, and links to the prep modules |
| `/progress/` | Export, import, reset |
| `/dev/gallery/` | Phase 4. Fixture data only for a component that no real page uses yet. Not in the nav. |
| `/glossary/` | Phase 8. Built from module word cards. |

### Content schemas

The samples use the real IDs of `s01-m08-framing` from
`docs/curriculum/session-01.md`.

**Session** (`sessions/s01.yaml`)

```yaml
number: 1                 # the curriculum file is docs/curriculum/session-01.md
title: Network programming 101
subtitle: From the socket up
date: 2026-08-12          # z.coerce.date(). Approximate is fine, mark with dateApprox: true
dateApprox: true
sourceStatus: complete    # complete | partial | missing. Stubs for Sessions 6 to 8 start as missing.
```

**Module** (MDX frontmatter)

```yaml
id: s01-m08-framing       # equals the file name
session: 1
order: 8
title: Where does a message end?
minutes: 22
bigIdea: TCP delivers bytes with no message edges, so every protocol must say where a message ends.
covers: [S01-C92, S01-C93]
prereqs: [s01-m01-seven-syscalls]   # a planned module with no page yet is allowed
threads: [T-framing]
confidence: high          # high | medium | low, from the Confidence line in the session header
status: draft             # draft | ready
terms:
  - { term: byte stream, meaning: bytes in order with no marks between writes }
```

**Quiz item** (`quiz/<module-id>.yaml` holds `items:`, a list of these)

```yaml
- id: s01-m08-q01         # unique across the site
  use: [check, practice]  # pretest | check | exit | practice
  segment: 1              # for use: check only. Counts from 1.
  type: mcq               # mcq | multi | numeric | order | bytes | predict | spot-bug | recall
  prompt: The sender calls write() two times, "hello" then "world". What can one read() return?
  options:
    - { text: "Always exactly \"hello\".", correct: false, misconception: S01-M04, feedback: TCP keeps no mark between writes. }
    - { text: "Any split, such as \"helloworld\".", correct: true, feedback: Right. A read returns the bytes that arrived. }
    - { text: "The two words in two reads, one for each packet.", correct: false, misconception: S01-M32, feedback: TCP can split or merge writes. }
  explanation: A read returns the bytes available, from 1 up to the buffer size. The application finds the message end.
  covers: [S01-C92]
  tags: []                # story | measured | beyond
```

**Fields for each question type.** `numeric`, `order`, `bytes` and `recall`
also take an optional `distractors: [{ value, misconception, feedback }]`. A
wrong answer that equals a distractor value shows its feedback. Any other
wrong answer shows the `explanation`.

| Type | Fields | Right when |
|---|---|---|
| `mcq`, `predict` | `options: [{ text, correct, misconception?, feedback }]`, 3 or 4 options, one correct | the learner picks the correct option |
| `multi` | `options` as for `mcq`, one or more correct | the picked set equals the correct set |
| `numeric` | `answer: { value: number, tolerance: number, unit: string or null }`. Tolerance is absolute, default 0. | the answer is within the tolerance |
| `order` | `items: string[]`, written in the correct order. The page shuffles them. | the order matches |
| `bytes` | `answer: "98 76 5F"` to type bytes, or `hex` and `field: [start, end]` to select bytes in a dump. Offsets count from 0 and include the end. | the hex matches with case and spaces ignored, or the selection matches |
| `spot-bug` | `code` and `bugLines: number[]` (lines count from 1), or no `code` and `options` as for `mcq` | the picked lines equal `bugLines`, or the correct option |
| `recall` | `model: string` | the learner compares with the model answer and marks it right or wrong |

A curriculum question with no options, such as most pretest questions, is a
`recall` item. A curriculum check that offers byte strings to pick from is an
`mcq` item.

**Card** (`cards/<module-id>.yaml` holds `items:`, a list of these)

```yaml
- id: s01-m08-c04
  front: What is the cost of a delimiter?
  back: The sender must escape it when it appears in the data.
  covers: [S01-C95]
```

**Thread** (a row of the thread table in `docs/curriculum/README.md`)

```ts
{ id: "T-framing", idea: string, firstSeen: number }   // Phase 8 adds designQuestion?: string
```

**Assessment** (an entry in `assessments.yaml`)

```yaml
- id: assignment
  kind: assignment        # quiz | assignment | project | exam
  title: A calculator that stays on the line
  weight: 20              # percent of the grade
  date: 2026-09-25        # z.coerce.date().nullable(). null until a date is known
  dateApprox: true        # the deck says "due before Session 7"
  coversSessions: [1, 5]
  prepModules: [s05-m12-assignment-prep]
```

**Progress** (`localStorage` key `na-progress`)

```ts
{
  version: 1,
  modules: { [id]: { startedAt: string, completedAt?: string, pretest?: { right, total } } },
  answers: { [itemId]: Array<{ at: string, correct, confidence: "sure" | "think" | "guess" }> },
  cards:   { [cardId]: { box: 1..5, due: "YYYY-MM-DD", lapses } }
}
```

Timestamps are ISO 8601 strings. `due` is a calendar date in the local time
zone of the browser.

A version mismatch runs a migration or asks before a reset. It never wipes
data without asking.

### Theme "Patch Panel"

Colors come from the four pairs of a network cable (orange, green, blue,
brown) on a paper background in light mode and a rack-dark background in dark
mode.

- **Semantic colors:** key idea, correct, wrong, interactive, story. A color
  never carries meaning alone. Each one has an icon or a word.
- **Layer colors:** one color per layer (physical, link, network, transport,
  application), the same in every diagram and every `ByteView`. Load the
  `dataviz` skill and run its palette validator on both themes.
- **Type:** system UI font for prose, a monospace font for bytes and code.
- **Accessibility:** WCAG AA contrast, keyboard access to every widget,
  visible focus, `aria-live` on feedback, `prefers-reduced-motion`.

---

## 4. Phases

Every phase ends at the gate in section 5.

### Phase 1: skeleton

**Goal:** an empty site that builds, validates content, and shows one stub
module in both themes.

1. Create `site/` with Astro, TypeScript strict, MDX, Preact and Vitest. Set
   `base: '/network-architecture/'` now, so the preview gate catches a link
   that skips the base.
2. Write `content.config.ts` with every loader and schema in section 3.
3. Write `tokens.css` and the base layout with the theme toggle and the
   theme script.
4. Build the routes `/`, `/s01/`, and the module page, with placeholders for
   the other routes.
5. Write `scripts/verify-content.mjs` and `scripts/lint-prose.mjs`. Set
   `"test": "vitest run"`. Add one test: the claim and misconception parsers
   read a small fixture that holds each line pattern of section 5.
6. Add session files for Sessions 1 to 5, and stubs for Sessions 6 to 8 with
   `sourceStatus: missing`. Add a stub module, quiz file and card file for
   `s01-m08-framing` that pass every schema.
7. Ask Bibek to make the first commit. Worktrees for parallel packets need
   one.

### Phase 2: components for the pilot

**Goal:** the components and pages that the two pilot pages need, and no
more. The stub page of `s01-m08-framing` shows each new component for the
visual QA of this phase.

1. Write `progress.ts`, `schedule.ts` and `grade.ts` with unit tests first.
2. Write `docs/COMPONENTS.md`, the component catalog (section 3).
3. Build the lesson blocks, check types and diagrams that the curriculum
   sections of `s01-m08-framing` and `s05-m12-assignment-prep` use.
4. Build `/review/` with the fixed boxes, and `/progress/` with export,
   import and reset.

After Phase 2, the component props and the content schemas are **the
contract**. Module packets use the contract and do not change it. A change to
the contract is its own packet, and it runs `npm run verify` on every module.

### Phase 3: pilot

**Goal:** prove the lesson format on Bibek before the site has 57 pages of it,
and give him the assignment page before the due date.

1. Build `s01-m08-framing` with the framing sandbox simulator. Build it to
   the lesson contract, not to every component type.
2. Build `s05-m12-assignment-prep` with the request boundary finder. It is
   the first prep page for graded work.
3. Bibek uses both pages for one or two days. He starts his own server with
   `npm run preview -- --port 4400`. Progress in `localStorage` belongs to
   one address, host and port, so he exports before a change of address.
4. Record his feedback in `docs/feedback.md`, with a date.
5. Change `docs/PEDAGOGY.md` and the components to match. Rebuild the two
   pages.

**Deadline:** the deck says the assignment is due before Session 7 (Friday
2026-09-25). Finish the build steps of Phases 1 to 3 by 2026-09-19. Until
then, Bibek reads the `s05-m12-assignment-prep` section of
`docs/curriculum/session-05.md`. Its checklist, test plan and hint ladder
are readable now.

**Hard gate:** no other module starts before Bibek accepts the format.

### Phase 4: the rest of the engine, and the HTTP path

1. Build the remaining check types, lesson blocks, diagram components and
   generators, `/practice/`, and `/dev/gallery/` fixtures for components that
   no page uses yet. Add each one to `docs/COMPONENTS.md`.
2. Build `s05-m01-http10`, `s05-m02-keepalive-host` and `s01-m04-clients`.
   `s05-m12` lists all three as prereqs.
3. When the instructor formally sets the assignment, check `s05-m12` against
   the real task text (`session-05.md` Open questions 25 and 27).

### Phases 5 to 7: the sessions

One **module packet** per module. All five decks are complete. The order
follows the course, because each session builds on the one before it. The
modules of a new session go to the front of the queue (section 6).

| Phase | Modules | Count |
|---|---|---|
| 5 | Session 1: m01 to m03, m05 to m07, m09 to m11. Session 2: m01 to m11. | 20 |
| 6 | Session 3: m01 to m09. Session 4: m01 to m13. | 22 |
| 7 | Session 5: m03 to m11, m13 (project studio). | 10 |

With the 2 pilot pages and the 3 pages of Phase 4, that is 57 modules.

Before Phase 6, add a second distractor to 36 choice checks in
`session-04.md` (its Open questions 31).

The project is 30% of the grade. If the instructor announces an early
project deadline, move `s05-m13-project-studio` and the prereqs that
`session-05.md` lists for it ahead of Phase 5.

### Phase 8: cross-session pages

- `/threads/` pages with a design question for each thread.
- Practice exam mode with a timer option.
- `/glossary/`, built from word cards.
- An end-term pack: the review queue filtered to every session, plus
  `S0N-Q` instructor questions as open prompts with model answers.
- Pagefind search, only if Bibek asks for search.

### Phase D: public repo (deferred)

Before any public push:

1. Keep `docs/curriculum/` and the pages for graded work (`s05-m12`,
   `s05-m13`) out of the public tree until the grades are final. Bibek
   picks how: a private branch or `.gitignore`.
2. Ask the instructor before a public release.
3. Scan every tracked file for long quotes from `sources/`.

### The module packet

The unit of parallel work in Phases 3 to 8.

- **Input:** the module section of `docs/curriculum/session-0N.md`, the
  lesson contract in `docs/PEDAGOGY.md`, the component catalog in
  `docs/COMPONENTS.md`.
- **Output, and nothing else:**
  - `src/content/modules/sNN/<id>.mdx`
  - `src/content/quiz/<id>.yaml`
  - `src/content/cards/<id>.yaml`
  - `src/lib/sims/<id>.ts` and its test, if the module has a simulator
  - `src/components/sims/<id>/`, if the module has a simulator
- **No shared files.** The nav, the session page and the review queue come
  from the collections. If a packet needs a new shared component, it stops
  and records the need in `docs/PLAN.md` under "Contract change requests".
- **Read by hand.** Scripts read only the claim tables, the misconception
  bullets, the module headings and the thread table (section 5). The five
  session files lay out module sections in different ways, so the packet
  reads the rest of the section itself.

**Blocks with no field in the curriculum file.** The packet writes these
from the module section. The accuracy review checks them against that
section and the sources.

| Block or field | Source |
|---|---|
| Word card | the terms that rungs 2 and 3 use |
| Segments | the segment plan when the section has one. Otherwise one segment for each group of related checks. |
| Explain it back | a "why" question from rung 4, with its model answer |
| How it shows up in a question | the "what if" questions of rung 4, with their model answers |
| Exit quiz | the pretest questions again, with `use: [pretest, exit]` |
| Feedback on a wrong option with no Feedback line | the "Wrong:" text of its misconception |
| `confidence` | the Confidence line in the session header |

**Steps**

1. Read the module section, its claim rows and its instructor questions.
2. Write the simulator logic and its tests first, with RFC or source test
   vectors.
3. Build the simulator component.
4. Write the MDX page in lesson-contract order.
5. Write the quiz items and the cards.
6. Run the gate.
7. Run one accuracy review subagent on the finished page. Fix what it
   proves.
8. Set `status: ready`.

**Estimate:** 2 to 4 hours for a module with one simulator.

**Parallel runs:** because packets never share a file, a workflow can run
several packets at once in separate git worktrees and merge them with no
conflicts. This is the contract-first method from SiteSync. Each worktree
runs the whole gate on its own preview port, 4401 and up.

**Feedback after the pilot:** when a page confuses Bibek, he adds a line to
`docs/feedback.md`: the date, the module ID, the segment, a note. The next
session runs a fix packet for each open line.

### Contract change requests

None yet.

---

## 5. The gate

A packet or phase is done only when all of these pass. Show the output.

| # | Check | Command or method |
|---|---|---|
| 1 | Types and content schemas | `npm run check` with 0 errors |
| 2 | Unit tests | `npm run test` |
| 3 | Content rules | `npm run verify` |
| 4 | Build | `npm run build` |
| 5 | Accuracy | One adversarial review subagent checks the page against the curriculum file, the sources, and the RFCs. For a module with a "Graded-work guard" or an "Integrity note", it also checks rule 4 in `CLAUDE.md`. Fix every proven finding. |
| 6 | Visual QA | Playwright MCP on `npm run preview -- --port 4399` (4401 and up in a worktree): light and dark, 390 px and 1280 px wide, a keyboard-only pass through every widget, zero console errors |
| 7 | Prose | `npm run lint:prose -- <module-id>` under 2.5 per 100 words. With no module ID, it lints every module. |

`lint-prose.mjs` needs no MDX parser. It drops the frontmatter, `import`
lines, fenced code, inline code and JSX tags with regular expressions, then
pipes the rest to
`python3 ~/.claude/skills/asd-ste100/scripts/ste-lint.py --fail-over 2.5`,
which reads stdin when it gets no file.

### What `npm run verify` checks

1. Every `covers` ID exists in the claim table of the session that its
   prefix names.
2. Every `misconception` ID exists in the curriculum file of the session that
   its prefix names.
3. Every `prereqs` ID is a planned module. Every `threads` ID is in the
   thread table.
4. Every mcq and predict item has 3 or 4 options and exactly one correct
   option. Every wrong option has a `misconception` and a `feedback`.
5. Every `ready` module has 2 or 3 pretest items, 3 to 6 checks with 1 or 2
   for each `<Segment>` in its MDX, 2 or 3 exit items, and 3 to 8 cards. An
   item with more than one `use` counts toward each. A `draft` module skips
   this rule. So does a quiz file with no MDX page (a quiz pack).
6. Every quiz item ID and card ID is unique.
7. For a session whose planned modules are all `ready`: every `core` claim is
   covered by at least one module.
8. No lesson MDX holds a root-relative Markdown link, `](/`. Use
   `ModuleLink`.

**How the verifier reads the curriculum.** The files in `docs/curriculum/`
stay the single source of truth. The verifier reads four things, with these
line patterns:

```
claims           ^\| (S\d\d-C\d+) \|             the last cell is the kind
misconceptions   ^- (S\d\d-M\d+)(?: \([^)]*\))?: "
planned modules  ^### (s\d\d-m\d\d-[a-z0-9-]+)$
threads          ^\| `(T-[a-z-]+)` \|            in docs/curriculum/README.md
```

A misconception bullet that only names an ID again, such as
`- S05-M03 appears again in checks 3 and 4.`, is a reference, not a
definition.

Instructor questions (`S0N-Q`) are bold paragraphs in Session 1 and table
rows in Sessions 2 to 5. No script reads them. Phase 8 reads them by hand.

### Safety rules for the gate

- Use port 4399 for preview, or 4401 and up in a worktree. Bibek reads on
  port 4400. Never stop or reuse a dev server that Bibek started.
- Stop only the process you started, by its PID. Never use a broad `pkill`.

---

## 6. Order and calendar

| Date | Event |
|---|---|
| 2026-09-13 | Phase 0 |
| Fri 2026-09-18 | Session 6, (Ab)using CDNs |
| Fri 2026-09-25 | Session 7, Economics of cloud tech. The calculator assignment is due before this class. |
| Fri 2026-10-02 | Session 8, Building for failures |
| not known | the three post-class quizzes, the project deadline, the end-term |

Bibek says the dates can change. The instructor has not formally given the
assignment or the project yet. Put each date in `assessments.yaml` when it
is known.

- Phases 1 to 3 first, by 2026-09-19, because the assignment is due before
  Session 7 and `s05-m12` is a pilot page.
- After each new class, run `docs/ADD-A-SESSION.md` within 48 hours and
  before the post-class quiz opens. It gives a curriculum file and a quiz
  pack.
- The modules of a new session go to the front of the module queue of
  Phases 5 to 7, whether it arrives before Phase 5 or during it. Their
  prereqs from older sessions can still be planned pages.

---

## 7. How the explanations work

The explanation design lives in two files.

- `docs/PEDAGOGY.md`: the lesson contract, the four rungs (the picture, how it
  works, the real thing, exam depth), and a sample in the target voice.
- `docs/curriculum/session-0N.md`: per module, the analogy and where it
  breaks, the mechanism steps, the real bytes and code, the exam-depth
  questions, the misconceptions, the diagrams, the simulators, the checks and
  the cards.

A module packet turns those two files into a page. It does not invent a new
teaching approach. Section 4 names the source of each block that the
curriculum file has no field for.

---

## 8. Risks and limits

| Risk | Effect | Mitigation |
|---|---|---|
| No transcripts, so the curriculum rests on slides and code | A point the instructor made only by voice is missing | The instructor code READMEs fill part of it. Bibek records a gap in `docs/feedback.md` after a quiz. Add the claim with a new ID. |
| AI-written teaching content is wrong with confidence | Bibek learns a wrong model | Unit tests with RFC vectors, the accuracy review gate, a reference on every beyond-the-slides fact |
| The instructor's numbers come from his laptop over loopback | A number reads as a law | Every measured number keeps its conditions |
| Simulators are models, not the real kernel | A learner trusts a toy over the real system | Each simulator has a "what this simplifies" line, and a lab with the real command |
| 57 modules is large. At 2 to 4 h each, that is 114 to 228 h of packets. | The site is half built at the end-term. Its date is not known. | P1 simulators only until every module exists. Run 4 packets in parallel (29 to 57 h). Phases 3 and 4 follow assessment need. Phases 5 to 7 follow the course. The quiz pack of a new session comes first. |
| Browser data is cleared | Progress is lost | Export and import |
| The syllabus for weeks 7 and 8 differs between documents. The Session 4 and 5 decks preview Session 6 as "Where did the state go?", not CDNs. | Wrong placeholders | Build only from sources that exist |
| Graded work leaks | An integrity problem | Rule 4 in CLAUDE.md, the integrity check in gate check 5, prep pages with checklists and hints only |
| The public repo shows the curriculum files and the graded-work prep | Classmates see prep for graded work | The Phase D checklist in section 4 |

---

## 9. Stack facts checked on 2026-09-13

A research pass read the Astro docs and npm on 2026-09-13. Check these again
at Phase 1 with the context7 tools. Items marked UNVERIFIED were not
confirmed.

| Topic | Fact |
|---|---|
| Astro | 7.3.2 is the current stable version. Node 22.12 or later, even-numbered releases only. The local machine has Node 24.6.0. |
| Create | `npm create astro@latest site -- --template minimal --add mdx,preact -y`. The minimal template already extends `astro/tsconfigs/strict`. |
| Check | `astro check` needs `@astrojs/check` and `typescript`. |
| Collections | Config in `src/content.config.ts`. Loaders `glob()` and `file()` from `astro/loaders`. `z` comes from `astro/zod` (Zod 4), not from `astro:content`. `glob()` takes `generateId({ entry, base, data })`. `file()` takes a `parser` option. `getEntry()` returns `undefined` for a missing ID (context7, 2026-09-14). This plan links entries by plain ID strings (section 3). |
| MDX and Preact | `@astrojs/mdx`, `@astrojs/preact` with `preact`. tsconfig needs `"jsx": "react-jsx"` and `"jsxImportSource": "preact"`. |
| Markdown pipeline | Astro 7 renders `.md` and `.mdx` with a new pipeline (Sätteri), not remark and rehype. A remark or rehype plugin needs `@astrojs/markdown-remark`. Shiki stays the highlighter. Shiki transformers: UNVERIFIED. |
| Compiler | The Rust compiler rejects invalid HTML. Close every non-void element, and lint hand-written SVG. Self-closing SVG children: UNVERIFIED. |
| Whitespace | `compressHTML` defaults to `'jsx'`, so a space between inline elements disappears unless written explicitly. Check prose around inline `<code>`. |
| Islands | Props must be serializable. No functions. Islands prerender at build time, so read `localStorage` in `useEffect`, or use `client:only="preact"` for progress widgets. `client:visible` hydrates late. |
| Shared state | `nanostores` with `@nanostores/preact`. `@nanostores/persistent` exists for storage. |
| GitHub Pages | `site` and `base` in the config, internal links through `import.meta.env.BASE_URL`, `trailingSlash: 'always'` to match the directory output. Action `withastro/action@v6` with `actions/deploy-pages@v5`. |
| Starlight | 0.42, pre-1.0, docs layout, opts back into remark. Verdict: use plain Astro. |
| Pagefind | `astro-pagefind` (third-party), or `npx pagefind --site dist` after the build. No server. No results in `astro dev`. Search under a `base` path: UNVERIFIED. |

The base path matters from Phase 1. Phase 1 sets a placeholder `base`, and
every internal link goes through `ModuleLink` or `import.meta.env.BASE_URL`,
so the Phase D deploy changes one config line at most.

---

## 10. Decisions from Bibek

| Date | Question | Answer |
|---|---|---|
| 2026-09-13 | Complete decks for Sessions 2 to 5 | Saved from the browser. All five decks are complete. |
| 2026-09-13 | Class transcripts | Not available. AI notes exist for Sessions 1 and 2 only. |
| 2026-09-13 | Dates | Sessions 6, 7, 8 on Fridays 2026-09-18, 09-25, 10-02. Can change. The assignment is not formally given yet. |
| 2026-09-13 | Public or private repo | Public, later. Sources stay git-ignored. |

Still open: the dates of the three quizzes and how long after each class a
quiz opens, the project deadline and the end-term.
