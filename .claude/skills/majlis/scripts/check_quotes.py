#!/usr/bin/env python
"""
Check every quoted line in a «مجلس التاجر» session against the seats' brains.

Usage:
  python .claude/skills/majlis/scripts/check_quotes.py <session folder>

Scans round-*.md and verdict.md for quotes attributed to a source id, like "..." (S095),
“...” (S095) or «...» (S012), and looks for each in the brain files:
- the seven simulated seats quote only verbatim lines from their brains (public work, with ids);
- «صوت العميل» quotes only the store's own reviews in brains/store-customer/sources.md
  (built at onboarding; while that brain is NOT_BUILT the seat quotes nothing).
A quote that is in no brain is either a quote of another seat or the merchant (fine if it
appears in an earlier round file or in the brief of the same session, e.g. the labelled
example reviews in the shipped example) or an invented quote (flag it and remove it from the
verdict). Exit code 1 if any quote is unaccounted for.

English and Arabic quotes are both checked. Arabic is normalized before matching:
diacritics and tatweel are dropped, alef forms (أ إ آ ٱ) become ا, ى becomes ي,
ة becomes ه, ؤ becomes و, ئ becomes ي, and Arabic-Indic digits become 0-9.
Write translations after the source id in plain parentheses, e.g.
"verbatim English" (S014) (بالعربي: ...), so the translation is not mistaken for a quote.
"""
import re
import sys
from pathlib import Path

BRAINS = Path(__file__).resolve().parents[1] / "brains"

AR_DIACRITICS = re.compile(r"[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")
AR_MAP = str.maketrans({
    "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
    "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي",
    "ک": "ك", "ی": "ي", "ھ": "ه",
    "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
    "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
    "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
    "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
})
HAS_AR = re.compile(r"[\u0621-\u064A]")


def norm(s):
    s = s.lower().replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    s = AR_DIACRITICS.sub("", s).translate(AR_MAP)
    # keep latin letters, digits, apostrophes and the Arabic letter block
    s = re.sub(r"[^a-z0-9'\u0621-\u064A ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


# "...", “...” or «...», then up to 40 chars, then (S123 or [S123
QUOTE = re.compile(r"(?:[\"“]([^\"“”\n]{10,400})[\"”]|«([^«»\n]{6,400})»)[^\n\"«]{0,40}?[\(\[]S\d{3}")


def long_enough(nq):
    words = nq.split()
    # Arabic customer quotes are short; three words is enough to be a real quote
    return len(words) >= (3 if HAS_AR.search(nq) else 6)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    session = Path(sys.argv[1])
    brain_text = norm(" ".join(p.read_text(encoding="utf-8", errors="replace") for p in BRAINS.rglob("*.md")))
    session_files = sorted(session.glob("round-*.md")) + [p for p in [session / "verdict.md"] if p.exists()]
    brief = norm((session / "brief.md").read_text(encoding="utf-8")) if (session / "brief.md").exists() else ""
    bad, ok, internal = [], 0, 0
    seen_session = ""
    for f in session_files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for m in QUOTE.finditer(text):
            q = m.group(1) or m.group(2)
            nq = norm(q)
            if not long_enough(nq):
                continue
            if nq in brain_text:
                ok += 1
            elif nq in seen_session or nq in brief:
                internal += 1
            else:
                bad.append((f.name, q))
        seen_session += " " + norm(text)
    print(f"brain quotes verified: {ok}; quotes of earlier rounds or the brief: {internal}; unverified: {len(bad)}")
    for name, q in bad:
        print(f"  UNVERIFIED [{name}] \"{q[:160]}\"")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main()
