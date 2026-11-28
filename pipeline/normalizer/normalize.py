"""Raw scraped items -> rows for the `opportunities` table (+ tag slugs).

Usage:
    python normalize.py examples/raw_items.json -o out/opportunities.json
    python normalize.py raw.json --debug          # adds a "_debug" block per item

Input and output formats are described in README.md.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

from extract import (OPPORTUNITY_TYPES, detect_audience, detect_city, detect_grades, detect_online,
                     detect_tags, detect_type, normalize_city, parse_hint_datetime, resolve_dates)
from taxonomy import TAGS_BY_SLUG

DESCRIPTION_MAX = 2000
AUDIENCES = ("school", "university", "both")


def clean_text(s: str | None) -> str:
    if not s:
        return ""
    s = html.unescape(s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"[ \t ]+", " ", s)
    s = re.sub(r"\s*\n\s*", "\n", s)
    return s.strip()


def _iso(dt: datetime | None) -> str | None:
    return dt.isoformat(timespec="seconds") if dt else None


def _reference_date(raw: dict) -> date:
    fetched = raw.get("fetched_at")
    if fetched:
        try:
            return datetime.fromisoformat(fetched.replace("Z", "+00:00")).date()
        except ValueError:
            pass
    return datetime.now(timezone.utc).date()


def normalize_item(raw: dict, debug: bool = False) -> dict:
    source_url = (raw.get("source_url") or "").strip()
    title = clean_text(raw.get("title"))
    if not source_url or not title:
        raise ValueError("raw item needs source_url and title")

    body = clean_text(raw.get("text") or raw.get("description"))
    t_low, b_low = title.lower(), body.lower()
    full = f"{t_low}\n{b_low}"
    ref = _reference_date(raw)

    # type
    hint_type = (raw.get("type") or "").strip().lower()
    detected_type, type_scores = detect_type(t_low, b_low)
    opp_type = hint_type if hint_type in OPPORTUNITY_TYPES else (detected_type or "competition")

    # city / online
    city = normalize_city(raw.get("city"))
    city_scores: dict = {}
    if not city:
        city, city_scores = detect_city(t_low, b_low)
    is_online = bool(raw["is_online"]) if isinstance(raw.get("is_online"), bool) else detect_online(full)

    # audience / grades
    grades = detect_grades(full)
    hint_aud = (raw.get("audience") or "").strip().lower()
    audience = hint_aud if hint_aud in AUDIENCES else detect_audience(full, grades, opp_type)

    # dates: explicit hints from the source win, the rest is read from the text
    hints = raw.get("dates") or {}
    dates = resolve_dates(full, opp_type, ref)
    starts_at = parse_hint_datetime(hints.get("starts_at"), False, ref) or dates.starts_at
    ends_at = parse_hint_datetime(hints.get("ends_at"), True, ref) or dates.ends_at
    deadline_at = parse_hint_datetime(hints.get("deadline_at"), True, ref) or dates.deadline_at

    # tags
    tags, tag_scores = detect_tags(t_low, b_low, grades, audience, raw.get("tags"))

    # status: scraped items are published, unless everything is already in the past
    last = max((d for d in (ends_at, starts_at, deadline_at) if d), default=None)
    status = "archived" if last and last.date() < ref else "published"

    row = {
        "type": opp_type,
        "organizer_id": None,
        "title": title[:300],
        "description": body[:DESCRIPTION_MAX] or None,
        "image_url": raw.get("image_url") or None,
        "external_url": raw.get("external_url") or source_url,
        "city": city,
        "is_online": is_online,
        "audience": audience,
        "starts_at": _iso(starts_at),
        "ends_at": _iso(ends_at),
        "deadline_at": _iso(deadline_at),
        "status": status,
        "source": "scraper",
        "source_url": source_url,
        "tags": [t for t in tags if t in TAGS_BY_SLUG],
    }
    if debug:
        row["_debug"] = {
            "type_scores": type_scores,
            "city_scores": city_scores,
            "grades": sorted(grades),
            "tag_scores": tag_scores,
            "date_mentions": [
                {"raw": m.raw, "role": m.role, "date": m.start.isoformat(),
                 "end": m.end.isoformat() if m.end else None}
                for m in dates.mentions
            ],
        }
    return row


def normalize_all(raw_items: list[dict], debug: bool = False) -> tuple[list[dict], list[dict]]:
    rows, errors, seen = [], [], set()
    for i, raw in enumerate(raw_items):
        try:
            row = normalize_item(raw, debug)
        except Exception as e:  # keep going; report bad items at the end
            errors.append({"index": i, "source_url": raw.get("source_url"), "error": str(e)})
            continue
        if row["source_url"] in seen:   # source_url is unique in the DB
            continue
        seen.add(row["source_url"])
        rows.append(row)
    return rows, errors


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("input", help="JSON file: a list of raw items (or {'items': [...]})")
    ap.add_argument("-o", "--output", help="output JSON file (default: stdout)")
    ap.add_argument("--debug", action="store_true", help="include _debug info per item")
    args = ap.parse_args()

    data = json.loads(Path(args.input).read_text(encoding="utf-8"))
    items = data["items"] if isinstance(data, dict) else data
    rows, errors = normalize_all(items, args.debug)

    text = json.dumps(rows, ensure_ascii=False, indent=2)
    if args.output:
        Path(args.output).parent.mkdir(parents=True, exist_ok=True)
        Path(args.output).write_text(text + "\n", encoding="utf-8")
        print(f"{len(rows)} opportunities -> {args.output}", file=sys.stderr)
    else:
        print(text)
    for e in errors:
        print(f"skipped item {e['index']} ({e['source_url']}): {e['error']}", file=sys.stderr)


if __name__ == "__main__":
    main()
