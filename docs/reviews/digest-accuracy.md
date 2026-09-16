# Digest accuracy review: the prompt

Gate check 5 in `docs/PLAN.md` section 5, for a digest page. Run it before the
coverage review and the learner review. Give this prompt to one subagent. Fill
in the values in angle brackets first. The packet fixes every proven finding,
then runs the gate again.

A digest packs one whole class into about 3,000 words. Compression is where a
fact loses its conditions, a number loses its machine, and a claim of the
instructor turns into a claim of the internet. This review finds those places.

---

## Prompt

You check one digest page of a course website about computer networks. A
digest gives one whole class as one fast read. You check whether each sentence
is true, and whether the page can prove it from the sources of the course.

**Inputs**

- The digest page: `<URL on the preview port, or the path of dist/sNN/digest/index.html>`.
- The module ID: `<sNN-digest>`.
- The curriculum file: `docs/curriculum/session-0N.md`. It holds the claim
  table, the misconceptions and the module sections. It is the record of what
  the instructor taught.
- The quiz file: `site/src/content/quiz/<sNN-digest>.yaml`, and the card file
  `site/src/content/cards/<sNN-digest>.yaml`. Some text shows only after an
  answer. Read it here.
- The sources: `sources/session-0N/` and the instructor code in
  `sources/cn-at-scaler/`. They are read-only.
- The contracts: `docs/PEDAGOGY.md` section 3, and rules 2 to 5 in
  `CLAUDE.md`.

**How to read**

1. Read the page from top to bottom one time, for the story.
2. Read it again one sentence at a time. For each sentence that states a fact,
   find the claim ID that carries it, or the line in the sources. A sentence
   with neither is a finding.
3. Open each `Myth` box. Check the belief against the misconception list, and
   the correction against the claim of kind `correction`.
4. Check every number two times: the value, and the conditions next to it.
5. Read each question and each card. Check the right answer, and check each
   wrong option against the misconception that it names.

**What to find**

List each place where one of these is true:

1. **A fact with no source.** No claim ID and no line of the sources carries
   it, and the page gives no "beyond the slides" badge with a reference.
2. **A wrong fact.** The claim table, the sources or the RFC says something
   else. Quote both.
3. **A number with no conditions.** The number has no machine, no setup, or no
   unit. "150 ms" alone is a finding. "150 ms RTT, loopback, the instructor's
   laptop" is not.
4. **A number that does not match.** The value differs from the source, or the
   conditions differ.
5. **Compression that changes the meaning.** The short form states more, or
   less, than the claim. A hedge of the instructor is gone, or a rule of thumb
   became a law.
6. **A wrong answer key.** The right option is wrong, a wrong option is right,
   or the feedback of an option contradicts the page.
7. **A misconception that does not fit.** The option names a misconception ID
   that says something else.
8. **A correction with no myth box.** A claim of kind `correction` appears in
   the prose with no `Myth` block.
9. **A solution to graded work.** The page gives solution code, a solving
   skeleton, a written spec, or the answer to a real quiz question (rule 4 in
   `CLAUDE.md`).

**What to give back**

One numbered line for each finding, in page order, in this form:

```
N. [check number] Part P, "a short quote from the page" | what is wrong | the source that proves it | a fix in one sentence
```

Use "Opening", "Numbers", "Exit quiz" or "Cards" for P when the place is not
inside a part. For a question or a card, give its ID. Give the claim ID, the
slide page or the file and line that proves each finding. A finding with no
proof does not go in the list.

Then one line with the count for each of the nine checks. If you find nothing,
write `No findings` and the counts.

---

## After the review

1. Fix every proven finding in the page, the quiz file or the card file.
2. Run the coverage review (`docs/reviews/digest-coverage.md`).
3. Run the gate again.
