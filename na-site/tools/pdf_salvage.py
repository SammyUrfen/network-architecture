#!/usr/bin/env python3
"""Get slide text out of a truncated PDF.

Use this only when `pdftotext` fails with "Couldn't find trailer dictionary".
That error means the download stopped early. The page tree and the fonts sit
at the end of the file, so normal tools see zero pages. The content streams
at the start of the file still decompress, and the slide decks from this
course write plain text in them. This script reads those streams directly.

Output: each page ends with a form feed, as in `pdftotext` output, so
`awk 'BEGIN{RS="\\f"} NR==12'` prints page 12.

Limits: the order of text blocks follows the PDF drawing order, not the
reading order. Pages come in the order of their streams in the file, which
can differ from the PDF page order. Glyphs outside Latin-1 come out as junk
or vanish. A slide cut off in the middle of a stream is lost. Always get a
complete PDF when you can.

    python3 na-site/tools/pdf_salvage.py na-site/sources/session-05/slides.pdf > na-site/sources/session-05/slides.txt
    python3 na-site/tools/pdf_salvage.py --selftest
"""
import re
import sys
import zlib

ESCAPES = {b"n": b"\n", b"r": b"", b"t": b"\t", b"b": b"", b"f": b""}
# Kerning below this (in 1/1000 em) is a word gap, not letter spacing.
WORD_GAP = -150


def unescape(s):
    def sub(m):
        g = m.group(1) or b""
        return bytes([int(g, 8) & 0xFF]) if g[:1].isdigit() else ESCAPES.get(g, g)
    return re.sub(rb"\\([nrtbf()\\]|[0-7]{1,3})", sub, s)


def text_block(bt):
    line = b""
    ops = rb"\[((?:[^\]\\]|\\.)*)\]\s*TJ|\(((?:[^)\\]|\\.)*)\)\s*Tj|(-?[\d.]+)\s+(-?[\d.]+)\s+Td"
    for tok in re.finditer(ops, bt, re.S):
        if tok.group(1) is not None:
            for p in re.finditer(rb"\(((?:[^)\\]|\\.)*)\)|(-?[\d.]+)", tok.group(1)):
                if p.group(1) is not None:
                    line += unescape(p.group(1))
                elif float(p.group(2)) < WORD_GAP:
                    line += b" "
        elif tok.group(2) is not None:
            line += unescape(tok.group(2))
        else:
            line += b"\n" if float(tok.group(4)) != 0 else b" "
    return line.decode("latin-1")


def salvage(data):
    pages = []
    for m in re.finditer(rb"stream\r?\n", data):
        try:
            out = zlib.decompressobj().decompress(data[m.end():])
        except zlib.error:
            continue
        if b"Tj" in out or b"TJ" in out:
            pages.append("\n".join(text_block(bt) for bt in re.findall(rb"BT(.*?)ET", out, re.S)))
    return pages


def selftest():
    content = b"BT /f 1 Tf [(Hel)3(lo)-300(wor)(ld)]TJ 0 -1 Td (\\267 next)Tj ET"
    pdf = b"%PDF-1.7\n1 0 obj\n<< >>\nstream\n" + zlib.compress(content) + b"\nendstream"
    pages = salvage(pdf)
    assert pages == ["Hello world\n\xb7 next"], pages
    print("selftest ok")


if __name__ == "__main__":
    if sys.argv[1:] == ["--selftest"]:
        selftest()
    elif len(sys.argv) == 2:
        for page in salvage(open(sys.argv[1], "rb").read()):
            sys.stdout.write(page + "\f")
    else:
        sys.exit(__doc__)
