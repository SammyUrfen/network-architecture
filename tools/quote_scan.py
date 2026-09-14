#!/usr/bin/env python3
"""Find long quotes from sources/ in the files that git tracks.

This is step 3 of the Phase D checklist in docs/PLAN.md. The repo goes
public, and sources/ holds the instructor slides, notes and code. A run of
RUN or more words that is in a tracked file and also in a source is a long
quote. The script prints each run as "file:line: words" and exits 1.

The source text is sources/session-*/slides.txt, sources/session-*/notes.md
and the tracked text files of the instructor clone sources/cn-at-scaler.
Words compare after NFKC, lower case, and a split on every character that is
not a letter or a digit. So case, punctuation and whitespace do not matter.

    python3 tools/quote_scan.py
    python3 tools/quote_scan.py --selftest

Exit codes: 0 no quotes, 1 quotes found, 2 no source text to compare with.
"""
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

# CLAUDE.md allows short quoted phrases. Twelve words is longer than a phrase
# and shorter than a slide sentence, so a hit is a copy, not a shared term.
RUN = 12
ROOT = Path(__file__).resolve().parent.parent
WORD = re.compile(r"[^\W_]+")


def words(text):
    """Return (word, line number) for each word in text."""
    text = unicodedata.normalize("NFKC", text).lower()
    return [(m.group(), n) for n, line in enumerate(text.splitlines(), 1) for m in WORD.finditer(line)]


def shingles(text):
    ws = [w for w, _ in words(text)]
    return {" ".join(ws[i:i + RUN]) for i in range(len(ws) - RUN + 1)}


def runs(text, known):
    """Yield (line, run) for each longest run of text words in known shingles."""
    wl = words(text)
    hit = [" ".join(w for w, _ in wl[i:i + RUN]) in known for i in range(len(wl) - RUN + 1)]
    i = 0
    while i < len(hit):
        if not hit[i]:
            i += 1
            continue
        j = i
        while j + 1 < len(hit) and hit[j + 1]:
            j += 1
        yield wl[i][1], " ".join(w for w, _ in wl[i:j + RUN])
        i = j + 1


def read_text(path):
    """Return the file as text, or None for a binary file."""
    data = path.read_bytes()
    return None if b"\0" in data else data.decode("utf-8", "replace")


def tracked(repo):
    out = subprocess.run(["git", "-C", str(repo), "ls-files", "-z"], capture_output=True, check=True).stdout
    return [repo / p for p in out.decode().split("\0") if p]


def source_files():
    src = ROOT / "sources"
    files = sorted(src.glob("session-*/slides.txt")) + sorted(src.glob("session-*/notes.md"))
    clone = src / "cn-at-scaler"
    # Without its own .git, "git -C" lists the files of this repo instead.
    if (clone / ".git").exists():
        files += tracked(clone)
    return files


def scan():
    known = set()
    for f in source_files():
        text = read_text(f) if f.is_file() else None
        if text:
            known |= shingles(text)
    if not known:
        print(f"quote_scan: no source text under {ROOT / 'sources'}", file=sys.stderr)
        return 2
    hits = 0
    for f in tracked(ROOT):
        text = read_text(f) if f.is_file() else None
        for line, run in runs(text or "", known):
            print(f"{f.relative_to(ROOT)}:{line}: {run}")
            hits += 1
    print(f"quote_scan: {hits} runs of {RUN} or more words", file=sys.stderr)
    return 1 if hits else 0


def selftest():
    one_to_twenty = " ".join(f"w{i}" for i in range(1, 21))
    known = shingles(one_to_twenty)
    # Case, punctuation and line breaks do not matter. The line is where the run starts.
    text = "intro\nsays W3, w4; W5 w6\nw7 w8 w9 (w10) w11 w12 w13 w14. end"
    assert list(runs(text, known)) == [(2, "w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13 w14")]
    # Overlapping windows join into one run.
    assert list(runs("w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13", known)) == [(1, "w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13")]
    # Eleven shared words are a short quote.
    assert list(runs("w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 x", known)) == []
    # Two separate runs in one text.
    two = "w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 gap\nw9 w10 w11 w12 w13 w14 w15 w16 w17 w18 w19 w20"
    assert [line for line, _ in runs(two, known)] == [1, 2]
    # NFKC folds the "fi" ligature that pdftotext leaves in slide text.
    assert shingles("the \N{LATIN SMALL LIGATURE FI}rst a b c d e f g h i j") == shingles("THE first a b c d e f g h i j")
    assert read_text(Path(__file__)) is not None
    print("quote_scan selftest: ok")
    return 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv[1:] else scan())
