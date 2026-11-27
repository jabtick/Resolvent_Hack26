"""Turn raw calendar JSONs from the bucket into `opportunities` rows with tags.

Input: one or more raw JSON files (or folders of them) shaped like
samples/infos_calendar.json: {"source": "...", "events": [{"title", "raw_date_text", ...}]}.
Output: one JSON with the tags used and the opportunities, following the
`opportunities` table in docs/database-schema.md.

Usage:
    python process_bucket.py                       # samples/infos_calendar.json -> out/opportunities.json
    python process_bucket.py bucket/ -o out/x.json --today 2026-11-27
"""

import argparse
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).parent

# ---------------------------------------------------------------- tags

TAGS = {
    "informatics": "Информатика",
    "math": "Математика",
    "physics": "Физика",
    "chemistry": "Химия",
    "biology": "Биология",
    "olympiad": "Олимпиада",
    "tournament": "Турнир / състезание",
    "camp": "Лагер / школа",
    "team": "Отборно",
    "girls-only": "Само за момичета",
    "level-municipal": "Общински кръг",
    "level-regional": "Областен кръг",
    "level-national": "Национално",
    "level-international": "Международно",
}

# (tag, regex on lowercased title + description)
TAG_RULES = [
    ("informatics", r"информатик|програмиран|informatic|programming|\bcode\b"),
    ("math", r"математик|\bmath"),
    ("physics", r"физик|physics"),
    ("chemistry", r"химия|chemistry"),
    ("biology", r"биологи|biology"),
    ("olympiad", r"олимпиад|olympiad"),
    ("camp", r"лагер|школа|\bcamp\b"),
    ("tournament", r"турнир|състезани|първенство|\bcup\b|contest|master"),
    ("team", r"отбор|\bteam"),
    ("girls-only", r"момичета|\bgirls"),
    ("level-municipal", r"общински"),
    ("level-regional", r"областен"),
    ("level-national", r"национал|републиканск"),
    ("level-international", r"международ|балканск|европейск|international|balkan|european"),
]

# Tags every event of a source gets (the infos calendar is informatics only).
SOURCE_DEFAULT_TAGS = {
    "infos.infosbg.com": ["informatics"],
}

# ---------------------------------------------------------------- dates

MONTHS = {
    "януари": 1, "февруари": 2, "март": 3, "април": 4, "май": 5, "юни": 6,
    "юли": 7, "август": 8, "септември": 9, "октомври": 10, "ноември": 11, "декември": 12,
}

DATE_RE = re.compile(
    r"(?P<d1>\d{1,2}|\?)?\s*(?P<m1>[а-я]+)?\s*(?P<y1>\d{4})?\s*"
    r"(?:-\s*(?P<d2>\d{1,2})\s*(?P<m2>[а-я]+)?\s*(?P<y2>\d{4})?)?"
)


def parse_dates(date_text):
    """'27 - 29 ноември 2026 г.' -> (start, end, time). Unknown parts -> None."""
    t = date_text.lower().strip()
    time_m = re.search(r"(\d{1,2}):(\d{2})", t)
    time = (int(time_m.group(1)), int(time_m.group(2))) if time_m else None
    until = t.startswith("до ")
    t = re.sub(r"^до\s+", "", t)
    t = re.sub(r"\d{1,2}:\d{2}.*$", "", t).replace("г.", "").strip()

    m = DATE_RE.fullmatch(t)
    if not m or m["d1"] in (None, "?"):
        return None, None, None
    m1 = MONTHS.get(m["m1"]) if m["m1"] else None
    m2 = MONTHS.get(m["m2"]) if m["m2"] else None
    if (m["m1"] and not m1) or (m["m2"] and not m2):
        return None, None, None  # a word that is not a month
    y_end = int(m["y2"] or m["y1"] or 0)
    m_end = m2 or m1
    if not y_end or not m_end:
        return None, None, None
    m_start = m1 or m2
    y_start = int(m["y1"]) if m["y1"] else (y_end - 1 if m_start > m_end else y_end)

    start = date(y_start, m_start, int(m["d1"]))
    end = date(y_end, m_end, int(m["d2"])) if m["d2"] else start
    if until:
        return None, end, None
    return start, end, time


