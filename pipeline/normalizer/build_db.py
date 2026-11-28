"""data/raw/<source>.json  ->  data/db/<source>.json  (one database-ready file per source).

Also checks every row against the rules of the `opportunities` table
(supabase/migrations/20261127200000_profiles_feed.sql) and the tag list, so a file
that passes here will insert without errors.

Usage (from pipeline/normalizer):
    python build_db.py
    python build_db.py --today 2026-11-28     # what counts as past (archived)
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from normalize import normalize_item
from taxonomy import DB_TAG_SLUGS, TAGS_BY_SLUG

HERE = Path(__file__).resolve().parent
RAW, DB = HERE / "data" / "raw", HERE / "data" / "db"

# The same event pulled from two sources: keep the richer, dedicated page and drop the
# calendar line. {raw file stem: [substring of the title to drop]}
DROP = {"infos_calendar": ["Джон Атанасов", "CODE@BURGAS"]}

TYPES = {"competition", "scholarship", "internship", "open_day", "university_program"}
AUDIENCES = {"school", "university", "both"}
STATUSES = {"draft", "published", "archived"}


def check(row: dict) -> list[str]:
    errs = []
    if row["type"] not in TYPES:
        errs.append(f"type {row['type']!r}")
    if row["audience"] not in AUDIENCES:
        errs.append(f"audience {row['audience']!r}")
    if row["status"] not in STATUSES:
        errs.append(f"status {row['status']!r}")
    if not 1 <= len(row["title"]) <= 200:
        errs.append("title length")
    if row["source"] != "scraper" or row["organizer_id"] is not None:
        errs.append("source/organizer_id")
    if row["starts_at"] and row["ends_at"] and row["ends_at"] < row["starts_at"]:
        errs.append("ends_at < starts_at")
    bad_tags = [t for t in row["tags"] if t not in TAGS_BY_SLUG]
    if bad_tags:
        errs.append(f"unknown tags {bad_tags}")
    not_interest = [t for t in row["tags"] if t not in DB_TAG_SLUGS]
    if not_interest:
        errs.append(f"non-interest tags {not_interest}")
    return errs


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--today", help="YYYY-MM-DD; overrides fetched_at as the reference date")
    args = ap.parse_args()

    DB.mkdir(parents=True, exist_ok=True)
    seen: dict[str, str] = {}
    total, problems = 0, 0
    for raw_file in sorted(RAW.glob("*.json")):
        items = json.loads(raw_file.read_text(encoding="utf-8"))
        rows = []
        for raw in items:
            if any(s in raw.get("title", "") for s in DROP.get(raw_file.stem, [])):
                continue
            if args.today:
                raw = {**raw, "fetched_at": f"{args.today}T12:00:00+00:00"}
            row = normalize_item(raw)
            # Only interest tags (what students pick on their profile) + the two grade groups.
            row["tags"] = [t for t in row["tags"] if t in DB_TAG_SLUGS]
            errs = check(row)
            if row["source_url"] in seen:
                errs.append(f"source_url also in {seen[row['source_url']]}")
            seen[row["source_url"]] = raw_file.name
            if errs:
                problems += 1
                print(f"  ! {raw_file.name}: {row['title'][:50]}: {', '.join(errs)}")
            rows.append(row)
        (DB / raw_file.name).write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        live = sum(r["status"] == "published" for r in rows)
        print(f"{raw_file.name:34} {len(rows):3} rows  ({live} published, {len(rows) - live} archived)")
        total += len(rows)
    print(f"total: {total} rows in {DB.relative_to(HERE)}/, {problems} with problems")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
