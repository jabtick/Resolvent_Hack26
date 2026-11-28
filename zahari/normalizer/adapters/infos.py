"""Adapter for INFOS (https://infos.infosbg.com/home): national informatics competitions.

The home page is a list of announcement cards (<article>), so one page gives many raw items.
Each card: title (h5.card-title, usually with date and city), body (span.information),
links, an optional image, and upload / edit times.

Usage (from zahari/normalizer):
    python adapters/infos.py -o examples/infos_raw.json                 # fetch live
    python adapters/infos.py --html saved_page.html -o out/raw.json     # parse a saved page
    python adapters/infos.py --pages 2 -o out/raw.json                  # also page 2, 3, ...
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fetch import fetch_html  # noqa: E402

BASE = "https://infos.infosbg.com"
HOME = f"{BASE}/home"
SITE_HINTS = ("сайт", "страница", "повече информация", "official", "website")


class _CardParser(HTMLParser):
    def __init__(self, page_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.page_url = page_url
        self.cards: list[dict] = []
        self._card: dict | None = None
        self._in_title = False
        self._info_depth = 0      # >0 while inside span.information
        self._in_upload = False
        self._link: dict | None = None

    # -- helpers --
    def _text(self, s: str) -> None:
        self._card["chunks"].append(s)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        if tag == "article":
            self._card = {"title": "", "chunks": [], "links": [], "image": None, "uploaded": "",
                          "edited": a.get("data-edited")}
            return
        if self._card is None:
            return
        if tag == "div" and "card" in cls and a.get("data-edited"):
            self._card["edited"] = a["data-edited"]
        if tag == "h5" and "card-title" in cls:
            self._in_title = True
        elif tag == "span" and "information" in cls:
            self._info_depth = 1
        elif tag == "span" and self._info_depth:
            self._info_depth += 1
        elif tag == "span" and "upload-time" in cls:
            self._in_upload = True

        if self._info_depth:
            if tag in ("p", "ul", "br", "figure"):
                self._text("\n")
            elif tag == "li":
                self._text("\n- ")
            elif tag == "a" and a.get("href"):
                self._link = {"href": urljoin(self.page_url, a["href"]), "text": "",
                              "before": "".join(self._card["chunks"])[-60:].lower()}
            elif tag == "img" and a.get("src") and not self._card["image"]:
                self._card["image"] = urljoin(self.page_url, a["src"])

    def handle_endtag(self, tag):
        if self._card is None:
            return
        if tag == "h5":
            self._in_title = False
        elif tag == "span" and self._info_depth:
            self._info_depth -= 1
        elif tag == "span" and self._in_upload:
            self._in_upload = False
        elif tag == "a" and self._link is not None:
            self._card["links"].append(self._link)
            self._link = None
        elif tag == "article":
            self.cards.append(self._card)
            self._card = None

    def handle_data(self, data):
        if self._card is None:
            return
        if self._in_title:
            self._card["title"] += data
        elif self._info_depth:
            self._text(data)
            if self._link is not None:
                self._link["text"] += data
        elif self._in_upload:
            self._card["uploaded"] += data


def _pick_external_url(links: list[dict]) -> str | None:
    external = [l for l in links
                if urlparse(l["href"]).scheme in ("http", "https")
                and "infosbg.com" not in urlparse(l["href"]).netloc]
    for l in external:
        if any(h in l["before"] for h in SITE_HINTS):
            return l["href"]
    return external[0]["href"] if external else None


def _parse_dt(s: str) -> str | None:
    s = s.strip()
    for fmt in ("%d.%m.%Y %H:%M", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(s, fmt).isoformat()
        except ValueError:
            pass
    return None


def cards_to_raw_items(html_text: str, page_url: str, fetched_at: str) -> list[dict]:
    p = _CardParser(page_url)
    p.feed(html_text)
    items = []
    for c in p.cards:
        title = re.sub(r"\s+", " ", c["title"]).strip()
        if not title:
            continue
        text = re.sub(r"[ \t ]+", " ", "".join(c["chunks"]))
        text = re.sub(r"\s*\n\s*", "\n", text).strip()
        # The site has no page per announcement; a hash of the title keeps source_url unique and stable.
        key = hashlib.sha1(title.encode("utf-8")).hexdigest()[:12]
        items.append({
            "source_url": f"{HOME}#{key}",
            "title": title,
            "text": text,
            "external_url": _pick_external_url(c["links"]),
            "image_url": c["image"],
            "fetched_at": fetched_at,
            "tags": ["informatics", "programming"],   # everything on INFOS is competitive informatics
            "_source": {
                "site": "infos",
                "page_url": page_url,
                "uploaded_at": _parse_dt(c["uploaded"]),
                "edited_at": _parse_dt(c["edited"] or ""),
                "attachments": [l["href"] for l in c["links"] if "/files/" in l["href"]],
            },
        })
    return items


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-o", "--output", required=True)
    ap.add_argument("--html", help="parse a saved HTML file instead of fetching")
    ap.add_argument("--pages", type=int, default=1, help="how many pages of the home feed to fetch")
    args = ap.parse_args()

    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    items: list[dict] = []
    if args.html:
        items = cards_to_raw_items(Path(args.html).read_text(encoding="utf-8"), HOME, fetched_at)
    else:
        for page in range(1, args.pages + 1):
            url = HOME if page == 1 else f"{HOME}?page={page}"
            if page > 1:
                time.sleep(1.0)
            items += cards_to_raw_items(fetch_html(url), url, fetched_at)

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(items)} raw items -> {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
