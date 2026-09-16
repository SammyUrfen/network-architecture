# Digest coverage review: the prompt

Gate check 5 in `docs/PLAN.md` section 5, for a digest page. Run it after the
accuracy review. Give this prompt to one subagent. Fill in the values in angle
brackets first. The packet fixes every finding, then runs the gate again.

`npm run verify` rule 11 counts the `core` claims that no `covers` list names.
It reads the lists, not the page. A `covers` list can name a claim that the
prose never teaches. This review reads the page and finds that gap.

---

## Prompt

You check one digest page of a course website about computer networks. A
digest gives one whole class as one fast read. You check one thing: whether
the page names every core idea of that class.

**Inputs**

- The digest page: `<URL on the preview port, or the path of dist/sNN/digest/index.html>`.
- The module ID: `<sNN-digest>`.
- The curriculum file: `docs/curriculum/session-0N.md`, section 3, the claim
  inventory. The last cell of each row gives the kind.
- The quiz file: `site/src/content/quiz/<sNN-digest>.yaml`, and the card file
  `site/src/content/cards/<sNN-digest>.yaml`.
- The contract: `docs/PEDAGOGY.md` section 3, rule 1.

**How to read**

1. Make the list of every claim of kind `core` in the claim table. Keep the
   order of the table.
2. Read the page, the questions and the cards one time, for the story.
3. Go down your list. For each core claim, find the one place that carries the
   idea: a sentence of a part, a key idea, a "what to remember" line, a row of
   the numbers table, a card or a question. Write that place down.
4. A claim counts as covered only when a reader who reads the page learns the
   idea. A claim ID in the `covers` list is not enough. A word of the claim in
   another sentence is not enough.
5. Mark a claim "named only" when the page gives the term but not the idea.

**What to give back**

First one table with one row for each core claim:

```
| Claim ID | The idea in five words | Covered | Where |
```

`Covered` is `yes`, `named only` or `no`. `Where` gives the part number and a
short quote, the card ID, or the question ID. For `no`, write `-`.

Then three lists:

1. **Not covered.** Each claim with `no`, with the part where it belongs.
2. **Named only.** Each claim with `named only`, and the sentence to add.
3. **In `covers` but not on the page.** Each claim ID in the `covers` of the
   page, a card or a question that no text on the page teaches.

Then one line: `Core claims: N. Covered: N. Named only: N. Not covered: N.`

Do not list a claim of kind `detail`, `story`, `measured` or `correction`.
Do not comment on the writing. The learner review does that.

---

## After the review

1. Add each missing idea to the part where it belongs, or to a card or a
   question. Keep the digest at about 3,000 words: fold the idea into a
   sentence that is already there when you can.
2. Add each new claim ID to the `covers` of the page, the card or the
   question.
3. Run `npm run verify` and check that rule 11 gives no failure.
4. Run the gate again.
