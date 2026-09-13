# How the site teaches

This file turns learning research into rules for a lesson page. Every rule has
a reason and a source. A later session that builds a lesson page obeys the
**lesson contract** in section 2. It does not need to read the research in
section 4.

The research digest behind this file came from a web research pass on
2026-09-13. Effect sizes are Hedges' g or Cohen's d: 0.2 is small, 0.5 is
medium, 0.8 is large.

---

## 1. The learner

- Bibek could not follow the live lectures. He needs a first contact that a
  10-year-old can follow.
- He also has real systems experience (C++ database engine, raw-socket HTTP
  server, eBPF). The site must not slow him down on the parts he knows.
- He reads fast and loses focus on long build-ups. Lead with the point. Keep
  each screen to one idea. Show progress.
- The course grades him on post-class quizzes (30%), a project (30%), an
  assignment (20%) and an end-term exam (20%). The site prepares him for all
  four. It never does the graded work for him.

The research supports one mechanism for this mix of "novice here, expert
there": **the expertise reversal effect**. Supports that help a novice slow an
expert. So the plain-words supports sit in boxes that he can close, and the
exam depth sits in a box that he can open. See rule 3.

---

## 2. The lesson contract

A **module** is one lesson page, 15 to 25 minutes, with one big idea. A module
has three to five **segments**. A segment is about 5 minutes of reading and
doing. Build every module in this order.

| # | Block | What the learner sees | Why (section 4) |
|---|---|---|---|
| 1 | Header | Title, minutes, the big idea in one sentence, a progress bar, an outline of the segments | Signaling |
| 2 | Pretest | 2 or 3 "guess first" questions on the core ideas. A line says wrong guesses are normal. A confidence choice on each: sure, think so, guessing. | Prequestions, confidence |
| 3 | Word card | 3 to 6 terms with one-line meanings, before the first segment | Pre-training |
| 4 | Segments | Each segment follows the four rungs below, then ends with 1 or 2 checks. A module has 3 to 6 checks. | Segmenting, retrieval |
| 5 | Predict, observe, explain | At least one per module. The learner commits a prediction before the result appears. | POE |
| 6 | Worked examples | A fading sequence of three: a full solution, the same problem with blanks, a raw problem | Worked examples, fading |
| 7 | Explain it back | One "why" box. The learner types an answer, then sees the model answer. | Self-explanation |
| 8 | How it shows up in a question | 2 or 3 exam-style prompts with model answers, at rung 4 depth | Transfer |
| 9 | Exit quiz | The 2 or 3 pretest questions again, now graded, with feedback. The learner sees what changed. | Prequestions, retrieval |
| 10 | Cards added | The module's review cards join the review queue. The page says how many. | Spacing |

### The four rungs inside a segment

Concreteness fading: start concrete, then a diagram, then the real thing.

| Rung | Label on the page | Content |
|---|---|---|
| 1 | The picture | An everyday analogy or story, in two columns: the analogy on the left, the real mechanism on the right. A "where this breaks" line under it. In an open box. |
| 2 | How it works | The mechanism as short numbered steps, with a diagram. Labels sit on the diagram, not in a caption. |
| 3 | The real thing | The syscalls, the bytes, the RFC text, the instructor's code. Each byte field is annotated next to its bytes. |
| 4 | Exam depth | Trade-offs, rejected alternatives, "what if" questions. In a closed box. |

### A sample: the four rungs for "TCP is a byte stream"

This sample sets the voice. Lesson pages match its sentence length and its
order.

**Rung 1, the picture.**

| The picture | The real thing |
|---|---|
| You pour the words of a letter into a water pipe. | A program calls `write()` on a TCP socket. |
| Your friend gets one long flow of words. The pipe does not keep the pages apart. | The receiver calls `read()` and gets bytes. TCP does not keep the gaps between writes. |
| So you agree on a rule. Every letter has 100 words. Or a letter ends at the word STOP. Or the first word says how many words follow. | The application picks a framing rule: fixed length, delimiter, or length prefix. |

