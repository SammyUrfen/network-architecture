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

- He follows connected story paragraphs better than tables. Diagrams,
  animations and interactions always help him (pilot feedback, 2026-09-14).

The research supports one mechanism for this mix of "novice here, expert
there": **the expertise reversal effect**. Supports that help a novice slow an
expert. So the plain-words supports sit in boxes that he can close, and the
exam depth sits in a box that he can open. See rules 6 and 7.

---

## 2. The lesson contract, version 2

Version 2 comes from Bibek's pilot feedback of 2026-09-14 (`docs/feedback.md`).
The pilot pages gave facts part by part, but they did not tell the story that
joins the parts. They also gave no visual weight to the ideas that matter most.

A **module** is one lesson page, 15 to 25 minutes, with one big idea. A module
has three to five **parts**. A part is about 5 minutes of reading and doing.
In the MDX, a part is a `<Segment>`.

The page frame shows the title, the minutes, the outline and the progress in
the sidebar. The MDX starts at block 1. Build every module in this order.

| # | Block | What the learner sees | Why (section 4) |
|---|---|---|---|
| 1 | Opening story | One or two short paragraphs: the question that the lesson answers, why it matters, and what the reader already knows. Then "The path through this lesson": one sentence for each part, told as one story. | Signaling |
| 2 | Pretest | 2 or 3 "guess first" questions on the key ideas. A line says that wrong guesses are normal. A confidence choice on each: sure, think so, guessing. | Prequestions, confidence |
| 3 | Word card | 3 to 6 terms with one-line meanings, before the first part | Pre-training |
| 4 | Parts | Each part opens with "In this part", follows the four rungs below, has one visual, and ends with 1 or 2 checks. A module has 3 to 6 checks. | Segmenting, signaling, retrieval |
| 5 | Predict, observe, explain | At least one per module. The learner commits a prediction before the result appears. | POE |
| 6 | Worked examples | A fading sequence of three: a full solution, the same problem with blanks, a raw problem | Worked examples, fading |
| 7 | Explain it back | One "why" box. The learner types an answer, then sees the model answer. | Self-explanation |
| 8 | How it shows up in a question | 2 or 3 exam-style prompts with model answers, at rung 4 depth | Transfer |
| 9 | Exit quiz | The pretest questions again, now graded, with feedback and no confidence step. Each answer links to the place where the page taught it. | Prequestions, retrieval |
| 10 | Cards added | The review cards of the module join the review queue. The page says how many. | Spacing |

### The four rungs inside a part

Concreteness fading: start concrete, then a diagram, then the real thing.

| Rung | Label on the page | Content |
|---|---|---|
| 1 | The picture | A story paragraph about a scene that a 10-year-old knows from real life. The next sentences map each part of the scene to a part of the real thing. One sentence says where the picture breaks. In an open box. |
| 2 | How it works | The mechanism in connected sentences, with the visual of the part next to it. A numbered list only for a true sequence of actions. |
| 3 | The real thing | The syscalls, the bytes, the RFC text, the instructor's code. The prose says what each one is before it shows it. Each byte field has its note next to its bytes. |
| 4 | Exam depth | Trade-offs, rejected alternatives, "what if" questions. In a closed box. |

### Visible weight

A reader must see which ideas matter most. Four levels of weight do that.

| Weight | Block | Use |
|---|---|---|
| Must know | `KeyIdea`, with a short title | 2 to 4 for each lesson. A quiz item points to one of them, or to a part. |
| Explains | normal prose | The story that joins the key ideas |
| Depth | a closed box: exam depth, "The story" | For the exam, and for the reader who wants more |
| Not in the slides | `Beyond`, with a badge and a reference | A fact that the instructor did not teach |

### A sample: the opening of `s01-m08-framing`

This sample sets the voice. Lesson pages match its sentence length and its
order.

**Opening story.**

