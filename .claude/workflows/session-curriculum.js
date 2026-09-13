export const meta = {
  name: 'session-curriculum',
  description: 'Write, review from three lenses, and fix docs/curriculum/session-0N.md for one or more course sessions',
  whenToUse: 'Step 4 of docs/ADD-A-SESSION.md. Args: {n, brief} or an array of them. The brief gives the deck title, agenda, source paths, cross-references and the RFCs to check.',
  phases: [
    { title: 'Draft', detail: 'one author per session' },
    { title: 'Review', detail: 'fidelity, accuracy and pedagogy lenses' },
    { title: 'Fix', detail: 'verify each finding, apply what holds' },
  ],
}

// Absolute path: workflow scripts cannot read the filesystem to find the repo.
// Update this line if the repo moves.
const ROOT = '/home/SammyUrfen/Codes/Network Architecture'
const LINT = 'python3 /home/SammyUrfen/.claude/skills/asd-ste100/scripts/ste-lint.py --fail-over 2.5'

const sessions = (Array.isArray(args) ? args : [args]).filter(s => s && s.n && s.brief)
if (!sessions.length) throw new Error('args must be {n, brief} or an array of them')

const pad = n => String(n).padStart(2, '0')

const COMMON = `
CONTEXT
Repo: ${ROOT}. Do NOT commit. Do NOT touch files other than the one output file named in the task.
The learner (Bibek, a CS undergrad with real systems experience) could not follow the lectures of the course "Network Architecture". We build a STATIC teaching website that re-teaches it lesson by lesson: "explain like I am 10" on first contact, deep enough for exam and design questions.
Read ${ROOT}/CLAUDE.md for the course table, the grading and the rules.

READ FIRST: ${ROOT}/docs/curriculum/README.md (template, IDs, fixed module IDs, threads, rules). Obey it exactly.
Then ${ROOT}/sources/MANIFEST.md (source status). Then ${ROOT}/docs/PEDAGOGY.md section 2 (the lesson contract the curriculum feeds).
Read earlier session files in ${ROOT}/docs/curriculum/ for prereq module IDs and threads. Do not edit them.

SOURCES (read-only): ${ROOT}/sources/session-NN/ (slides.txt, notes.md when present) and ${ROOT}/sources/cn-at-scaler/.
- slides.txt is pdftotext -layout output. A form feed separates PDF pages. "Slide N" means PDF page N, not the footer number printed on the slide. Print one slide with: awk 'BEGIN{RS="\\f"} NR==12' slides.txt
- notes.md files are AI summaries with citation junk like 【4:0†source】. Lower trust. Cross-check against the slides.
- There are no class transcripts.
- The Module IDs table in docs/curriculum/README.md maps each module to its starting slides. Use it as the plan, and move a slide to a better module when the content demands it (record that under Open questions).

GRADED WORK (never solve): the Session 5 deck announces a calculator assignment on one persistent HTTP/1.1 connection, due before Session 7, and a pair project "HTTP, in binary" (bserve and bcurl plus a two-page spec). Neither is formally given yet. The three post-class quizzes are 30% of the grade, so every quiz-worthy fact belongs in the claim inventory.

RULES THAT MATTER MOST
- Fidelity: the claim inventory lists what the instructor taught, with a source pointer. Do not invent claims. Facts added for correctness go under "Beyond the slides" with an authoritative reference. Confirm uncertain facts with WebFetch.
- Accuracy over everything. Redo every piece of arithmetic and every byte layout.
- Integrity: never write a solution to graded work. Rule 4 in CLAUDE.md is the one text of this rule. Obey it.
- Quote slides only in short phrases.
- Prose: ASD-STE100 flavored. Lint with \`${LINT} <file>\`, under 2.5 per 100 words, without dropping facts.
`

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          location: { type: 'string' },
          problem: { type: 'string' },
          evidence: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['severity', 'location', 'problem', 'evidence', 'fix'],
      },
    },
  },
  required: ['findings'],
}

const LENSES = [
  { key: 'fidelity', prompt: 'LENS: FIDELITY AND COVERAGE. Read every source for this session end to end. Find facts, stories, numbers, corrections, demos, instructor questions or homework missing from the file. Find claims the cited source does not support, wrong pointers, core claims no module covers, measured numbers without conditions, long verbatim copying, and unmarked invented content.' },
  { key: 'accuracy', prompt: 'LENS: TECHNICAL ACCURACY. Check every technical statement, answer key, card answer, worked example and interactive spec against RFCs, man pages, official docs and the instructor code. Redo the arithmetic and byte layouts. Flag analogies that plant a wrong model without naming where they break. Real errors only, each with evidence.' },
  { key: 'pedagogy', prompt: `LENS: PEDAGOGY AND EXECUTABILITY. A later session with no memory must build each module page from this file alone. Check every template field per module, pretest answers, rung 1 fit for a 10-year-old with a named break, worked, faded and your-turn problems with answers, checks with one unambiguous answer and distractors tied to misconception IDs, one-fact cards, buildable interactive specs, valid module, prereq and thread IDs, 15-25 minute scope, real exam depth in rung 4. Flag anything that solves graded work. Run \`${LINT} <file>\` and report a score of 2.5 or more.` },
]

const results = await pipeline(
  sessions,
  s => agent(`${COMMON}\n${s.brief}\n\nTASK: Write ${ROOT}/docs/curriculum/session-${pad(s.n)}.md with the template, after reading every source. Lint it. Return: module IDs with minutes, claim count (core count), instructor question count, open questions, lint score.`,
    { label: `draft:s${pad(s.n)}`, phase: 'Draft', agentType: 'general-purpose' }),
  (draft, s) => parallel(LENSES.map(l => () =>
    agent(`${COMMON}\n${s.brief}\n\nYou are an adversarial reviewer of ${ROOT}/docs/curriculum/session-${pad(s.n)}.md. Do not edit files.\n${l.prompt}\nEvery finding needs evidence. Return an empty list if the file is clean for this lens.`,
      { label: `review:s${pad(s.n)}:${l.key}`, phase: 'Review', agentType: 'general-purpose', schema: FINDINGS })
      .then(r => (r ? r.findings : []).map(f => ({ lens: l.key, ...f })))
  )).then(lists => ({ draft, findings: lists.filter(Boolean).flat() })),
  (bundle, s) => agent(`${COMMON}\n${s.brief}\n\nYou fix ${ROOT}/docs/curriculum/session-${pad(s.n)}.md. For EACH finding below, check its evidence yourself. Reject a finding whose evidence does not hold, with a reason. Apply each finding that holds with the smallest full fix. Lint again at the end.\n\nFINDINGS:\n${JSON.stringify(bundle.findings, null, 1)}\n\nReturn: applied and rejected counts by lens, one line for each rejection, final lint score, open questions.`,
    { label: `fix:s${pad(s.n)}`, phase: 'Fix', agentType: 'general-purpose' })
    .then(fix => ({ session: s.n, draft: bundle.draft, findings: bundle.findings.length, fix })),
)

return results.filter(Boolean)
