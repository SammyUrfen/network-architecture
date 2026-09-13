# Component catalog

The components, props and progress API that a lesson page can use. After
Phase 2, these props and the content schemas are **the contract**
(`docs/PLAN.md` section 4). A module packet uses the contract and does not
change it. If a packet needs a change, it stops and writes a contract change
request in `docs/PLAN.md`.

Each component file exports a typed `Props` interface. The file is the final
word on a prop. This catalog gives the map.

**Kinds**

| Kind | Meaning |
|---|---|
| Astro | An `.astro` component. It sends no JavaScript to the browser. |
| Island with wrapper | A Preact island inside an `.astro` wrapper. The MDX uses the wrapper. The wrapper sets the client directive and finds the data at build time. |
| Island, no wrapper | A Preact island that a page puts in place with its own client directive. |
| Plain Preact | A Preact component that only islands render. Not for MDX. |

---

## 1. Rules for a module packet

### Page frame

- The module page `src/pages/[session]/[module].astro` gives block 1 of the
  lesson contract: `ModuleHeader`, the outline and `ModuleProgress`. The MDX
  does not write a header. It starts at block 2, the pretest.
- An MDX file imports each component with a relative path, such as
  `import Check from '../../../components/check/Check.astro';`.
- The MDX never writes a client directive. The wrappers set it.
- For a link to another module, use `<ModuleLink id="..." />`. Never write a
  root-relative Markdown link (verify rule 8).
- Give `WordCard` the frontmatter terms: `<WordCard terms={frontmatter.terms} />`.

### Segments

- `npm run verify` numbers segments in page order from 1. The Nth
  `<Segment>` tag in the MDX is segment N.
- The `segment` field of a check item uses that number. `Segment` has no
  number prop.
- The `title` of a `Segment` is a plain string attribute, `title="..."`. The
  page reads the titles from the raw MDX for the outline, so an expression
  such as `title={x}` does not show in the outline.

### Boxes, hints and ladders

- A hint ladder, or a box to open after an attempt, is a plain `<details>`
  in the MDX. No component.
- Rung 1 and the word card sit in an open box. Rung 4 (`ExamDepth`) sits in
  a closed box. The components already do this.

### Content strings

- A string in a quiz file, a card file or an island prop marks inline code
  with backticks: `` "`Content-Length: 219`" ``. The islands show it as code.
- Option feedback does not start with "Right." or "Wrong.". The component
  shows the verdict.
- In `ByteView`, write CR LF in a `text` field as `{"\r\n"}` in MDX, so the
  escapes become bytes.
- A `SequenceDiagram` label has at most 40 characters, so it fits the SVG. A
  longer label or an unknown actor fails the build.

### Question types

The check islands show these types: `mcq`, `predict`, `multi`, `numeric`,
`recall`, and `spot-bug` with `options`. An `order` item, a `bytes` item or a
`spot-bug` item with `code` fails the build until Phase 4 adds them.

A missing quiz item ID, or a module with no item for a `use`, also fails the
build.

In a quiz file with 3 or more `mcq` and `predict` items, move the right
option between positions. Verify rule 9 fails a file with the right option
at the same position in all of them. The islands do not shuffle options.

---

## 2. Lesson blocks

All in `src/components/lesson/`. The pilots are `s01-m08-framing` (m08) and
`s05-m12-assignment-prep` (m12).

| Name | Kind | Props | Pilot |
|---|---|---|---|
| `ModuleHeader` | Astro | `title: string`, `minutes: number`, `bigIdea: string`, `status: 'draft' \| 'ready'`, `prereqs: string[]`, `threads: string[]`, `segments: string[]`. Named slot `progress`. The module page gives it. | both |
| `WordCard` | Astro | `terms: { term: string; meaning: string }[]` | both |
| `Segment` | Astro | `title: string`, a plain string attribute. Default slot. Shows "Part N" with a CSS counter. | both |
| `Picture` | Astro | `rows: { picture: string; real: string }[]`, `breaks: string` | both |
| `ExamDepth` | Astro | No props. Default slot. A closed box. | both |
| `ModuleLink` | Astro | `id: string`. A module with no page shows its ID and "(planned)". | both |
| `InventFirst` | Astro | `prompt: string`. Default slot holds the full explanation. | m08 |
| `Beyond` | Astro | `source: string`, `url?: string`. Default slot. Shows the "beyond the slides" badge. | m12 |
| `Lab` | Astro | `title: string`. Default slot, for `Terminal` blocks. | none yet |
| `CardsAdded` | Island with wrapper | Wrapper: `id: string`, the module ID. Island: `cards: string[]`. It adds the cards when the learner pushes the button, not on page load. | both |
| `ModuleProgress` | Island, no wrapper | `id: string`, the module ID. The module page uses `<ModuleProgress slot="progress" client:only="preact" id={id} />`. | both, through the page |

