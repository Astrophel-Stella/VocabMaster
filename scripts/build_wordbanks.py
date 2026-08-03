#!/usr/bin/env python3
"""Build normalized word-bank seed files from ECDICT.

This is a *build-time developer tool*, not a runtime dependency. It reads the
open-source ECDICT dictionary (skywind3000/ECDICT, MIT license), filters words
by exam tag, normalizes phonetic/meaning, sorts by word frequency (high
frequency first) and writes one JSON seed file per word bank into
``backend/data/wordbanks/``.

The generated JSON is committed to the repository so that ``init_db.py`` can seed
the database **offline** — CI and production never fetch ECDICT at runtime
(SOU-39 acceptance: "seed 数据随仓库提交，CI/离线可复现，不依赖运行时联网").

Usage::

    # Use a local ECDICT csv you already downloaded
    python scripts/build_wordbanks.py --source path/to/ecdict.csv

    # Or let the script download ECDICT into a local cache (dev machine only)
    python scripts/build_wordbanks.py

The upstream data URL is configurable via ``--source-url`` or the
``ECDICT_SOURCE_URL`` environment variable so it is never a hard-coded
deployment constant (CLAUDE.md §2: no hard-coded host/URL).
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Optional

# --- Provenance ---------------------------------------------------------------
SOURCE_NAME = "ECDICT (skywind3000/ECDICT)"
SOURCE_REPO = "https://github.com/skywind3000/ECDICT"
SOURCE_LICENSE = "MIT"
# Canonical upstream data file. Overridable via --source-url / ECDICT_SOURCE_URL
# so this build tool carries no hard-coded deployment configuration.
DEFAULT_SOURCE_URL = (
    "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"
)

# --- Word banks ---------------------------------------------------------------
# Each ECDICT entry carries a space separated ``tag`` field
# (zk/gk/ky/cet4/cet6/toefl/ielts/gre). We build one bank per exam tag.
BANKS = [
    {
        "tag": "gk",
        "name": "高考英语",
        "description": "高考英语核心词汇（来源：ECDICT gk 标签）",
    },
    {
        "tag": "ky",
        "name": "考研英语",
        "description": "考研英语核心词汇（来源：ECDICT ky 标签）",
    },
    {
        "tag": "cet4",
        "name": "四级英语",
        "description": "大学英语四级核心词汇（来源：ECDICT cet4 标签）",
    },
    {
        "tag": "cet6",
        "name": "六级英语",
        "description": "大学英语六级核心词汇（来源：ECDICT cet6 标签）",
    },
]

# A frequency rank sentinel for words ECDICT does not rank (0). Ranked words
# (rank >= 1, smaller == more frequent) always sort before unranked ones.
_UNRANKED = 10 ** 9

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUTPUT_DIR = REPO_ROOT / "backend" / "data" / "wordbanks"
DEFAULT_CACHE = REPO_ROOT / "scripts" / ".cache" / "ecdict.csv"


def _to_int(value: Optional[str]) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def freq_rank(row: dict) -> int:
    """Best-known frequency rank for a word (smaller == more frequent)."""
    frq = _to_int(row.get("frq"))
    bnc = _to_int(row.get("bnc"))
    frq = frq if frq > 0 else _UNRANKED
    bnc = bnc if bnc > 0 else _UNRANKED
    return min(frq, bnc)


def clean_phonetic(raw: Optional[str]) -> Optional[str]:
    """Wrap a bare ECDICT phonetic in IPA slashes; return None when empty."""
    text = (raw or "").strip()
    if not text:
        return None
    return f"/{text}/"


def _has_cjk(text: str) -> bool:
    return any("一" <= ch <= "鿿" for ch in text)


def clean_meaning(raw: Optional[str]) -> str:
    """Normalize an ECDICT translation into a single readable Chinese string.

    ECDICT stores multi-sense translations with literal ``\\r\\n`` escapes. We
    split those into separate senses and rejoin with a Chinese separator so the
    meaning reads naturally when rendered on one line.
    """
    text = (raw or "")
    text = text.replace("\\r\\n", "\n").replace("\\n", "\n").replace("\\r", "\n")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    senses = [line.strip() for line in text.split("\n") if line.strip()]
    return "；".join(senses)


def ensure_source(source: Optional[str], source_url: str, cache: Path) -> Path:
    """Return a local path to the ECDICT csv, downloading to cache if needed."""
    if source:
        path = Path(source)
        if not path.exists():
            raise SystemExit(f"--source not found: {path}")
        return path
    if cache.exists():
        print(f"Using cached ECDICT: {cache}")
        return cache
    cache.parent.mkdir(parents=True, exist_ok=True)
    print(f"Downloading ECDICT from {source_url} -> {cache}")
    urllib.request.urlretrieve(source_url, cache)  # noqa: S310 (trusted OSS url)
    return cache


def build(source_csv: Path, output_dir: Path, source_url: str) -> None:
    tags = {bank["tag"] for bank in BANKS}
    # Collect matching rows per tag in a single pass over the (large) csv.
    collected: dict[str, list[dict]] = {tag: [] for tag in tags}

    with open(source_csv, encoding="utf-8", newline="") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            row_tags = set((row.get("tag") or "").split())
            hit = row_tags & tags
            if not hit:
                continue
            spelling = (row.get("word") or "").strip()
            meaning = clean_meaning(row.get("translation"))
            # Guard against placeholder / non-Chinese entries.
            if not spelling or not _has_cjk(meaning):
                continue
            entry = {
                "spelling": spelling,
                "phonetic": clean_phonetic(row.get("phonetic")),
                "meaning": meaning,
                "example_sentence": None,  # ECDICT carries no example sentences
                "_rank": freq_rank(row),
            }
            for tag in hit:
                collected[tag].append(entry)

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = []
    for bank in BANKS:
        tag = bank["tag"]
        words = sorted(
            collected[tag], key=lambda w: (w["_rank"], w["spelling"].lower())
        )
        out_words = []
        for index, word in enumerate(words, start=1):
            out_words.append(
                {
                    "spelling": word["spelling"],
                    "phonetic": word["phonetic"],
                    "meaning": word["meaning"],
                    "example_sentence": word["example_sentence"],
                    "order_index": index,
                }
            )
        payload = {
            "name": bank["name"],
            "description": bank["description"],
            "tag": tag,
            "source": SOURCE_NAME,
            "source_url": SOURCE_REPO,
            "license": SOURCE_LICENSE,
            "total_words": len(out_words),
            "words": out_words,
        }
        out_path = output_dir / f"{tag}.json"
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, ensure_ascii=False, indent=2)
        first = out_words[0]["spelling"] if out_words else "-"
        print(f"  {bank['name']:8s} ({tag}): {len(out_words)} words -> {out_path.name} (first: {first})")
        manifest.append(
            {
                "tag": tag,
                "name": bank["name"],
                "file": out_path.name,
                "total_words": len(out_words),
            }
        )

    _write_readme(output_dir, manifest, source_url)


def _write_readme(output_dir: Path, manifest: list, source_url: str) -> None:
    lines = [
        "# Word bank seed data",
        "",
        "Generated by `scripts/build_wordbanks.py`. **Do not edit by hand** — ",
        "regenerate from source instead.",
        "",
        f"- Source: {SOURCE_NAME}",
        f"- Repository: {SOURCE_REPO}",
        f"- Data file: `{source_url}`",
        f"- License: {SOURCE_LICENSE}",
        "",
        "These files are committed so the database can be seeded fully offline ",
        "(`python backend/init_db.py`) — CI and production never fetch ECDICT at ",
        "runtime.",
        "",
        "| Tag | Bank | File | Words |",
        "|-----|------|------|-------|",
    ]
    for item in manifest:
        lines.append(
            f"| {item['tag']} | {item['name']} | `{item['file']}` | {item['total_words']} |"
        )
    lines.append("")
    (output_dir / "README.md").write_text("\n".join(lines), encoding="utf-8")


def main(argv: Optional[list] = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source",
        help="Path to a local ecdict.csv (skips download).",
    )
    parser.add_argument(
        "--source-url",
        default=os.environ.get("ECDICT_SOURCE_URL", DEFAULT_SOURCE_URL),
        help="Upstream ECDICT csv URL (env: ECDICT_SOURCE_URL).",
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Output directory for the generated JSON seed files.",
    )
    parser.add_argument(
        "--cache",
        default=str(DEFAULT_CACHE),
        help="Where to cache the downloaded ECDICT csv.",
    )
    args = parser.parse_args(argv)

    source_csv = ensure_source(args.source, args.source_url, Path(args.cache))
    print(f"Building word banks from {source_csv}")
    build(source_csv, Path(args.output), args.source_url)
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