> Your program sends "hello" and then "world" over TCP. The other program can
> get "helloworld" in one read, or "hel" and then "loworld". So how does it
> know where one message ends? This lesson answers that question.
>
> Without an answer, a server mixes two requests into one, or it waits for
> bytes that never come. The calculator assignment turns on this idea, and so
> does the binary HTTP project. From the lesson "Seven system calls: the whole
> of a TCP server", you know that a program sends bytes with `write()` and
> gets bytes with `read()`.
>
> **The path through this lesson.** Part 1 shows that TCP keeps every byte in
> order but forgets where each message stopped. Part 2 gives two different
> answers to that problem: make every message the same size, or put a marker
> after each message. Part 3 gives the answer that most modern protocols use:
> send the length before the bytes.

**In this part, for Part 2.**

> Part 1 left one question: where does a message end? This part gives two
> different answers to it, a fixed length and a delimiter. Each answer has a
> cost, and Part 3 shows how most protocols avoid those costs.

**The picture, for Part 1.**

> Your friend makes two bead bracelets for you and sends them in a thin tube.
> To fit the tube, your friend puts all the beads on one long string, one bead
> after the other. At home, you take the beads from the string a handful at a
> time. One handful can hold the last beads of the first bracelet and the
> first beads of the second. Nothing on the string shows where the first
> bracelet stopped.
>
> In TCP, each bead is a byte, and each bracelet is a message. The long string
> is the connection. Your friend is the program that sends, and each call to
> `write()` adds beads to the string. You are the program that receives, and
> each call to `read()` takes one handful. A read can return any number of
> bytes, from 1 up to the size of its buffer. So the two programs must agree
> on a rule before they start, and Part 2 gives the first two rules.
>
> Where this breaks: a real string can snap and drop beads, but TCP never
> loses a byte and never changes their order.

This picture passes the 10-year-old test. A child knows beads, a string and a
handful. Each part of the scene has one match in TCP. The pilot used "You pour
the pages of a letter into a water pipe." Nobody pours paper into a pipe, so a
child has no scene to picture. That line fails the test.

**A key idea, for Part 1.** Title: "TCP keeps the order, not the edges". Body:
"TCP delivers every byte in order. It keeps no mark where one write stopped, so
the program must find where each message ends."

### Rules

**Story and structure**

1. **One big idea per module.** If a module needs two big ideas, split it.
2. **Open with the story.** Say the question, what breaks without the answer,
   and which later lesson, assignment or exam uses it. The prereqs and the
   threads are one plain sentence with lesson titles. Never show a raw ID
   such as `s01-m01-seven-syscalls` or `T-framing` to the reader.
3. **Every part opens with "In this part".** One to three sentences: what the
   reader learns, why it matters, and how it follows from the part before.
4. **Story paragraphs, not tables.** Prose is connected sentences of 25 words
   or fewer. A table is only for a true side-by-side comparison. A numbered
   list is only for a true sequence of actions. The picture is a paragraph.
5. **The 10-year-old test for pictures.** The analogy is a scene that a
   10-year-old knows from real life. The sentences after it map each part of
   the scene to a part of the real thing. One sentence says where it breaks.
   If the break is serious, add a second picture that covers the gap.

**Weight**

6. **Visible weight.** A `KeyIdea` block marks each must-know idea, 2 to 4 for
   each lesson. Normal prose explains. Closed boxes hold depth. `Beyond` holds
   facts that are not in the slides, with a badge and a reference link.
7. **Boxes, not modes.** Rung 1 and the word card sit in an open `<details>`
   box. Rung 4 sits in a closed one. The boxes need no JavaScript and work
   with a keyboard.
8. **Stories go in a closed box.** The instructor's history and names are in a
   "The story" box, closed by default. Quiz items still test the stories,
   because the post-class quizzes can ask about them.

**Questions**

9. **Every question says where it was taught.** Each quiz item has
   `taughtIn`: the `id` of a `KeyIdea`, or the anchor of a part. After an
   answer, the feedback shows "Taught in: Part 2, <title>" as a link. Verify
   rule 10 checks that each anchor exists (`docs/PLAN.md` section 5).
10. **Ask only what the page taught before the question.** No question needs
    code, a command, a tool or its output unless the page taught it first. A
    predict question describes its setup in plain words. The pretest comes
    before the lesson, so it uses plain words only.