`ModuleProgress` shows four steps: pretest, questions answered, review cards
added, and done. It has no totals, so it counts what the store holds.

---

## 3. Check blocks

All in `src/components/check/`. Each wrapper adds `client:load`.

| Name | Kind | Props | Pilot |
|---|---|---|---|
| `Pretest` | Island with wrapper | Wrapper: `module: string`. Island: `module: string`, `items: SupportedItem[]`, `misconceptions: Record<string, string>`. Shows every item with `use: pretest`, in file order. | both |
| `Check` | Island with wrapper | Wrapper: `id: string`, a quiz item ID. Island: `item: SupportedItem`, `misconceptions: Record<string, string>`. | both |
| `Predict` | Island with wrapper | Wrapper: `id: string` of a `predict` item. Default slot: the observed result, hidden until the learner commits. | both |
| `ExplainBack` | Island with wrapper | `prompt: string`, `model: string` | both |
| `FadedExample` | Island with wrapper | `worked: { problem: string; steps: string[] }`, `faded: { problem: string; blanks: { label: string; answer: string }[] }`, `yourTurn: { problem: string; answer: string }` | both |
| `ExamPrompts` | Island with wrapper | `prompts: { prompt: string; model: string }[]` | both |
| `ExitQuiz` | Island with wrapper | The same props as `Pretest`, with `use: exit`. | both |
| `Confidence` | Plain Preact | `name: string`, `value: Confidence \| null`, `onChange: (value: Confidence) => void`, `disabled?: boolean`. Radios for sure, think so, guessing. | inside `Question` and the review page |
| `Question` | Plain Preact | `item: SupportedItem`, `misconceptions: Record<string, string>`, `name: string`, `mode: 'guess' \| 'graded'`, `hideExplanation?: boolean`, `onDone?: (result: Result) => void` | inside the quiz islands |
| `Reveal` | Plain Preact | `prompt: string`, `model: string`, `modelLabel?: string` | inside `ExplainBack`, `ExamPrompts`, `Predict` |
| `Inline` | Plain Preact | `text: string`. Shows backtick parts as `<code>`. | inside the islands and the review page |

How the check blocks behave:

- The pretest shows no grade and no model answer. When every guess is
  locked, it saves `modules[id].pretestDoneAt`, and the progress bar marks
  the pretest done. It saves the score `modules[id].pretest` only when every
  pretest item has a grade. A `recall` guess has no grade.
- The exit quiz shows each pretest guess of this page view. A reload clears
  the guesses.
- A wrong pick names its misconception with the statement from the
  curriculum file, then the ID.
- A "sure" answer that is wrong goes to the review queue, due tomorrow.

---

## 4. Diagrams

All in `src/components/diagram/`.

| Name | Kind | Props | Pilot |
|---|---|---|---|
| `ByteView` | Astro | `caption: string`, `messages: ByteMessage[]`, `view?: 'bytes' \| 'text'`. `ByteMessage` is `{ name?: string; fields: { hex?: string; text?: string; label?: string; kind?: 'length' \| 'delimiter' \| 'pad' }[] }`. A field has `hex` or `text`, not both. Offsets count from 0 across all messages. | both |
| `Terminal` | Astro | `title?: string`, `runs: { cmd: string; out?: string }[]`. Put the run conditions in the title. | both |
| `SequenceDiagram` | Astro | `title: string`, `actors: string[]`, `messages: { from: string; to: string; label: string }[]`. A message with `from` equal to `to` is a note. | m12 |
| `Stepper` | Island with wrapper | `title: string`, `steps: { caption: string; ask?: string; lanes: { label: string; chunks: string[] }[] }[]`. Each step gives the full state of every lane, with the same lanes in the same order. The island marks the chunks that changed. The wrapper uses `client:visible`. | m08, m12 |

`ByteView` colors mark the role of a field, not a network layer. No pilot
shows two layers.

---

## 5. Pages and site parts

| Name | Kind | Props | Notes |
|---|---|---|---|
| `Base` layout | Astro | `title: string` | The theme script, the header, the nav and the global styles |
| `ThemeToggle` | Astro | No props | System, light, dark. It writes the `na-theme` key. |
| `SourceBadge` | Astro | `status: 'complete' \| 'partial' \| 'missing'` | Session source status |
| `/review/` island `_ReviewQueue.tsx` | Island, no wrapper | `cards: ReviewCard[]`, `progressHref: string`. `ReviewCard` is `{ id; front; options?; back; explanation?; examDates }`. | Holds the cards and every quiz item |
| `/progress/` island `_ProgressTools.tsx` | Island, no wrapper | No props | Export, import, reset |
| `/` island `_Today.tsx` | Island, no wrapper | `reviewIds: string[]`, `reviewHref: string`, `modules: { id; title; href }[]` in course order | The due count from the `/review/` logic. The "continue" link goes to the unfinished module that started last, else the first module with no start. With neither, no link. |

The review queue holds two kinds of entries:

