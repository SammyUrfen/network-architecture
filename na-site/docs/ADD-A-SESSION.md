# Runbook: add a new session

Every path here is relative to `na-site/`. Run each command from `na-site/`,
except where a step names another folder.

Use this runbook after each new class (Sessions 6, 7 and 8). Use it also when
a complete deck replaces a truncated one. Finish steps 1 to 6 within 48 hours
of the class, and before the post-class quiz opens.

Time: about 30 minutes for Bibek (step 1). About 3 to 4 hours for Claude
(steps 2 to 6). Module pages then follow the normal packet flow in
`docs/PLAN.md`, at the front of the queue.

---

## Step 1. Get the sources (Bibek)

1. Open the session deck in the browser.
2. Use the print dialog and select "Save as PDF".
3. Save the file as `sources/session-0N/slides.pdf`.
4. Save the class AI notes as `sources/session-0N/notes.md`, if they exist.
5. Save the transcript as `sources/session-0N/transcript.txt`, if it exists.

NOTE: A direct download of the decks for Sessions 2 to 5 stopped early. The
print dialog gave a complete file for Session 1.

## Step 2. Update the instructor code

1. Run `git -C sources/cn-at-scaler pull`.
2. Run `git -C sources/cn-at-scaler log --oneline -5`.
3. Record the new commit and the new `lessonN/` folder in `sources/MANIFEST.md`.

## Step 3. Extract the slide text

1. Run `pdftotext -layout sources/session-0N/slides.pdf sources/session-0N/slides.txt`.
2. If the command prints "Couldn't find trailer dictionary", the PDF is
   truncated. Ask Bibek for a new copy.
3. If no new copy is possible, run
   `python3 tools/pdf_salvage.py sources/session-0N/slides.pdf > sources/session-0N/slides.txt`
   from `na-site/`.
   The output separates pages with form feeds, but it orders pages by the
   streams in the file. That order can differ from the PDF page order.
4. Record the slide count and the status in `sources/MANIFEST.md`. For a
   salvaged deck, write "salvaged, page order not checked".
5. Copy the deck to `site/public/slides/session-0N.pdf`. Add its page count
   and size, and the `numbered` map of printed slide numbers, to
   `site/src/components/slides/decks.ts`, then run
   `npm run test` in `site/`. Add a row to "Published decks" in
   `sources/MANIFEST.md`.
6. A slide citation uses the PDF page number. Check the printed slide number
   on two pages. If it differs, write the offset in `sources/MANIFEST.md`.

## Step 4. Write the curriculum file

1. Add the module IDs for the session to the "Module IDs" table in
   `docs/curriculum/README.md`. Read the deck agenda first.
2. Write `docs/curriculum/session-0N.md` with the template in
   `docs/curriculum/README.md`.
3. Run three independent reviews of the file: fidelity to the sources,
   technical accuracy, and pedagogy.
4. Check each review finding against its evidence. Apply the findings that
   hold.
5. Run `python3 ~/.claude/skills/asd-ste100/scripts/ste-lint.py --fail-over 2.5 docs/curriculum/session-0N.md`.

If workflows are available, the saved workflow `session-curriculum` does
items 2 to 4. Give it the session number and a short brief: the deck title,
the agenda, the source paths, known cross-references, and the RFCs to check.

## Step 5. Update the indexes

1. Add a thread to the thread table in `docs/curriculum/README.md` only when
   the session repeats an idea from an earlier session.
2. Set the source status of the session in `docs/curriculum/README.md`.
3. Compare the `### s0N-mNN` headings of the new file with the Module IDs
   table in `docs/curriculum/README.md`. Add each module that the file added.
   The workflow cannot edit the README.
4. Add the module IDs to the Phases 5 to 7 table in `docs/PLAN.md` section 4,
   at the front of the first phase that has not ended. Fix the counts.
5. Update the status table in `CLAUDE.md`.
6. After Phase 1, update `site/src/content/sessions/s0N.yaml`: the date and
   `sourceStatus`.

## Step 6. Quiz pack

Bibek gets practice for the post-class quiz before the module pages exist.

1. Ask Bibek when the quiz opens. Finish this step before then.
2. For each module in the new file, copy its checks into
   `site/src/content/quiz/<module-id>.yaml` with `use: [practice]`, and its
   review cards into `site/src/content/cards/<module-id>.yaml`. These items
   passed the three reviews of step 4. Give them IDs such as `s06-m01-q01`
   and `s06-m01-c01`. The module packet keeps these IDs later.
3. Run `npm run verify` and `npm run build`. Verify rule 5 skips a quiz file
   with no page.
4. Bibek reviews the new cards on `/review/`, and practises on `/practice/`
   with only the new session picked.

Before Phase 2 ends, `/review/` does not exist. Before Phase 4 ends,
`/practice/` does not exist. Until then, Bibek reads the Checks and Review
cards of each module in the session file.

## Step 7. Replace a truncated deck later

1. Do steps 1 and 3 for the complete deck.
2. Run the fidelity review on `docs/curriculum/session-0N.md` against the new
   `slides.txt`.
3. Add the missing claims with new IDs. Do not renumber old IDs.
4. List the modules whose content changed. Run their accuracy review again.