11. **No questions about the documents.** Never ask which slide or deck says
    what. A slide number is a citation only.
12. **Checks give feedback on every option.** Each wrong option is one named
    misconception from the curriculum file, with its own one-line feedback.
    Use 3 or 4 options. No "all of the above". No trick questions. Aim for
    about 80% correct on first try.
13. **"Sure but wrong" is loud.** The pretest and the checks keep the
    confidence choice. When the learner picks "sure" on a check and misses,
    the page says so plainly, and the item returns to the review queue the
    next day. The exit quiz has no confidence step.
14. **Predictions lock.** A predict block hides the result until the learner
    commits an answer. Then it asks why the guess was right or wrong.

**Visuals and labs**

15. **Every part has a visual.** On a wide screen, it sits in the visual rail
    next to the prose. It is a diagram that steps with the scroll, an
    animation with play, pause, step and speed, or a simulation. Labels sit on
    the visual, not in a caption. A simulation has a "what this simplifies"
    line.
16. **The learner drives the motion.** No animation plays before the learner
    presses play or scrolls to a step. A scroll step is a learner action, so it
    can play the motion of that one step. Under `prefers-reduced-motion`, a step changes the picture
    with no motion. Every control works with the keyboard. Build animations by
    hand with SVG, CSS and the Web Animations API. No animation library.