Where this breaks: a real pipe can spill or mix water. TCP never loses,
reorders or mixes bytes. It only forgets where one write stopped.

**Rung 2, how it works.**

1. The sender writes `hello`, then writes `world`.
2. TCP puts the 10 bytes in its send buffer. It can send them in one packet
   or in three.
3. The receiver reads. It can get `hel`, then `loworld`.
4. Nothing in TCP marks the point between the two writes.
5. So the application adds the marker.

**Rung 3, the real thing.** An HTTP header block ends at an empty line,
`\r\n\r\n`: a delimiter. The body length is `Content-Length: 219`: a length
prefix. In a binary protocol, `00 05 68 65 6c 6c 6f` is a two-byte length (5)
and then `hello`. Session 1, slide 39 lists the three rules.

**Rung 4, exam depth.** Session 1 gives three framing rules. Session 5 quotes
Session 2: "length or delimiter, there is no third option". Both hold, because
a fixed length is a length that both sides agreed on before the connection
started. Each rule has a cost. A delimiter must be escaped when it appears in
the data, as SMTP does with a leading dot. A length prefix needs the length
before the first byte goes out. Chunked encoding fixes that by nesting both
rules. A fixed length wastes padding and can never change.

### Rules

1. **One big idea per module.** If a module needs two big ideas, split it.
2. **Every analogy names where it breaks.** If the break is serious, patch it
   with a second analogy. Example: "TCP is a phone call" hides that TCP keeps
   no message boundaries. Patch: "TCP is a water pipe."
3. **Boxes, not modes.** Rung 1 and the word card sit in an open
   `<details>` box. Rung 4 sits in a closed one. A learner who knows the idea
   closes rung 1. The boxes need no JavaScript and work with a keyboard. Add
   a global switch only if the pilot shows that Bibek wants one.
4. **Checks give feedback on every option.** Each wrong option is one named
   misconception from the curriculum file, with its own one-line feedback.
   Use 3 or 4 options. No "all of the above". No trick questions. Aim for
   about 80% correct on first try.
5. **"Sure but wrong" is loud.** When the learner picks "sure" and misses,
   the page says so plainly and the item returns to the review queue the next
   day.
6. **Predictions lock.** A predict block hides the result until the learner
   commits an answer. Then it asks why the guess was right or wrong.
7. **Motion only with steps.** An animation is a stepper with a "next" button
   and a prediction. No autoplay. Respect `prefers-reduced-motion`.
8. **Stories go in a collapsed box.** The instructor's history and names are
   in a "The story" box, closed by default. Quiz items still test the stories,
   because the post-class quizzes can ask about them.
9. **Productive failure only for design.** A "try to invent it first" block
   is allowed for design questions (framing, the binary protocol). It always
   ends with the full explanation. Never use it for facts.
10. **Beyond the slides has a badge.** Content that the instructor did not
    teach shows a "beyond the slides" badge and a reference link.
11. **Plain words first.** A code identifier is evidence after the
    explanation, not the explanation. Numbers keep units and conditions.
12. **No graded solutions.** Rule 4 in `CLAUDE.md` is the one text of this
    rule.

### Review cards

The site uses the "mnemonic medium" from Quantum Country: short prompts inside
the lesson that return on a schedule.

- About one card for each key idea. A module has 3 to 8 cards.
- **Focused:** one detail. **Precise:** one right answer. **Consistent:** the
  same answer each time. **Tractable:** answerable almost always.
  **Effortful:** real recall, not a guess from the wording.
- No yes/no prompts. No fill-in-the-blank lines copied from the lesson.
- For a concept, ask about causes, effects, differences and why it matters.
  For a procedure, ask about conditions and transitions: "When does the
  parser switch from headers to body?"

### Review queue and practice

- **Schedule.** Box intervals of 1, 3, 7, 14 and 30 days. A right answer moves
  a card up one box. A wrong answer moves it to box 1. Fixed intervals are
  enough, because growing gaps showed no advantage over equal gaps.
