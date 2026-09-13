# Curriculum map

This folder holds the teaching design for each session of the course. A later
Claude session reads one of these files and turns it into lesson pages. The
file is the contract between "what the instructor taught" and "what the site
teaches". Do not write lesson prose here. Write the plan for the prose.

| File | Session | Date | Source status |
|---|---|---|---|
| [session-01.md](session-01.md) | 1. Network programming 101 | about 2026-08-12 | 48 slides, AI notes, code |
| [session-02.md](session-02.md) | 2. Computer Networking Eagle Eye View | about 2026-08-14 | 41 slides, AI notes |
| [session-03.md](session-03.md) | 3. Server Side Considerations for scale | about 2026-08-27 | 34 slides, code |
| [session-04.md](session-04.md) | 4. nginx deep dive | about 2026-09-04 | 36 slides, code, source tour |
| [session-05.md](session-05.md) | 5. Evolution of HTTP | about 2026-09-11 | 51 slides, code, README |
| session-06.md | 6. (Ab)using CDNs | Fri 2026-09-18 | not taught yet |
| session-07.md | 7. Economics of cloud tech | Fri 2026-09-25 | not taught yet |
| session-08.md | 8. Building for failures | Fri 2026-10-02 | not taught yet |

All five decks are complete. Future dates can change. No class transcripts
exist for any session. Sessions 1 and 2 have AI revision notes.

Source files live in `sources/` (git-ignored). See `sources/MANIFEST.md`.

---

## IDs

One ID names one thing. Lesson pages, quiz data and the coverage check all
use these IDs, so never rename an ID after a lesson uses it.

| Kind | Pattern | Example |
|---|---|---|
| Claim (a fact the instructor taught) | `S01-C07` | `S01-C25` the backlog is the depth of the accept queue |
| Instructor question (homework, "ask the class", thought experiment) | `S01-Q03` | `S04-Q01` why does the master run as root |
| Misconception | `S01-M04` | `S01-M04` one read() returns one message |
| Module (one lesson page) | `s01-m03-slug` | `s01-m08-framing` |
| Thread (a big idea across sessions) | `T-slug` | `T-framing` |

---

## Module IDs

These IDs come from the complete decks (revised 2026-09-14). They are fixed
now, so cross-session links work. An author can add a module with the next
free number. An author does not rename or reuse a listed ID. If a listed
module turns out wrong, keep the ID and record the change under "Open
questions" in the session file. The `### sNN-mNN` headings in the session
files and this table must list the same 57 modules.

| Session | Modules, with the PDF pages each one starts from |
|---|---|
| 1 | `s01-m01-seven-syscalls` (5–10) · `s01-m02-ports-and-queue` (8, 9, 11, 34) · `s01-m03-signals-sigpipe` (12–14) · `s01-m04-clients` (15–21) · `s01-m05-byte-order-dns` (22–24) · `s01-m06-many-clients` (28–33) · `s01-m07-see-the-bytes-tls` (25–27, 34–36) · `s01-m08-framing` (37–39) · `s01-m09-encodings` (40, 44) · `s01-m10-rpc` (45, 46) · `s01-m11-tlv-asn1` (41–43) |
| 2 | `s02-m01-layers` (6–9, 13) · `s02-m02-ss7` (10–12, 18, 19) · `s02-m03-sms-bytes` (14–16) · `s02-m04-tcp-lifecycle` (22–25) · `s02-m05-congestion-bbr` (21) · `s02-m06-udp-quic` (26–28) · `s02-m07-smtp-mime` (29–33) · `s02-m08-pop-imap` (34, 35) · `s02-m09-ftp-framing` (36–39) · `s02-m10-sms-delivery` (17) · `s02-m11-reliability-address` (20) |
| 3 | `s03-m01-threads-and-fork` (3–5) · `s03-m02-select` (6, 7) · `s03-m03-stacking-and-timeouts` (8, 9) · `s03-m04-cgi` (10–14) · `s03-m05-fastcgi-servlets` (15–18) · `s03-m06-stateless-servers` (20, 21) · `s03-m07-limits` (22–26) · `s03-m08-in-the-wild` (27–32) · `s03-m09-servlets` (19) |
| 4 | `s04-m01-history` (3–7) · `s04-m02-the-nginx-question` (8–10) · `s04-m03-process-model` (11, 13) · `s04-m04-event-loop` (12) · `s04-m05-select-vs-epoll` (14, 15) · `s04-m06-sendfile` (16, 17) · `s04-m07-reverse-proxy` (18) · `s04-m08-cache` (19–21) · `s04-m09-routing` (22, 23, 25) · `s04-m10-upstreams` (24) · `s04-m11-parser-phases` (30, 31) · `s04-m12-reading-the-source` (26–29, 33) · `s04-m13-fastcgi-records` (32) |
| 5 | `s05-m01-http10` (5–10) · `s05-m02-keepalive-host` (11, 12) · `s05-m03-validators-vary` (13, 14) · `s05-m04-range-chunked-extras` (15–17) · `s05-m05-rfcs-and-smuggling` (19–24) · `s05-m06-what-it-cost` (18, 25–29) · `s05-m07-http2-frames` (30–33) · `s05-m08-hpack-crime` (34, 35) · `s05-m09-http2-multiplexing` (36–39) · `s05-m10-quic-handshakes` (40–42, 44) · `s05-m11-quic-streams-fallback` (43, 45–47) · `s05-m12-assignment-prep` (3) · `s05-m13-project-studio` (4) |