17. **Labs say where everything comes from.** Give the instructor repo URL
    (https://github.com/jitendraag/cn-at-scaler), the clone command, the
    folder, what the program does, and what the reader should see. A long
    command line wraps, or scrolls with a visible scroll bar.
18. **Productive failure only for design.** A "try to invent it first" block
    is allowed for design questions (framing, the binary protocol). It always
    ends with the full explanation. Never use it for facts.

**Words and gates**

19. **Plain words first.** A code identifier is evidence after the
    explanation, not the explanation. Numbers keep units and conditions.
20. **No graded solutions.** Rule 4 in `CLAUDE.md` is the one text of this
    rule.
21. **Three gates for lesson prose.** First the STE lint at 2.5 per 100 words.
    Then the `remove-ai-marks` skill. Then the learner review in
    `docs/reviews/learner-review.md`. The packet fixes every finding.

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
| Retrieval practice | Strong. g = 0.50 overall, 0.73 with feedback (Rowland 2014). g = 0.61 (Adesope 2017). A mix of MCQ and short answer worked best. | Checks after each part, always with feedback | [Rowland](https://pubmed.ncbi.nlm.nih.gov/25150680/), [Adesope](https://journals.sagepub.com/doi/10.3102/0034654316689306) |
| Tests between segments | A 21-minute lecture in 4 tested segments: half the mind-wandering, 90% final score vs 76% restudy (Szpunar 2013) | A check about every 5 minutes | [Szpunar](https://www.pnas.org/doi/10.1073/pnas.1221764110) |
| Spacing | Strong. The best gap is 20–40% of a one-week retention interval (Cepeda 2008). Growing vs equal gaps: g = 0.03 (Latimier 2021). | Review queue with fixed boxes, tied to exam dates | [Cepeda](https://journals.sagepub.com/doi/10.1111/j.1467-9280.2008.02209.x), [Latimier](https://eric.ed.gov/?id=EJ1310148) |
| Interleaving | Moderate. g = 0.42 overall, not significant for expository text (Brunmair 2019) | Mix sessions in review and practice only | [Brunmair](https://www.psychologie.uni-wuerzburg.de/fileadmin/06020400/2019/Brunmair_Richter_in_press__2019_META-ANALYSIS_OF_INTERLEAVED_LEARNING.pdf) |
| Prequestions | g = 0.54 for asked content, 0.04 for content not asked (St. Hilaire 2023) | Pretest on the core ideas only | [St. Hilaire](https://link.springer.com/article/10.3758/s13423-023-02353-8) |
| Worked examples and fading | g = 0.48 for novices (Barbieri 2023). Hiding the last step first saves time (Renkl and Atkinson). | Fading sequence of three examples | [Barbieri](https://eric.ed.gov/?id=EJ1364058), [Renkl](https://eric.ed.gov/?id=EJ732331) |
| Self-explanation | g = 0.55 over 64 reports (Bisra 2018) | "Explain it back" boxes | [Bisra](https://eric.ed.gov/?id=EJ1186664) |
| Multimedia principles | Median d: coherence 0.86, signaling 0.70, spatial contiguity 0.82, segmenting 0.67, pre-training 0.78. Mostly one lab, so optimistic. Strongest for novices. | Collapsed extras, the outline, the opening story, "In this part", `KeyIdea` blocks, the visual rail next to the prose, labels on diagrams, word card | [Mayer 2021 summary](https://www.unh.edu/teaching-learning-resource-hub/sites/default/files/media/2023-06/itow-research-based-principles-for-designing-multimedia-instruction-mayer.pdf) |
| Concreteness fading | Systematic review, no pooled effect (Fyfe 2014) | The four rungs | [Fyfe](https://link.springer.com/article/10.1007/s10648-014-9249-3) |
| Analogy failure | One analogy leaves lasting misconceptions, even with a warning (Spiro 1989). Strong teachers keep both sides visible (Richland 2007). | A picture paragraph that maps each part of the scene, "where this breaks", a second picture | [Richland](https://www.science.org/doi/10.1126/science.1142103) |
| Predict, observe, explain | Watching a demo without a prediction gave no gain. Predicting first gave a significant gain (Crouch 2004). | Prediction locks | [Crouch](https://works.swarthmore.edu/fac-physics/203/) |
| Productive failure | d = 0.36, up to 0.58 with close design (Sinha and Kapur 2021). Minimal guidance fails for novices (Kirschner 2006). | Design questions only, always followed by instruction | [Sinha](https://journals.sagepub.com/doi/10.3102/00346543211019105) |
| Misconception distractors | Wrong options built from known misconceptions expose them (Sadler 1998). Three options are optimal (Rodriguez 2005). Wrong options without feedback create false knowledge (Roediger and Marsh 2005). | 3 or 4 options, each a named misconception, feedback on each | [Sadler](https://users.nber.org/~sewp/events/2004.05.28/Sadler_PsychometricModels.pdf), [Rodriguez](https://eric.ed.gov/?id=EJ718250) |
| Confidence | High-confidence errors are the easiest to correct after feedback (Metcalfe 2017). A plain confidence rating did not raise scores. | Sure / think so / guessing in the pretest and the checks, to find misconceptions, not to score | [Metcalfe](https://www.annualreviews.org/content/journals/10.1146/annurev-psych-010416-044022) |
| Expertise reversal | Supports that help novices load experts (Kalyuga 2003). A quick first-step test tracks expertise (Kalyuga and Sweller 2004). | Open and closed boxes for each rung | [Kalyuga](https://www.tandfonline.com/doi/abs/10.1207/S15326985EP3801_4) |
| Animation | Animation beat static graphics only when it carried more information or interaction (Tversky 2002) | Steppers, scroll-stepped diagrams and animations that the learner controls, no autoplay | [Tversky](https://dl.acm.org/doi/10.1006/ijhc.2002.1017) |
| Mnemonic medium | 112 prompts in a 4-hour essay. Shown retention per card grew from about 2 days to about 54 days after six reviews, for about 95 minutes of total review. | About one card for each key idea, 3 to 8 per module | [Quantum Country report](https://numinous.productions/ttft/), [prompt guide](https://andymatuschak.org/prompts/) |
| Gamification | Small positive effects overall (Sailer 2020). Badges and a leaderboard lowered motivation and exam scores over 16 weeks (Hanus 2015). A broken streak lowers use, and repair softens it (Silverman 2023). | Mastery map, no badges, repairable streak only | [Sailer](https://eric.ed.gov/?id=EJ1245270), [Hanus](https://doi.org/10.1016/j.compedu.2014.08.019) |

**Not verified:** no study sets a best section length for text self-study.
The 5-minute segment is an inference from the video and tested-segment
studies above.

**Not from a study:** the 10-year-old test, the story paragraphs and the
`taughtIn` link come from Bibek's pilot feedback of 2026-09-14. No study in
this table tests them directly.
