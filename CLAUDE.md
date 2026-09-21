# Network Architecture: the repo index

This repo holds two separate parts of one course, "Network Architecture"
(CN @ Scaler). The parts do not share code, and only one of them is public
content.

## The two parts

| Path | What | In git |
|---|---|---|
| `na-site/` | The teaching site. It re-teaches the course lesson by lesson. Live at https://sammyurfen.github.io/network-architecture/. | yes |
| `projects/` | Bibek's own course work: the assignment and the project. | no, git ignores it |

## Where the rules are

`na-site/CLAUDE.md` holds every rule for the site: the read order, the
status table, the content rules, the source rules, the work rules and the
commands. Read it before you touch anything under `na-site/`.

Work under `na-site/` starts from `na-site/docs/PLAN.md`.

## The graded work stays out of this repo

The assignment code and the project code live in their own private repo.
`projects/` is only the local place where Bibek builds them. Git ignores it,
so nothing graded reaches this public repo.

Rule 4 of `na-site/CLAUDE.md` still holds for the site: no page gives a
solution to graded work.

## The build

GitHub Actions stays at the repo root, in `.github/workflows/`, because
GitHub needs it there. Both workflows build `na-site/site`.

```sh
cd na-site/site
npm ci
npm run dev
```
