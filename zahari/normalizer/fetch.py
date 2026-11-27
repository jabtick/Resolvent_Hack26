"""Generic page fetcher: URL -> raw item (the input format of normalize.py).

Works for simple announcement pages (one opportunity per page). Sites with lists,
PDFs or JavaScript need their own adapter that outputs the same raw-item format.

Usage:
    python fetch.py urls.txt -o out/raw_items.json     # one URL per line, '#' = comment
    python fetch.py https://example.org/page -o out/raw.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin

USER_AGENT = "Mozilla/5.0 (compatible; OpportunityFeedBot/0.1)"
SKIP_TAGS = {"script", "style", "noscript", "nav", "footer", "header", "aside", "form", "svg"}
BLOCK_TAGS = {"p", "li", "h1", "h2", "h3", "h4", "td", "th", "div", "section", "article", "br", "tr"}


class _PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta: dict[str, str] = {}
        self.title = ""
        self.h1 = ""
        self._in_title = self._in_h1 = False
        self._skip = 0
        self.chunks: list[str] = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta":
            key = (a.get("property") or a.get("name") or "").lower()
            if key and a.get("content"):
                self.meta[key] = a["content"]
        elif tag in SKIP_TAGS:
            self._skip += 1
        elif tag == "title":
            self._in_title = True
        elif tag == "h1":
            self._in_h1 = True
        if tag in BLOCK_TAGS:
            self.chunks.append("\n")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS and self._skip:
            self._skip -= 1
        elif tag == "title":
            self._in_title = False
        elif tag == "h1":
            self._in_h1 = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data
            return
        if self._skip:
            return
        if self._in_h1:
            self.h1 += data
        self.chunks.append(data)


def fetch_html(url: str, timeout: float = 20.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "bg,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        charset = resp.headers.get_content_charset() or "utf-8"
    return raw.decode(charset, errors="replace")


def page_to_raw_item(url: str, html_text: str) -> dict:
    p = _PageParser()
    p.feed(html_text)
    title = (p.meta.get("og:title") or p.h1 or p.title).strip()
    text = "".join(p.chunks)
    image = p.meta.get("og:image")
    return {
        "source_url": url,
        "title": title,
        "text": text,
        "image_url": urljoin(url, image) if image else None,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", help="a URL or a text file with one URL per line")
    ap.add_argument("-o", "--output", required=True)
    ap.add_argument("--delay", type=float, default=1.0, help="seconds between requests (be polite)")
    args = ap.parse_args()

    if args.source.startswith("http"):
        urls = [args.source]
    else:
        urls = [l.strip() for l in Path(args.source).read_text(encoding="utf-8").splitlines()
                if l.strip() and not l.startswith("#")]

    items = []
    for i, url in enumerate(urls):
        if i:
            time.sleep(args.delay)
        try:
            items.append(page_to_raw_item(url, fetch_html(url)))
            print(f"ok   {url}", file=sys.stderr)
        except Exception as e:
            print(f"fail {url}: {e}", file=sys.stderr)

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(items)} raw items -> {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
