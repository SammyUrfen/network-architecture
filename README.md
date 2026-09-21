# Network Architecture, taught again

An unofficial study companion for the "Network Architecture" course at Scaler
School of Technology.

**Read it here:** https://sammyurfen.github.io/network-architecture/

## What this is

The course moves fast. One session goes from the socket calls of a C server
to the way nginx handles ten thousand clients. If you miss one step, the rest
of the lecture stops making sense. This site takes each session again, one
lesson at a time and at a slower speed.

Each lesson starts with a picture from real life that a 10-year-old can
follow. Then it goes deeper, step by step, until you can answer exam and
design questions. Small checks between the parts show you what you missed.
Review cards bring the important ideas back a few days later, so you keep
them. Where the course has a demo, the lesson gives a lab that runs the
instructor's own code.

The site grows one session at a time, so many lessons are not written yet.
It is not an official course resource. The instructor and the school did not
write or review it. If the site and the class disagree, trust the class, and
open an issue here.

## Run it on your computer

You need Node 22.12 or later. CI uses Node 24.

```sh
cd na-site/site
npm ci
npm run dev
```

Astro prints a local address. Open it and add `/network-architecture/` at the
end, because the site uses the same base path as GitHub Pages. If Astro runs
the server in the background, `npx astro dev stop` stops it.

The whole site lives in `na-site/`. The lessons are MDX files in
`na-site/site/src/content/modules/`. Their quizzes and review cards are YAML
files next to them in `na-site/site/src/content/`. The plan and the lesson
rules are in `na-site/docs/`. The other folder, `projects/`, holds the
author's own course work. Git ignores it, so nothing graded is in this repo.

## How the content is checked

A change counts as done only when four commands pass in `na-site/site/`.
`npm run check` checks the types and the content schemas. `npm run test` runs
the unit tests, and every simulator has tests against RFC or source values.
`npm run verify` checks the content rules. For example, every quiz question
must have exactly one right answer, and the right answer must not always sit
in the same place. `npm run build` makes the static site. GitHub Actions runs
all four on every push and pull request, and deploys the site from `main`.

Some checks need a person or a tool outside this repo, so they run by hand. A
reviewer compares each lesson with the slides and the RFCs. A browser pass
checks light and dark mode, a phone width and the keyboard. A linter keeps the
prose in plain, simple English. Before a public push,
`python3 na-site/tools/quote_scan.py` looks for long runs of words copied
from the course material. That material stays on the author's computer.

## Two rules for the content

**No solutions to graded work.** Graded work is the calculator assignment, the
binary HTTP project and the real questions of the post-class quizzes. A page
that helps with graded work can give a checklist of requirements, a test plan
and hints. It never gives solution code or the answer to a real quiz question.

**No copies of the slides.** The lessons explain every idea in new words and
quote only short phrases. The slides, the class notes and the instructor code
never go into this repo.

## Credit

The course and every demo in these lessons come from the instructor. The demo
code lives in the instructor repository,
https://github.com/jitendraag/cn-at-scaler. Clone it to run the labs:

```sh
git clone https://github.com/jitendraag/cn-at-scaler.git
```
