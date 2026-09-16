# Learner review: the prompt

Gate check 8 in `docs/PLAN.md` section 5. Run it after the accuracy review,
on the built page. Give this prompt to one subagent. Fill in the three values
in angle brackets first. The packet fixes every finding, then runs the gate
again.

The accuracy review asks "is it true?". This review asks "can a learner follow
it?". Two pilot defects passed the accuracy review: a picture that no child
can imagine, and a question about which slide says what.

---

## Prompt

You review one lesson page of a course website about computer networks. You
do not check facts. Another review does that. You check whether a learner can
follow the page from top to bottom.

**Inputs**

- The lesson page: `<URL on the preview port, or the path of dist/.../index.html>`.
- The module ID: `<module ID>`.
- The quiz file: `site/src/content/quiz/<module ID>.yaml`. Some feedback text
  shows only after an answer. Read it here.
- The lesson contract: `docs/PEDAGOGY.md` section 2. For a digest page,
  the contract is section 3.

**How to read**

1. Read the page one time as a 10-year-old. You know no networking words. You
   know everyday life: school, games, the post, a kitchen.
2. Read the page again as a student one week before the exam. You know the
   earlier lessons, but not this one.
3. Read in page order. A term, a tool or a folder counts as taught only when
   the page explained it above the place where it is used. A lesson title in
   the opening story counts as taught for the ideas that the story names.
4. Read each question at the place where it sits on the page. For each exit
   quiz item, open the `taughtIn` anchor and make sure the answer is there.

**What to find**

List each place where one of these is true:

1. **Term before explanation.** The page uses a term before it explains it.
2. **Picture fails a child.** An analogy does not make sense to a child. The
   scene is not from real life, a part of the scene has no match in the real
   thing, or the picture does not say where it breaks.
3. **Question ahead of the page.** A question needs something that the page
   did not teach before it: code, a command, a tool, its output, or a fact.
   A question about which slide or deck says what also counts.
4. **Part with no purpose.** A part does not say what it teaches and why.
5. **Unexplained name.** The page names something that it never explains: a
   repo folder, a tool, a file, a slide.
6. **Table or list that should be a story.** A table or a list holds ideas
   that connect, and the connection is lost. A true side-by-side comparison,
   or a true sequence of steps, is not a finding.
7. **No link to the part before.** A part does not connect to the part before
   it.

**What to give back**

One numbered line for each finding, in page order, in this form:

```
N. [check number] Part P, "a short quote from the page" | what is wrong | a fix in one sentence
```

Use "Opening", "Pretest", "Word card", "Exit quiz" or "Lab" for P when the
place is not inside a part. For a quiz item, give its ID.

Then one line with the count for each of the seven checks. If you find
nothing, write `No findings` and the counts. Do not list style comments that
the seven checks do not name.

---

## After the review

1. Fix every finding in the page, the quiz file or the card file.
2. If the finding is in a picture or a question that came from the curriculum
   file, fix the module section of `docs/curriculum/session-0N.md` to match
   (`docs/PLAN.md` section 4).
3. Run the gate again. Run this review again only if a fix changed more than
   one part.
