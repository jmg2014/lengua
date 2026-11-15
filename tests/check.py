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
PAGES = ["tests/engine.html", "tests/silabas.html", "tests/skills.html"]
DICT = "/usr/share/hunspell/es_ES"


def run_page(page):
    url = (ROOT / page).as_uri()
    res = subprocess.run(
        ["google-chrome", "--headless=new", "--disable-gpu", "--no-sandbox", "--allow-file-access-from-files",
         "--virtual-time-budget=60000", "--dump-dom", url],
        capture_output=True, text=True, timeout=180)
    m = re.search(r'<pre id="out">(.*?)</pre>', res.stdout, re.S)
    if not m:
        return None, None, [f"FAIL {page}: no output (Chrome said: {res.stderr.strip()[-300:]})"]
    text = html.unescape(m.group(1))
    lines, words, miss = [], [], []
    for line in text.splitlines():
        if line.startswith("WORDS "):
            words += json.loads(line[6:])
        elif line.startswith("MISSPELL "):
            miss += json.loads(line[9:])
        elif line.strip():
            lines.append(line)
    return words, miss, lines


def load_checker():
    try:
        from spylls.hunspell import Dictionary
    except ImportError:
        return None
    d = Dictionary.from_files(DICT)
    known = set()
    for f in ["/usr/share/dict/spanish", ROOT / "tests" / "extra_words.txt"]:
        try:
            known |= {l.strip() for l in open(f, encoding="utf-8") if l.strip() and not l.startswith("#")}
        except OSError:
            pass
    return lambda w: w in known or w.lower() in known or d.lookup(w)


def spell_check(words, ok):
    """A word passes if it is in the Hunspell es_ES dictionary, or in the plain Spanish word list
    (/usr/share/dict/spanish, which has some words Hunspell lacks, e.g. "pingüino"),
    or in tests/extra_words.txt (words checked by hand in the RAE dictionary, one per line)."""
    if ok is None:
        return ["SKIP spelling check: pip install spylls"]
    bad = sorted({w for text in words for w in re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", text) if not ok(w)})
    if bad:
        return [f"FAIL spelling: not in the es_ES dictionary: {', '.join(bad)}"]
    return [f"PASS spelling: all {len(set(words))} words are in the es_ES dictionary"]


def misspell_check(miss, ok):
    """Every wrong spelling the app can show must NOT be a real word: otherwise the child could be told
    "baca" is wrong when it is a real word (the roof rack of a car)."""
    if ok is None:
        return ["SKIP misspelling check: pip install spylls"]
    # only lower-case words: capitals are a separate question ("Lunes" is fine at the start of a sentence)
    real = sorted({m for m in miss if m == m.lower() and ok(m)})
    if real:
        return [f"FAIL misspellings that are real words (leave those words out): {', '.join(real)}"]
    return [f"PASS misspellings: none of the {len(set(miss))} wrong spellings is a real word"]


def main():
    all_words, all_miss, failed = [], [], False
    for page in PAGES:
        words, miss, lines = run_page(page)
        print(f"== {page}")
        for line in lines:
            if not line.startswith("PASS") or "-v" in sys.argv:
                print(line)
        failed |= any(l.startswith(("FAIL", "CRASH")) for l in lines) or not any(l.startswith("DONE") for l in lines)
        all_words += words or []
        all_miss += miss or []
    print("== spelling")
    ok = load_checker()
    for line in spell_check(all_words, ok) + misspell_check(all_miss, ok):
        print(line)
        failed |= line.startswith("FAIL")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
