#!/usr/bin/env python3
"""Build normalized word-bank seed files from the ECDICT dictionary.

Source : skywind3000/ECDICT  (ecdict.csv)  — MIT License
         https://github.com/skywind3000/ECDICT

The full ECDICT CSV (~63 MB) is *not* committed to this repo. Run this script
once against a local copy to regenerate the seed files under
``backend/seed_data/wordbanks/``:

    curl -sL -o ecdict.csv \
        https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
    python scripts/build_wordbanks.py --source ecdict.csv

Each generated ``<slug>.json`` is a self-describing bank:

    {"name": "...", "description": "...", "source": "...", "license": "MIT",
     "words": [{"spelling", "phonetic", "meaning", "order_index"}, ...]}

Words are ordered by corpus frequency (most common first) so learners meet the
highest-value vocabulary earliest.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

# tag in ECDICT -> (slug, bank name, description)
BANKS = [
    ("gk", "gaokao", "高考英语", "高考英语大纲核心词汇（数据来源 ECDICT）"),
    ("cet4", "cet4", "大学英语四级", "CET-4 大学英语四级核心词汇（数据来源 ECDICT）"),
    ("cet6", "cet6", "大学英语六级", "CET-6 大学英语六级核心词汇（数据来源 ECDICT）"),
    ("ky", "kaoyan", "考研英语", "考研英语大纲核心词汇（数据来源 ECDICT）"),
]
SOURCE = "skywind3000/ECDICT (https://github.com/skywind3000/ECDICT)"
LICENSE = "MIT"

_WS = re.compile(r"[ \t]+")
# ECDICT stores multiple senses separated by the two-character sequence
# backslash-n (occasionally real newlines/CR). Domain-tagged senses such as
# "[计] ..." (computing) / "[医] ..." (medicine) are noise for a general
# learner and are dropped when other senses exist.
_DOMAIN = re.compile(r"^\[[^\]]{1,4}\]")


def clean_meaning(raw: str) -> str:
    """Collapse ECDICT's multi-sense translation into one readable line."""
    if not raw:
        return ""
    # Normalise every separator variant to a real newline via literal replace
    # (avoids regex backslash-escaping ambiguity).
    for sep in ("\\r", "\\n", "\r", "\n"):
        raw = raw.replace(sep, "\n")
    senses = [s.strip() for s in raw.split("\n") if s.strip()]
    kept = [s for s in senses if not _DOMAIN.match(s)]
    if not kept:  # everything was domain-tagged -> keep them rather than drop all
        kept = senses
    return _WS.sub(" ", "; ".join(kept)).strip()


def format_phonetic(raw: str) -> str:
    raw = (raw or "").strip()
    if not raw:
        return ""
    if raw.startswith("/") and raw.endswith("/"):
        return raw
    return f"/{raw}/"


def freq_key(row: dict) -> tuple:
    """Sort key: lower corpus rank = more frequent; unranked (0) sinks to end."""
    def rank(v: str) -> int:
        try:
            n = int(v)
        except (TypeError, ValueError):
            n = 0
        return n if n > 0 else 10**9
    return (rank(row.get("frq")), rank(row.get("bnc")), (row.get("word") or "").lower())


def build(source: Path, out_dir: Path) -> list[dict]:
    buckets: dict[str, list[dict]] = {tag: [] for tag, *_ in BANKS}
    tagset = set(buckets)

    with source.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            word = (row.get("word") or "").strip()
            translation = (row.get("translation") or "").strip()
            if not word or not translation:
                continue
            row_tags = set((row.get("tag") or "").split())
            hit = row_tags & tagset
            if not hit:
                continue
            for tag in hit:
                buckets[tag].append(row)

    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    for tag, slug, name, desc in BANKS:
        rows = sorted(buckets[tag], key=freq_key)
        words = []
        for idx, row in enumerate(rows, start=1):
            meaning = clean_meaning(row.get("translation", ""))
            if not meaning:
                continue
            words.append({
                "spelling": row["word"].strip(),
                "phonetic": format_phonetic(row.get("phonetic", "")),
                "meaning": meaning,
                "order_index": idx,
            })
        bank = {
            "name": name,
            "description": desc,
            "source": SOURCE,
            "license": LICENSE,
            "words": words,
        }
        (out_dir / f"{slug}.json").write_text(
            json.dumps(bank, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        manifest.append({"slug": slug, "name": name, "count": len(words)})
        print(f"  {name:12s} {slug:8s} -> {len(words)} words")

    (out_dir / "index.json").write_text(
        json.dumps({"banks": manifest, "source": SOURCE, "license": LICENSE},
                   ensure_ascii=False, indent=1),
        encoding="utf-8",
    )
    return manifest


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--source", default="ecdict.csv", help="path to ECDICT ecdict.csv")
    ap.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent.parent / "backend" / "seed_data" / "wordbanks"),
        help="output directory for seed json files",
    )
    args = ap.parse_args()
    source = Path(args.source)
    if not source.exists():
        print(f"ERROR: source not found: {source}", file=sys.stderr)
        print("Download it first (see module docstring).", file=sys.stderr)
        return 1
    print(f"Building word banks from {source} ...")
    build(source, Path(args.out))
    print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
