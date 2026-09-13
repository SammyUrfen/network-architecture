# Network Architecture: a teaching site for one course

This repo builds a static website that re-teaches Bibek's trimester course
"Network Architecture" (CN @ Scaler), lesson by lesson. Bibek could not follow
the live lectures. The site gives a first contact that a 10-year-old can
follow, then goes deep enough for exam and design questions. More sessions
arrive each week, so the site grows one session at a time.

## Read in this order

1. `docs/PLAN.md`: the phases, the status, the architecture, the gate.
2. `docs/PEDAGOGY.md`: the lesson contract. Every page obeys it.
3. `docs/curriculum/README.md`: the IDs, the template, the threads.
4. `docs/curriculum/session-0N.md`: the teaching design for the session you
   work on.
5. `docs/ADD-A-SESSION.md`: the runbook when a new class happens.

## Status

| Part | State |
|---|---|
| Curriculum maps | Sessions 1–5 written and reviewed on 2026-09-14: 57 modules, 894 claims. Sessions 6–8 not taught yet. |
| Site | Not started. Next: Phase 1 in `docs/PLAN.md`. |
| Sources | All five decks complete. No transcripts. See `sources/MANIFEST.md`. |

Update this table when a phase ends.

## The course

| Week | Topic | Date |
|---|---|---|
| 1 | Network programming 101 | taught, about 2026-08-12 |
| 2 | Computer Networking Eagle Eye View | taught, about 2026-08-14 |
| 3 | Server Side Considerations for scale | taught, about 2026-08-27 |
| 4 | nginx deep dive | taught, about 2026-09-04 |
| 5 | Evolution of HTTP | taught, about 2026-09-11 |
| 6 | (Ab)using CDNs | Fri 2026-09-18 |
| 7 | Economics of cloud tech | Fri 2026-09-25 |
| 8 | Building for failures | Fri 2026-10-02 |

Future dates can change. The Session 5 deck lists a different week 7 and 8
("Building for failures", "Streaming video at large scale"). The Session 4 and
5 decks preview Session 6 as "Where did the state go?". The table above is
the official one.

**Grading:** post-class quizzes 30% (three quizzes), project 30%, assignment
20%, end-term exam 20%. The Session 5 deck announces the calculator
assignment (due before Session 7) and the binary HTTP project. Neither is
formally given yet.

**Instructor code:** `github.com/jitendraag/cn-at-scaler`, cloned at
`sources/cn-at-scaler/`. Every demo in the lessons comes from there.

## Where things are

| Path | What | In git |
|---|---|---|
| `docs/` | plan, pedagogy, curriculum maps, runbook | yes |
| `sources/` | slides, AI notes, instructor clone | no, only `MANIFEST.md` |
| `tools/pdf_salvage.py` | gets text out of a truncated PDF deck | yes |
| `.claude/workflows/session-curriculum.js` | the saved workflow that writes and reviews a curriculum file | yes |
| `site/` | the Astro site, from Phase 1 | yes |

## Rules

### Content

1. **Teach what the instructor taught.** Each module lists the claim IDs it
   covers. A fact that is not in the sources gets a "beyond the slides" badge
   and a reference (RFC section, man page, official docs).
2. **Correct before complete.** Check every byte layout, number and answer
   key. Simulator logic is a pure function with tests against RFC or source
   vectors.
3. **Numbers keep their conditions.** The instructor measured on his laptop,
   often over loopback. Write "150 ms RTT, loopback", never a bare number.
4. **No solutions to graded work.** Graded work is the calculator
   assignment, the binary HTTP project, and the real questions of the
   post-class quizzes. A prep page for graded work follows the lesson
   contract. It can add a requirement checklist, a test plan and a hint
   ladder. It never gives solution code, a solving skeleton, a written spec,
   or the answer to a real quiz question. This is the one text of the rule.
   Other files point here.
5. **No copy of the slides.** Quote short phrases only. Explain in original
   words. Never put a source PDF, slide image or large code file in `site/`.
6. **Plain words first.** A code identifier is evidence after the
   explanation. Every analogy says where it breaks.
7. **IDs are permanent.** Never rename or reuse a claim, module, item or card
   ID once a lesson page uses it. Add new IDs at the end.

### Sources

- `sources/` is read-only input. Do not edit the instructor clone. Update it
  only with `git pull`.
- Record every new or replaced source in `sources/MANIFEST.md`.

### Work

- Module work follows the packet in `docs/PLAN.md` section 4. A packet
  touches only its own files. A change to shared components or schemas is a
  separate contract change.
- A task is done only when the gate in `docs/PLAN.md` section 5 passes. Show
  the output.
- Preview on port 4399, or on 4401 and up in a parallel worktree. Bibek
  reads the site on port 4400. Never stop a server that Bibek started. Stop
  only the PID you started. No broad `pkill`.
- Docs and lesson prose follow ASD-STE100 flavored style. Lint with
  `python3 ~/.claude/skills/asd-ste100/scripts/ste-lint.py --fail-over 2.5 FILE`.
- Confirm current Astro, Preact and Vitest APIs with the context7 tools
  before writing site code.
- No GitHub remote and no deploy until Bibek asks. The repo goes public later,
  so nothing from `sources/` may enter a tracked file beyond short quotes.
  Before any public push, run the Phase D checklist in `docs/PLAN.md`
  section 4.

## Commands

Before Phase 1, the repo has no build. From Phase 1, run these in `site/`:

```sh
npm run dev          # local site
npm run check        # types and content schemas
npm run test         # unit tests
npm run verify       # content rules: IDs, coverage, quiz shape
npm run build        # static output in site/dist
npm run preview -- --port 4399
npm run lint:prose -- <module-id>   # no ID: lint every module
```

```sh
python3 tools/pdf_salvage.py --selftest
python3 tools/pdf_salvage.py sources/session-0N/slides.pdf > sources/session-0N/slides.txt
```