- A card from `src/content/cards/`.
- A quiz item that a check put in the queue. The front shows its prompt and
  its options. The back shows the right answer and the explanation.

**Global classes** in the base layout:

- `.sr-only`: text for screen readers only.
- `.btn`: the plain button of pages and progress islands. The check islands
  and the `Stepper` keep their own button styles.

An island cannot use scoped Astro styles. Its styles go in a prefixed CSS
file, such as `check.css` with the `chk-` prefix, or in the wrapper with
`:global()`.

---

## 6. Progress API for island authors

### Rules

1. An island that reads `$progress` in render uses `client:only="preact"`.
   `useStore` reads storage during render, so a prerendered copy does not
   match the client.
2. An island that only writes the store can prerender. The check islands
   use `client:load`.
3. Island props are serializable. No functions.
4. Never call `localStorage` from a component. Use the functions below.

### `src/lib/progress.ts`

The store writes through to one `localStorage` key, `na-progress`.

| Export | Type | What it does |
|---|---|---|
| `Progress` | type | `{ version: 1; modules; answers; cards }`, as in `docs/PLAN.md` section 3. A module also has the optional `pretestDoneAt`. A version 1 file with no `pretestDoneAt` stays valid. |
| `Confidence` | type | `'sure' \| 'think' \| 'guess'` |
| `$progress` | `atom<Progress>` | The progress. It reads storage on the first subscriber, never at import. |
| `$progressProblem` | `atom<string \| null>` | The reason why the stored data is not in use: bad data, a newer version, or blocked storage. While it is set, changes stay in memory. |
| `updateProgress(change)` | `(change: (p: Progress) => Progress) => void` | Reads storage again, gives `change` a fresh copy, then saves. `change` can edit in place and return the object. A full disk throws. |
| `exportProgress()` | `() => string` | The progress as JSON. The theme key stays out. |
| `parseProgress(json)` | `(json: string) => Progress` | Validates a file and changes no data. Throws an `Error` with a message for the learner. |
| `importProgress(json)` | `(json: string) => void` | Validates, then replaces all progress. A bad file throws before any change. |
| `resetProgress()` | `() => void` | Deletes all progress. The page asks first. |
| `emptyProgress()` | `() => Progress` | A new empty progress object |

### `src/lib/schedule.ts`

Every function takes `now` as an argument, so a test controls the clock.

| Export | Type | What it does |
|---|---|---|
| `BOX_DAYS` | `[1, 3, 7, 14, 30]` | The gap in days for box 1 to 5 |
| `CardState` | type | `{ box: 1..5; due: 'YYYY-MM-DD'; lapses: number }`. `due` is a local calendar day. |
| `localDay(now)` | `(now: Date) => string` | The local day as `YYYY-MM-DD` |
| `addDays(day, days)` | `(day: string, days: number) => string` | Calendar arithmetic with no DST shift |
| `newCard(now)` | `(now: Date) => CardState` | Box 1, due tomorrow |
| `reviewCard(card, correct, now, examDates?)` | `CardState` | Right: one box up. Wrong: box 1, due tomorrow, one more lapse. A known exam date pulls the due day into the week before the exam. |
| `isDue(card, now)` | `(card: CardState, now: Date) => boolean` | True from the due day on |

### `src/lib/grade.ts`

`gradeChoice`, `gradeMulti`, `gradeNumeric`, `gradeOrder`, `gradeBytes`,
`gradeByteField`, `gradeBugLines` and `gradeRecall` each give
`{ correct: boolean; feedback: string }`. The type `QuizItem` comes from the
quiz schema. A `bytes` item and a `spot-bug` item have optional fields, so
narrow the item before the call.

### `src/components/check/record.ts`

| Export | What it does |
|---|---|
| `addAnswer(progress, itemId, correct, confidence, now)` | Adds one graded answer. A sure wrong answer puts the item ID in `cards`. |
| `save(change)` | Calls `updateProgress`. Gives the reason when the change is not saved, or `null`. |
| `pretestGuesses` | The pretest guesses of this page view, for the exit quiz |

### Who writes what

| Field | Writer | When |
|---|---|---|
| `modules[id].startedAt` | `Pretest`, `ExitQuiz` | The first time either one finishes |
| `modules[id].pretestDoneAt` | `Pretest` | The first time every pretest guess is locked, a `recall` guess too |
| `modules[id].pretest` | `Pretest` | Every pretest item has a grade |
| `modules[id].completedAt` | `ExitQuiz` | Every exit item has an answer |
| `answers[itemId]` | the check islands | Each graded answer |
| `answers[cardId]` | `/review/` | Each review |
| `cards[cardId]` | `CardsAdded`, `/review/` | The add button, then each review |
| `cards[itemId]` | the check islands | A sure wrong answer, then each review |

Quiz item IDs and card IDs share one namespace (verify rule 6), so one
`cards` record holds both.