def _last_sunday(year, month):
    d = date(year, month + 1, 1) - timedelta(days=1)
    return d - timedelta(days=(d.weekday() + 1) % 7)


def sofia_offset(d):
    """Bulgarian time: +03:00 from the last Sunday of March to the last Sunday of October."""
    return "+03:00" if _last_sunday(d.year, 3) <= d < _last_sunday(d.year, 10) else "+02:00"


def to_ts(d, hh=0, mm=0, ss=0):
    return f"{d.isoformat()}T{hh:02d}:{mm:02d}:{ss:02d}{sofia_offset(d)}" if d else None

# ---------------------------------------------------------------- places

COUNTRIES = {
    "Турция", "Полша", "Казахстан", "Германия", "Румъния", "Гърция", "Сърбия",
    "Северна Македония", "Унгария", "Италия", "Франция", "Испания", "Австрия",
}
PLACE_PREFIX = re.compile(r"^(гр\.|град|курорт|с\.)\s*", re.I)


def parse_place(place_text):
    """', гр. Варшава, Полша' -> (city, country, online)."""
    parts = [PLACE_PREFIX.sub("", p.strip()) for p in place_text.split(",")]
    parts = [p for p in parts if p and p != "?"]
    online = any(p.lower() == "онлайн" for p in parts)
    parts = [p for p in parts if p.lower() != "онлайн"]
    city = country = None
    if len(parts) >= 2:
        city, country = parts[0], parts[-1]
    elif parts:
        if parts[0] in COUNTRIES:
            country = parts[0]
        else:
            city = parts[0]
    if country == "България":
        country = None
    return city, country, online

# ---------------------------------------------------------------- slugs

TRANSLIT = dict(zip(
    "абвгдежзийклмнопрстуфхцчшщъьюя",
    ["a", "b", "v", "g", "d", "e", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r",
     "s", "t", "u", "f", "h", "ts", "ch", "sh", "sht", "a", "y", "yu", "ya"],
))