The site order of Session 1 is m09, m11, m10. The slide numbers are a
starting map from the slide titles. Opening slides,
homework slides and closing "ideas to keep" slides go to the claim inventory
and the instructor questions, not to one module.

### Session boundaries

- **Sessions 1 and 2.** Session 1 owns the socket calls. The Session 2 slides
  on the server and client calls (4, 5) map to `s01-m01-seven-syscalls` and
  `s01-m04-clients`. Session 2 does not repeat them.
- **Sessions 1 and 3.** Session 1 previews fork, select and epoll in one
  slide each. Session 3 owns fork, threads and select.
- **Sessions 3 and 4.** Session 3 owns the cost of threads and fork, select
  and its 1024 ceiling, CGI, FastCGI, servlets, the four limits and Little's
  law. Session 4 owns epoll against select, stale events, and everything
  inside nginx. A Session 4 module lists Session 3 modules as prereqs and
  does not teach their content again. One exception: Session 4 slide 32
  walks through FastCGI again. `s04-m13-fastcgi-records` teaches the nginx
  side of it. Its record-format claims are `detail` rows that point to the
  Session 3 IDs, and it uses the Session 3 record annotator.
- **Sessions 4 and 5.** The decks of both sessions end with a preview of
  Session 6, "Where did the state go?". Record it under "Open questions".
  Do not build a module for it.

---

## The template for a session file

Use these headings, in this order. Use tables and bullets. Keep each session
file between 400 and 1,500 lines.

### 1. Header

- Title, approximate date, the instructor's own one-line subtitle.
- Sources used, with paths. Source gaps: what is missing and what it blocks.
- Confidence: high, medium or low, and why.

### 2. The session in one paragraph

Plain words. What problem the session answers, and why a working engineer
cares.

### 3. Claim inventory

A numbered table. One row for each fact, story, number or correction the
instructor gave.

| ID | Claim, in plain words | Source | Kind |
|---|---|---|---|

- Source is a pointer: `slides.txt slide 12`, `notes.md`, or
  `cn-at-scaler/lesson4/.../README.md §sendfile`.
- "Slide N" is page N of the PDF. It is not the number printed in the slide
  footer, which often differs. In `slides.txt`, a form feed separates pages.
  Print slide 12 with `awk 'BEGIN{RS="\f"} NR==12' slides.txt`.