- **Exam dates.** `assessments.yaml` holds the known dates. When a date is
  known, a card is due at least one time in the 7 days before an exam that
  covers its session.
- **Interleaving in review, not in first contact.** Checks inside a module
  stay on the module topic. The review queue and the practice page mix
  sessions and ask "which one fits this case" questions: TCP, UDP or QUIC.
  select or epoll. HTTP/1.1, 2 or 3.
- **Generators.** For numeric skills, a generator makes a new problem each
  time with a reveal button: byte order, base64 length, GSM 7-bit packing,
  FTP PASV ports, Little's law, select cost, smooth weighted round robin,
  HTTP/2 frame headers, chunk sizes in hex.

### Progress

- A mastery map: modules done, cards due today, cards retained (box 4 or 5).
- No points, no badges, no leaderboards. Badges and leaderboards lowered
  motivation and exam scores in a 16-week course study.
- If a streak appears, it counts review days and has a repair action.
- Export and import of progress as a JSON file, because localStorage is
  lost when the browser data is cleared.

---

## 3. Pages that do this well

Copy one idea from each. Do not copy content.

| Page | The idea to copy | Use it for |
|---|---|---|
| [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/) and [QUIC](https://quic.xargs.org/) | Every byte of a real exchange in hex, with a note per field | `ByteView`, HTTP/2 frames, FastCGI records, project hexdump practice |
| [Kurose-Ross interactive problems](https://gaia.cs.umass.edu/kurose_ross/interactive/) | A generator makes endless new problems, each with a reveal | Generators |
| [Sam Rose, Load Balancing](https://samwho.dev/load-balancing/) | Each section shows how the last algorithm fails, then fixes it, then a playground | Session 4 upstreams, Session 5 HTTP versions, Session 8 |
| [Learn Git Branching](https://learngitbranching.js.org/) | Each action updates a live picture of the state | Syscall theater, event loop stepper |
| [Bartosz Ciechanowski, Exposing Floating Point](https://ciechanow.ski/exposing-floating-point/) | Value, then bits, then layout, with a bit inspector | Encodings: BCD, base64, GSM 7-bit, TLV |
| [Josh Comeau, Flexbox guide](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/) | Teach the algorithm, not a list of options. One widget per idea. | nginx location matching |
| [Nicky Case, How To Remember Anything Forever-ish](https://ncase.me/remember/) | Spaced cards inside the page that teaches | Review cards |
| [High Performance Browser Networking](https://hpbn.co/) | Each protocol chapter ends with a checklist | "How it shows up in a question" |
| [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/) | Complete code you can build, in a casual voice | Labs |
| [Julia Evans, Networking! ACK!](https://wizardzines.com/zines/networking/) | One concept per page, hand-drawn | Rung 1 pictures |

---

## 4. The evidence

| Principle | Evidence | Design move | Source |
|---|---|---|---|
| Retrieval practice | Strong. g = 0.50 overall, 0.73 with feedback (Rowland 2014). g = 0.61 (Adesope 2017). A mix of MCQ and short answer worked best. | Checks after each segment, always with feedback | [Rowland](https://pubmed.ncbi.nlm.nih.gov/25150680/), [Adesope](https://journals.sagepub.com/doi/10.3102/0034654316689306) |
| Tests between segments | A 21-minute lecture in 4 tested segments: half the mind-wandering, 90% final score vs 76% restudy (Szpunar 2013) | A check about every 5 minutes | [Szpunar](https://www.pnas.org/doi/10.1073/pnas.1221764110) |
| Spacing | Strong. The best gap is 20–40% of a one-week retention interval (Cepeda 2008). Growing vs equal gaps: g = 0.03 (Latimier 2021). | Review queue with fixed boxes, tied to exam dates | [Cepeda](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2008.02209.x), [Latimier](https://eric.ed.gov/?id=EJ1310148) |
| Interleaving | Moderate. g = 0.42 overall, not significant for expository text (Brunmair 2019) | Mix sessions in review and practice only | [Brunmair](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf) |
| Prequestions | g = 0.54 for asked content, 0.04 for content not asked (St. Hilaire 2023) | Pretest on the core ideas only | [St. Hilaire](https://link.springer.com/article/10.3758/s13423-023-02353-8) |
| Worked examples and fading | g = 0.48 for novices (Barbieri 2023). Hiding the last step first saves time (Renkl and Atkinson). | Fading sequence of three examples | [Barbieri](https://eric.ed.gov/?id=EJ1364058), [Renkl](https://eric.ed.gov/?id=EJ732331) |
| Self-explanation | g = 0.55 over 64 reports (Bisra 2018) | "Explain it back" boxes | [Bisra](https://eric.ed.gov/?id=EJ1186664) |
| Multimedia principles | Median d: coherence 0.86, signaling 0.70, spatial contiguity 0.82, segmenting 0.67, pre-training 0.78. Mostly one lab, so optimistic. Strongest for novices. | Collapsed extras, outline, labels on diagrams, steppers, word card | [Mayer 2021 summary](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-research-based-principles-for-designing-multimedia-instruction-mayer.pdf) |
| Concreteness fading | Systematic review, no pooled effect (Fyfe 2014) | The four rungs | [Fyfe](https://link.springer.com/article/10.1007/s10648-014-9249-3) |
| Analogy failure | One analogy leaves lasting misconceptions, even with a warning (Spiro 1989). Strong teachers keep both sides visible (Richland 2007). | Two columns, "where this breaks", a second analogy | [Richland](https://www.science.org/doi/10.1126/science.1142103) |
| Predict, observe, explain | Watching a demo without a prediction gave no gain. Predicting first gave a significant gain (Crouch 2004). | Prediction locks | [Crouch](https://works.swarthmore.edu/fac-physics/203/) |
| Productive failure | d = 0.36, up to 0.58 with close design (Sinha and Kapur 2021). Minimal guidance fails for novices (Kirschner 2006). | Design questions only, always followed by instruction | [Sinha](https://journals.sagepub.com/doi/10.3102/00346543211019105) |
| Misconception distractors | Wrong options built from known misconceptions expose them (Sadler 1998). Three options are optimal (Rodriguez 2005). Wrong options without feedback create false knowledge (Roediger and Marsh 2005). | 3 or 4 options, each a named misconception, feedback on each | [Sadler](https://users.nber.org/~sewp/events/2004.05.28/Sadler_PsychometricModels.pdf), [Rodriguez](https://eric.ed.gov/?id=EJ718250) |
| Confidence | High-confidence errors are the easiest to correct after feedback (Metcalfe 2017). A plain confidence rating did not raise scores. | Sure / think so / guessing, to find misconceptions, not to score | [Metcalfe](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010416-044022) |
| Expertise reversal | Supports that help novices load experts (Kalyuga 2003). A quick first-step test tracks expertise (Kalyuga and Sweller 2004). | Open and closed boxes for each rung | [Kalyuga](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_4) |
| Animation | Animation beat static graphics only when it carried more information or interaction (Tversky 2002) | Steppers with predictions, no autoplay | [Tversky](https://dl.acm.org/doi/10.1006/ijhc.2002.1017) |
| Mnemonic medium | 112 prompts in a 4-hour essay. Shown retention per card grew from about 2 days to about 54 days after six reviews, for about 95 minutes of total review. | About one card for each key idea, 3 to 8 per module | [Quantum Country report](https://numinous.productions/ttft/), [prompt guide](https://andymatuschak.org/prompts/) |
| Gamification | Small positive effects overall (Sailer 2020). Badges and a leaderboard lowered motivation and exam scores over 16 weeks (Hanus 2015). A broken streak lowers use, and repair softens it (Silverman 2023). | Mastery map, no badges, repairable streak only | [Sailer](https://eric.ed.gov/?id=EJ1245270), [Hanus](https://doi.org/10.1016/j.compedu.2014.08.019) |

**Not verified:** no study sets a best section length for text self-study.
The 5-minute segment is an inference from the video and tested-segment
studies above.