def slugify(text, max_len=50):
    s = "".join(TRANSLIT.get(c, c) for c in text.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    if len(s) > max_len:
        s = s[:max_len].rsplit("-", 1)[0]
    return s

# ---------------------------------------------------------------- one event


def classify_type(text):
    if re.search(r"стипенди|scholarship", text):
        return "scholarship"
    if re.search(r"стаж|internship", text):
        return "internship"
    if re.search(r"отворени врати|open day", text):
        return "open_day"
    if re.search(r"бакалавър|магистър|специалност", text):
        return "university_program"
    return "competition"


def classify_audience(title):
    t = title.lower()
    school = bool(re.search(r"ученик|ученическ|училищ", t))
    uni = bool(re.search(r"студент|университет", t))
    if school and uni:
        return "both"
    return "university" if uni else "school"


# Matched on the title only: descriptions often name a *different*, co-located
# event ("съвместно с Международен турнир ..."), which would give wrong tags.
TITLE_ONLY_TAGS = {"olympiad", "level-municipal", "level-regional", "level-national", "level-international"}


def build_tags(text, title, country, source_host):
    tags = list(SOURCE_DEFAULT_TAGS.get(source_host, []))
    for tag, rx in TAG_RULES:
        haystack = title.lower() if tag in TITLE_ONLY_TAGS else text
        if re.search(rx, haystack) and tag not in tags:
            tags.append(tag)
    # A title with no Cyrillic on a Bulgarian site, or an event abroad, is international.
    if (country or not re.search(r"[а-яА-Я]", title)) and "level-international" not in tags:
        tags.append("level-international")
    # A competition that is neither an olympiad nor a camp is a tournament.
    if not {"olympiad", "camp", "tournament"} & set(tags):
        tags.append("tournament")
    return sorted(tags, key=list(TAGS).index)


def sentence(s):
    s = s.strip()
    if not s:
        return s
    s = s[0].upper() + s[1:]
    return s if s.endswith((".", "!", "?", ")")) else s + "."


def build_opportunity(ev, source_url_base, source_host, today):
    title = ev["title"].strip()
    raw_date = ev.get("raw_date_text") or ""
    date_part, _, place_part = raw_date.partition(",")
    start, end, time = parse_dates(date_part)
    p_city, country, p_online = parse_place(place_part)

    city = ev.get("city") or p_city
    raw_desc = ev.get("description") or ""
    text = f"{title} {raw_desc}".lower()
    is_online = bool(ev.get("online")) or p_online or "онлайн" in text

    desc = [sentence(raw_desc)] if raw_desc else []
    if country:
        desc.append(f"Провежда се в {city + ', ' if city else ''}{country}.")
    if not start and not end:
        desc.append("Датите още не са обявени.")

    last_day = end or start
    if last_day:
        status = "archived" if last_day < today else "published"
    else:
        status = "archived" if ev.get("section") == "past" else "published"

    year = (start or end).year if (start or end) else (re.findall(r"\d{4}", raw_date) or [""])[0]
    slug = f"{slugify(title)}-{year}".strip("-")

    return {
        "type": classify_type(text),
        "organizer_id": None,
        "title": title,
        "description": " ".join(desc) or None,
        "image_url": None,
        "external_url": ev.get("url"),
        "city": city,
        "is_online": is_online,
        "audience": classify_audience(title),
        "starts_at": to_ts(start, *(time or (0, 0))),
        "ends_at": to_ts(end, 23, 59, 59),
        "deadline_at": None,
        "status": status,
        "source": "scraper",
        "source_url": f"{source_url_base}#{slug}",
        "tags": build_tags(text, title, country, source_host),
    }

# ---------------------------------------------------------------- run


def iter_input_files(paths):
    for p in paths:
        p = Path(p)
        yield from (sorted(p.glob("*.json")) if p.is_dir() else [p])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("inputs", nargs="*", default=[str(HERE / "samples" / "infos_calendar.json")])
    ap.add_argument("-o", "--output", default=str(HERE / "out" / "opportunities.json"))
    ap.add_argument("--today", default=date.today().isoformat(), help="for upcoming/past, YYYY-MM-DD")
    args = ap.parse_args()
    today = date.fromisoformat(args.today)

    opportunities, seen = [], set()
    for f in iter_input_files(args.inputs):
        data = json.loads(f.read_text(encoding="utf-8"))
        if "events" not in data:  # not a raw file (e.g. an output), skip
            continue
        source = data.get("source", "")
        host = re.sub(r"^https?://([^/]+).*", r"\1", source)
        for ev in data["events"]:
            opp = build_opportunity(ev, source, host, today)
            url, n = opp["source_url"], 2
            while opp["source_url"] in seen:  # keep source_url unique
                opp["source_url"], n = f"{url}-{n}", n + 1
            seen.add(opp["source_url"])
            opportunities.append(opp)

    used = sorted({t for o in opportunities for t in o["tags"]}, key=list(TAGS).index)
    out = {
        "generated_at": today.isoformat(),
        "tags": [{"slug": t, "name": TAGS[t]} for t in used],
        "opportunities": opportunities,
    }
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    sys.stdout.reconfigure(encoding="utf-8")
    for o in opportunities:
        when = " → ".join(filter(None, [(o["starts_at"] or "")[:10], (o["ends_at"] or "")[:10]])) or "?"
        where = ", ".join(filter(None, [o["city"], "онлайн" if o["is_online"] else None])) or "?"
        print(f"{o['title']}\n    {when} · {where} · {o['status']} · {', '.join(o['tags'])}")
    print(f"\n{len(opportunities)} opportunities -> {out_path}")


if __name__ == "__main__":
    main()