- Kind is one of: `core` (must know), `detail`, `story` (history, names,
  dates), `correction` (a myth the instructor fixed), `measured` (a number
  from the instructor's own run).
- A `measured` number keeps its conditions. Write "150 ms RTT, loopback, the
  instructor's laptop", never a bare number.

### 4. Instructor questions

Every "ask the class", thought experiment, homework item and assignment. These
are the best guide to quiz and exam questions. Give each one a model answer
outline, or mark it `answer: needs complete slides`. For graded work, write
`Graded. No model answer.`

### 5. Modules

One module is one lesson page: 15 to 25 minutes, one big idea. For each
module, give all of these fields.

- **ID, title, minutes, big idea** (one sentence), **covers** (claim IDs),
  **prereqs** (module IDs), **threads** (thread IDs). Write `Threads: none.`
  when no thread fits. Put a candidate thread under "Open questions".
- **Pretest.** Two or three questions the learner answers before the lesson.
  Give the answers.
- **Rung 1, the picture.** The analogy or everyday story, for a 10-year-old.
  Then **where the analogy breaks**, in one or two lines.
- **Rung 2, how it works.** The mechanism as short numbered steps, plain words.
- **Rung 3, the real thing.** The syscalls, the bytes, the RFC text, the code
  lines. Point at the source file and line or slide.
- **Rung 4, exam depth.** Trade-offs, the rejected alternatives, "what if"
  questions, with model answers.
- **Misconceptions.** One bullet each, in this form:
  `- S0N-Mnn: "the wrong belief." Wrong: why. Distractor in check N.` The
  verifier reads only this form. A bullet that names an earlier ID again,
  such as `- S05-M03 appears again in check 3.`, is a reference.
- **Diagrams.** What each diagram shows, static or step-by-step, and the
  layers or actors it uses.
- **Interactives.** Name, inputs, what the learner sees, what the learner
  discovers. Priority `P1` (build with the module) or `P2` (later).
- **Predict, observe, explain.** A command from the instructor repo, the
  question to predict, and where the real captured output comes from.
- **Worked example, faded example, your turn.** One full solved problem, one
  with blanks, one for the learner. Bytes, numbers or traces, not essays.
- **Checks.** Three to six questions. Type (`mcq`, `multi`, `numeric`,
  `order`, `bytes`, `predict`, `spot-bug`, `recall`), the answer, each
  distractor with its misconception ID, and a one-line feedback. An `mcq` or
  `predict` check has 3 or 4 options, so it has 2 or 3 distractors.
- **Review cards.** Three to eight spaced-repetition prompts. One fact per
  card. The answer is short and exact.
- **Lab (optional).** Exact commands to run on Linux, what to look at, and the
  expected result.

The checks and cards in a session file are the core set. They carry the
misconceptions and the facts that matter most, and they already meet the
counts in `docs/PLAN.md` section 5. The module packet writes the word card,
the segments, "Explain it back" and the exam prompts from the rungs. Section
4 of `docs/PLAN.md` gives the source of each block.

### 6. Beyond the slides

Facts the lessons need for correctness that the sources do not state. Each one
gets an authoritative reference: an RFC section, a man page, or official docs.
Lesson pages show these with a "beyond the slides" badge.

### 7. Open questions

Things to check when the complete slides arrive.

---

## Threads

A thread is an idea the instructor repeats across sessions. The site shows
each thread on its own page, with links to every module that uses it. Thread
questions are the best preparation for "design" and "compare" exam questions.

| ID | The idea | First seen |
|---|---|---|
| `T-framing` | TCP gives a byte stream. Every protocol must say where a message ends: by length or by delimiter. | S1 |
| `T-setup-off-path` | Pay the expensive setup one time, not on each request: prefork, servlets, FastCGI, pools, keep-alive, 0-RTT. | S1 |
| `T-encapsulation` | One layer's header is the next layer's body. | S1 |
| `T-alphabets` | Every channel has an alphabet. Encodings (base64, GSM 7-bit, hex) let bytes cross it. | S1 |
| `T-skip-unknown` | A receiver skips a field it does not know. Length prefixes make that possible, and it leaves room for version 2. | S1 |
| `T-network-not-function` | A remote call can fail halfway, time out when the work may or may not have run, and run twice. | S1 |
| `T-round-trip-tax` | Each round trip costs latency that more bandwidth cannot remove. | S2 |
| `T-watch-list` | select is O(watched), epoll is O(active). The difference is who owns the watch list. | S1 |
| `T-littles-law` | concurrency = throughput × latency. You cannot configure your way past it. | S3 |
| `T-law-or-habit` | Each design answers a constraint. When the constraint goes away, the design becomes a habit (accept_mutex, the 2-connection rule). | S3 |
| `T-honest-benchmarks` | A benchmark that does not model the bottleneck measures the wrong thing. Loopback lies. | S1 |
| `T-fix-causes-next` | Each fix creates the next problem: keep-alive, pipelining, HOL blocking, HTTP/2, TCP HOL, QUIC. | S2 |
| `T-name-in-message` | Put the name in the message: Host, SNI, `:authority`, routing keys. | S1 |
| `T-deployed-reality` | A standard loses to deployed clients: 302 and 307, six connections, 418. | S1 |
| `T-where-state-goes` | HTTP is stateless, so the state moves somewhere else. That place is what you scale next. | S2 |

Add a thread only when a second session repeats the idea.

---

## Rules for every session file

1. Teach what the instructor taught. Every module lists the claim IDs it
   covers. Every `core` claim appears in at least one module.
2. Mark every fact that is not in the sources as beyond the slides, with a
   reference.
3. Never write a solution to graded work. Rule 4 in `CLAUDE.md` is the one
   text of this rule.
4. Quote the slides only in short phrases. Explain in original words.
5. Explain a mechanism in plain words first. A code identifier is evidence,
   not an explanation.
