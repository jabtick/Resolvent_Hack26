"""Adapter for the INFOS calendar (https://infos.infosbg.com/calendar): all informatics competitions
of the school year, one <li> per event: name (often a link) + <strong>date, place</strong>.

Usage (from pipeline/normalizer):
    python adapters/infos_calendar.py -o data/raw/infos_calendar.json
    python adapters/infos_calendar.py --html saved.html -o data/raw/infos_calendar.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fetch import fetch_html  # noqa: E402

PAGE = "https://infos.infosbg.com/calendar"


class _CalendarParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.section = ""          # "Предстоящи събития" / "Минали събития"
        self.items: list[dict] = []
        self._in_h5 = False
        self._h5 = ""
        self._li: dict | None = None
        self._in_strong = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "h5":
            self._in_h5, self._h5 = True, ""
        elif tag == "li" and self.section:
            self._li = {"name": "", "when": "", "link": None, "section": self.section}
        elif self._li is not None and tag == "strong":
            self._in_strong = True
        elif self._li is not None and tag == "a" and a.get("href") and not self._li["link"]:
            self._li["link"] = urljoin(PAGE, a["href"])

    def handle_endtag(self, tag):
        if tag == "h5":
            self._in_h5 = False
            if "събития" in self._h5.lower():
                self.section = self._h5.strip()
        elif tag == "strong":
            self._in_strong = False
        elif tag == "li" and self._li is not None:
            self.items.append(self._li)
            self._li = None

    def handle_data(self, data):
        if self._in_h5:
            self._h5 += data
        elif self._li is not None:
            self._li["when" if self._in_strong else "name"] += data


def _slug(name: str) -> str:
    return hashlib.sha1(name.encode("utf-8")).hexdigest()[:10]


def parse(html_text: str, fetched_at: str) -> list[dict]:
    p = _CalendarParser()
    p.feed(html_text)
    out = []
    for it in p.items:
        name = re.sub(r"\s+", " ", it["name"]).strip(" ,")
        when = re.sub(r"\s+", " ", it["when"]).strip(" ,")
        if not name:
            continue
        # "до 20 декември 2026 г." = the round is held by that date: an end date, not a deadline.
        dates = {"deadline_at": None}
        if when.lower().startswith("до "):
            dates.update({"starts_at": None, "ends_at": when[3:]})
        # "? февруари 2027" = day not announced yet: leave the dates empty.
        if when.startswith("?") or re.match(r"^\?|^\s*\?", when):
            dates.update({"starts_at": None, "ends_at": None})
        place = when.split(",", 1)[1].strip() if "," in when else ""
        out.append({
            "source_url": f"{PAGE}#{_slug(name)}",
            "title": name,
            "text": f"{name}, {when}.",
            "external_url": it["link"] or PAGE,
            "location": place,
            "type": "competition",
            "audience": "school",
            "dates": dates,
            "tags": ["informatics", "programming"],
            "fetched_at": fetched_at,
            "_source": {"site": "infos", "page_url": PAGE, "section": it["section"], "when": when},
        })
    return out


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-o", "--output", required=True)
    ap.add_argument("--html", help="parse a saved HTML file instead of fetching")
    args = ap.parse_args()
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    html_text = Path(args.html).read_text(encoding="utf-8") if args.html else fetch_html(PAGE)
    items = parse(html_text, fetched_at)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(items)} raw items -> {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
