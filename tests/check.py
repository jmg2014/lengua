#!/usr/bin/env python3
"""Run the app's automated checks in headless Chrome, then spell-check every word against the es_ES dictionary.

    python3 tests/check.py

Needs Google Chrome, and for the spelling check the `spylls` package (pip install spylls) plus the
Hunspell Spanish dictionary (/usr/share/hunspell/es_ES.dic, from the hunspell-es package).

Each test page prints lines starting with PASS / FAIL, a line "WORDS [...]" with every word it used
(the word bank and the answers the skills generate), and a final "DONE" line.
"""
import html
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["tests/engine.html"]
DICT = "/usr/share/hunspell/es_ES"


def run_page(page):
    url = (ROOT / page).as_uri()
    res = subprocess.run(
        ["google-chrome", "--headless=new", "--disable-gpu", "--no-sandbox", "--allow-file-access-from-files",
         "--virtual-time-budget=60000", "--dump-dom", url],
        capture_output=True, text=True, timeout=180)
    m = re.search(r'<pre id="out">(.*?)</pre>', res.stdout, re.S)
    if not m:
        return None, [f"FAIL {page}: no output (Chrome said: {res.stderr.strip()[-300:]})"]
    text = html.unescape(m.group(1))
    lines, words = [], []
    for line in text.splitlines():
        if line.startswith("WORDS "):
            words += json.loads(line[6:])
        elif line.strip():
            lines.append(line)
    return words, lines


def spell_check(words):
    """A word passes if it is in the Hunspell es_ES dictionary, or in the plain Spanish word list
    (/usr/share/dict/spanish, which has some words Hunspell lacks, e.g. "pingüino"),
    or in tests/extra_words.txt (words checked by hand in the RAE dictionary, one per line)."""
    try:
        from spylls.hunspell import Dictionary
    except ImportError:
        return ["SKIP spelling check: pip install spylls"]
    d = Dictionary.from_files(DICT)
    known = set()
    for f in ["/usr/share/dict/spanish", ROOT / "tests" / "extra_words.txt"]:
        try:
            known |= {l.strip() for l in open(f, encoding="utf-8") if l.strip() and not l.startswith("#")}
        except OSError:
            pass
    ok = lambda w: w in known or w.lower() in known or d.lookup(w)
    bad = sorted({w for text in words for w in re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", text) if not ok(w)})
    if bad:
        return [f"FAIL spelling: not in the es_ES dictionary: {', '.join(bad)}"]
    return [f"PASS spelling: all {len(set(words))} words are in the es_ES dictionary"]


def main():
    all_words, failed = [], False
    for page in PAGES:
        words, lines = run_page(page)
        print(f"== {page}")
        for line in lines:
            if not line.startswith("PASS") or "-v" in sys.argv:
                print(line)
        failed |= any(l.startswith(("FAIL", "CRASH")) for l in lines) or not any(l.startswith("DONE") for l in lines)
        all_words += words or []
    print("== spelling")
    for line in spell_check(all_words):
        print(line)
        failed |= line.startswith("FAIL")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
