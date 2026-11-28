"""Rule-based extraction from Bulgarian/English free text.

Every function takes plain text (title and/or body) and returns one field of an
`opportunities` row. No network, no AI, standard library only, so it runs anywhere,
including later inside a scheduled job. An AI step can be put in front of it later;
it should then output the same raw-item format (see README).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date, datetime, time, timedelta, timezone

from taxonomy import GRADE_BANDS, IMPLIED, TAGS

# ---------------------------------------------------------------------------
# Keyword helpers
# ---------------------------------------------------------------------------

_pattern_cache: dict[str, re.Pattern] = {}


def _kw_pattern(kw: str) -> re.Pattern:
    """Keyword must start at a word boundary; a trailing space in the keyword means
    it must also end at a word boundary ("law " does not match "lawn")."""
    p = _pattern_cache.get(kw)
    if p is None:
        core = re.escape(kw.strip())
        tail = r"(?!\w)" if kw.endswith(" ") else ""
        p = re.compile(r"(?<!\w)" + core + tail)
        _pattern_cache[kw] = p
    return p


def count_keywords(text: str, keywords) -> int:
    return sum(len(_kw_pattern(k).findall(text)) for k in keywords)


def first_keyword(text: str, keywords) -> str | None:
    for k in keywords:
        if _kw_pattern(k).search(text):
            return k.strip()
    return None


# ---------------------------------------------------------------------------
# Type
# ---------------------------------------------------------------------------

OPPORTUNITY_TYPES = ("competition", "scholarship", "internship", "open_day", "university_program")

TYPE_KEYWORDS: dict[str, tuple[str, ...]] = {
    "competition": ("олимпиад", "състезан", "конкурс", "хакатон", "турнир", "шампионат", "olympiad",
                    "competition", "contest", "hackathon", "challenge", "tournament", "game jam"),
    "scholarship": ("стипенди", "scholarship", "грант", "grant", "fellowship", "финансиране за обучение"),
    "internship": ("стаж ", "стажа", "стажове", "стажант", "стажантск", "стажуван", "internship",
                   "intern ", "interns", "trainee", "работа за студенти"),
    "open_day": ("ден на отворените врати", "дни на отворените врати", "отворени врати", "open day",
                 "open days", "open house", "кандидатстудентски панаир", "образователно изложение",
                 "education fair"),
    "university_program": ("бакалавърска програма", "магистърска програма", "специалност",
                           "специалности", "прием на студенти", "кандидатстудентск", "кандидатстване в",
                           "лятно училище", "лятна академия", "summer school", "degree", "bachelor",
                           "master's", "учебна програма", "академия"),
}

# When scores tie, the earlier type wins (open days are often also "programmes").
_TYPE_PRIORITY = ("open_day", "internship", "scholarship", "competition", "university_program")


def detect_type(title: str, body: str) -> tuple[str | None, dict[str, int]]:
    scores = {}
    for t, kws in TYPE_KEYWORDS.items():
        scores[t] = 3 * count_keywords(title, kws) + count_keywords(body, kws)
    best = max(_TYPE_PRIORITY, key=lambda t: (scores[t], -_TYPE_PRIORITY.index(t)))
    return (best if scores[best] > 0 else None), scores


# ---------------------------------------------------------------------------
# City
# ---------------------------------------------------------------------------

# canonical name, latin spellings, adjective stem (e.g. "Бургаски свободен университет")
_CITIES: tuple[tuple[str, tuple[str, ...], str | None], ...] = (
    ("София", ("sofia",), "софийск"),
    ("Пловдив", ("plovdiv",), "пловдивск"),
    ("Варна", ("varna",), "варненск"),
    ("Бургас", ("burgas", "bourgas"), "бургаск"),
    ("Русе", ("ruse", "rousse"), "русенск"),
    ("Стара Загора", ("stara zagora",), "старозагорск"),
    ("Плевен", ("pleven",), "плевенск"),
    ("Велико Търново", ("veliko tarnovo", "veliko turnovo"), "великотърновск"),
    ("Благоевград", ("blagoevgrad",), "благоевградск"),
    ("Шумен", ("shumen",), "шуменск"),
    ("Габрово", ("gabrovo",), "габровск"),
    ("Сливен", ("sliven",), "сливенск"),
    ("Добрич", ("dobrich",), "добричк"),
    ("Перник", ("pernik",), "перническ"),
    ("Хасково", ("haskovo",), "хасковск"),
    ("Ямбол", ("yambol",), "ямболск"),
    ("Пазарджик", ("pazardzhik",), "пазарджишк"),
    ("Враца", ("vratsa",), "врачанск"),
    ("Видин", ("vidin",), "видинск"),
    ("Монтана", ("montana",), None),
    ("Ловеч", ("lovech",), "ловешк"),
    ("Кюстендил", ("kyustendil",), "кюстендилск"),
    ("Кърджали", ("kardzhali", "kurdzhali"), "кърджалийск"),
    ("Смолян", ("smolyan",), "смолянск"),
    ("Силистра", ("silistra",), "силистренск"),
    ("Търговище", ("targovishte",), "търговищк"),
    ("Разград", ("razgrad",), "разградск"),
    ("Асеновград", ("asenovgrad",), None),
    ("Казанлък", ("kazanlak",), "казанлъшк"),
    ("Димитровград", ("dimitrovgrad",), None),
    ("Дупница", ("dupnitsa",), None),
    ("Петрич", ("petrich",), None),
    ("Сандански", ("sandanski",), None),
    ("Самоков", ("samokov",), None),
    ("Ботевград", ("botevgrad",), None),
    ("Свищов", ("svishtov",), "свищовск"),
    ("Севлиево", ("sevlievo",), None),
    ("Гоце Делчев", ("gotse delchev",), None),
    ("Карлово", ("karlovo",), None),
    ("Велинград", ("velingrad",), None),
    ("Несебър", ("nesebar", "nessebar"), None),
    ("Поморие", ("pomorie",), None),
    ("Созопол", ("sozopol",), None),
    ("Правец", ("pravets",), None),
)


def _city_patterns():
    out = []
    for name, latin, adj in _CITIES:
        full = [name.lower() + " ", *(l + " " for l in latin)]  # whole word
        out.append((name, full, (adj,) if adj else ()))
    return out


_CITY_PATTERNS = _city_patterns()


def known_city(value: str | None) -> str | None:
    """Canonical Bulgarian city found in `value`, or None (unlike normalize_city, never echoes free text)."""
    if not value:
        return None
    v = value.lower()
    for name, full, adj in _CITY_PATTERNS:
        if count_keywords(v + " ", full) or (adj and count_keywords(v, adj)):
            return name
    return None


def normalize_city(value: str | None) -> str | None:
    """Map a free city string ('гр. Бургас', 'Burgas', 'София-град') to the canonical name."""
    if not value:
        return None
    v = value.lower()
    for name, full, adj in _CITY_PATTERNS:
        if count_keywords(v, full) or (adj and count_keywords(v, adj)):
            return name
    cleaned = re.sub(r"^(гр\.?|град|с\.|село)\s*", "", value.strip(), flags=re.I)
    return cleaned or None


FOREIGN_PLACES = ("чужбина", "румъния", "букурещ", "кипър", "пафос", "гърция", "атина", "солун",
                  "сърбия", "белград", "турция", "истанбул", "северна македония", "скопие", "германия",
                  "австрия", "унгария", "полша", "чехия", "словакия", "словения", "хърватия", "италия",
                  "испания", "франция", "холандия", "нидерландия", "белгия", "великобритания", "англия",
                  "швейцария", "молдова", "украйна", "грузия", "сащ", "египет", "япония", "китай",
                  "казахстан", "kazakhstan", "литва", "латвия", "естония", "португалия", "швеция",
                  "romania", "bucharest", "cyprus", "greece", "serbia", "turkey", "germany", "austria",
                  "hungary", "poland", "italy", "spain", "france", "netherlands", "uk", "usa", "abroad")


def detect_abroad(title: str) -> str | None:
    """A foreign place in the title means the event is held abroad."""
    return first_keyword(title, FOREIGN_PLACES)


def detect_city(title: str, body: str) -> tuple[str | None, dict[str, float]]:
    if detect_abroad(title):
        return None, {}
    scores: dict[str, float] = {}
    for name, full, adj in _CITY_PATTERNS:
        s = 3 * count_keywords(title, full) + count_keywords(body, full)
        s += 0.5 * (count_keywords(title, adj) + count_keywords(body, adj))
        if s:
            scores[name] = s
    if not scores:
        return None, scores
    return max(scores, key=scores.get), scores


# ---------------------------------------------------------------------------
# Online / audience / grades
# ---------------------------------------------------------------------------

ONLINE_KEYWORDS = ("онлайн", "online", "он-лайн", "дистанционн", "виртуал", "virtual", "remote",
                   "уебинар", "webinar", "zoom", "google meet", "ms teams", "хибрид", "hybrid")

SCHOOL_KEYWORDS = ("ученик", "ученици", "ученичк", "училищ", "гимназ", "клас ", "класове",
                   "school students", "high school", "pupils", "абитуриент")
UNIVERSITY_KEYWORDS = ("студент", "бакалав", "магист", "докторант", "висше образование", "висши училища",
                       "university students", "undergraduate", "graduate", "bachelor", "phd")

_TYPE_DEFAULT_AUDIENCE = {
    "competition": "school",
    "open_day": "school",
    "internship": "university",
    "scholarship": "both",
    "university_program": "both",
}


def detect_online(text: str) -> bool:
    return count_keywords(text, ONLINE_KEYWORDS) > 0


def detect_audience(text: str, grades: set[int], opp_type: str | None) -> str:
    school = count_keywords(text, SCHOOL_KEYWORDS) + (3 if grades else 0)
    uni = count_keywords(text, UNIVERSITY_KEYWORDS)
    if school and uni:
        return "both"
    if school:
        return "school"
    if uni:
        return "university"
    return _TYPE_DEFAULT_AUDIENCE.get(opp_type or "", "both")


_ROMAN = {"i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8, "ix": 9, "x": 10,
          "xi": 11, "xii": 12}
_ORD = r"(?:\s*-?\s*(?:ти|ви|ри|ми|и))?"           # 8-ми, 11-ти, 12-и
_NUM = r"(\d{1,2}|[ivx]{1,4})"
_GRADE_RANGE = re.compile(rf"(?<!\w)(?:от\s+)?{_NUM}{_ORD}\s*(?:клас\s*)?(?:[-–—]|до)\s*{_NUM}{_ORD}\s*клас")
_GRADE_SINGLE = re.compile(rf"(?<!\w){_NUM}{_ORD}\s*(?:и\s+{_NUM}{_ORD}\s*)?клас")
_GRADE_EN = re.compile(r"grades?\s+(\d{1,2})(?:\s*(?:-|–|to)\s*(\d{1,2}))?")


def _grade_num(tok: str | None) -> int | None:
    if not tok:
        return None
    n = int(tok) if tok.isdigit() else _ROMAN.get(tok)
    return n if n and 1 <= n <= 12 else None


def detect_grades(text: str) -> set[int]:
    grades: set[int] = set()
    for m in _GRADE_RANGE.finditer(text):
        a, b = _grade_num(m.group(1)), _grade_num(m.group(2))
        if a and b and a <= b:
            grades.update(range(a, b + 1))
    for m in _GRADE_SINGLE.finditer(text):
        for tok in (m.group(1), m.group(2)):
            n = _grade_num(tok)
            if n:
                grades.add(n)
    for m in _GRADE_EN.finditer(text):
        a, b = _grade_num(m.group(1)), _grade_num(m.group(2))
        if a and b and a <= b:
            grades.update(range(a, b + 1))
        elif a:
            grades.add(a)
    return grades


def grade_band_tags(grades: set[int]) -> list[str]:
    return [slug for slug, lo, hi in GRADE_BANDS if any(lo <= g <= hi for g in grades)]


# ---------------------------------------------------------------------------
# Tags
# ---------------------------------------------------------------------------

def detect_tags(title: str, body: str, grades: set[int], audience: str,
                extra_hints: list[str] | None = None) -> tuple[list[str], dict[str, float]]:
    """Return tag slugs ordered by relevance (most relevant first) plus their scores.

    Relevance = 3 x hits in title + hits in body (+ hints). Grade bands and implied tags
    get a fixed score so they always appear, but after the strong topic tags.
    """
    hint_text = " ".join(extra_hints or []).lower()
    scores: dict[str, float] = {}
    for tag in TAGS:
        if not tag.keywords:
            continue
        s = 3 * count_keywords(title, tag.keywords) + count_keywords(body, tag.keywords)
        s += 2 * count_keywords(hint_text, tag.keywords)
        if tag.slug in (h.strip().lower() for h in extra_hints or []):
            s += 3
        if s:
            scores[tag.slug] = float(s)

    for slug in grade_band_tags(grades):
        scores[slug] = max(scores.get(slug, 0), 2.0)
    if audience == "university" and "university-students" not in scores:
        scores["university-students"] = 2.0

    for slug, implied in IMPLIED.items():
        if slug in scores:
            for i in implied:
                scores[i] = max(scores.get(i, 0), 1.0)

    ordered = sorted(scores, key=lambda s: (-scores[s], s))
    return ordered, scores


# ---------------------------------------------------------------------------
# Dates
# ---------------------------------------------------------------------------

MONTHS = {
    # Bulgarian
    "януари": 1, "февруари": 2, "март": 3, "април": 4, "май": 5, "юни": 6, "юли": 7, "август": 8,
    "септември": 9, "октомври": 10, "ноември": 11, "декември": 12,
    "яну": 1, "фев": 2, "апр": 4, "авг": 8, "сеп": 9, "септ": 9, "окт": 10, "ное": 11, "дек": 12,
    # English
    "january": 1, "february": 2, "march": 3, "april": 4, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7, "aug": 8, "sep": 9, "sept": 9,
    "oct": 10, "nov": 11, "dec": 12,
}
_MONTH_RE = "|".join(sorted(map(re.escape, MONTHS), key=len, reverse=True))
_DAY_SUFFIX = r"(?:\s*-?\s*(?:ти|ви|ри|ми|st|nd|rd|th))?"
_YEAR = r"(?:\s*,?\s*(\d{4})\s*(?:г\.?|година)?)?"
_TIME = re.compile(r"^\s*,?\s*(?:от|в|at|@)?\s*(\d{1,2})[:.](\d{2})\s*(?:ч\.?|часа|h)?")

_DATE_PATTERNS: tuple[tuple[str, re.Pattern], ...] = (
    # 28 май до 1 юни 2027 / 30 ноември – 2 декември
    ("text_range2", re.compile(rf"(?<!\d)(\d{{1,2}}){_DAY_SUFFIX}\s+({_MONTH_RE})(?!\w)\s*(?:[-–—]|до)\s*(\d{{1,2}}){_DAY_SUFFIX}\s+({_MONTH_RE})(?!\w){_YEAR}")),
    # 12–14 март 2026 / 12 - 14 march
    ("text_range", re.compile(rf"(?<!\d)(\d{{1,2}}){_DAY_SUFFIX}\s*(?:[-–—]|до)\s*(\d{{1,2}}){_DAY_SUFFIX}\s+({_MONTH_RE})(?!\w){_YEAR}")),
    # 12.03 – 14.03.2026 / 12.03.2026 - 14.03.2026
    ("num_range", re.compile(r"(?<![\d.])(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\s*(?:г\.?)?\s*(?:[-–—]|до)\s*(\d{1,2})\.(\d{1,2})\.(\d{4})")),
    # 2026-03-15 or 2026-03-15T10:00
    ("iso", re.compile(r"(?<!\d)(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?")),
    # 15.03.2026 / 15/03/2026 / 15.03.26
    ("num", re.compile(r"(?<![\d.])(\d{1,2})[./](\d{1,2})[./](\d{4}|\d{2})(?![\d])\s*(?:г\.?)?")),
    # 15 март 2026 / 15-ти март / 15 march 2026
    ("text", re.compile(rf"(?<!\d)(\d{{1,2}}){_DAY_SUFFIX}\s+({_MONTH_RE})(?!\w){_YEAR}")),
    # March 15, 2026
    ("text_en", re.compile(rf"(?<!\w)({_MONTH_RE})\s+(\d{{1,2}}){_DAY_SUFFIX}(?:\s*,?\s*(\d{{4}}))?")),
    # 28.11 (no year) — last, so it never eats part of a full date
    ("num_short", re.compile(r"(?<![\d.,])(\d{1,2})\.(\d{1,2})(?![\d.,]*\d)")),
)

DEADLINE_WORDS = ("срок", "краен срок", "крайният срок", "до ", "кандидатст", "регистрац", "записван",
                  "заявк", "подаване", "попълване", "deadline", "apply by", "apply until", "apply before",
                  "applications close", "registration", "submit", "не по-късно от")
START_WORDS = ("провежда", "проведе", "провеждане", "начало", "започва", "старт", "ще се", "дата на",
               "на дата", "от ", "кръг", "етап", "събитието", "откриване", "held", "starts", "takes place",
               "will be", "event date", "on ", "състезателен ден", "денят на", "ден:", "day")
END_WORDS = ("приключва", "завършва", "край на", "закриване", "ends", "until")
IGNORE_WORDS = ("публикува", "публикацията", "обновен", "актуализ", "posted", "updated", "published",
                "©", "copyright", "дата на раждане", "роден", "версия", "version", "издание от")


@dataclass
class DateMention:
    start: date
    end: date | None
    at: time | None
    pos: int
    role: str          # deadline / start / end / range / unknown
    raw: str


@dataclass
class Dates:
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    deadline_at: datetime | None = None
    mentions: list[DateMention] = field(default_factory=list)


def _sofia_tz(d: date) -> timezone:
    """Europe/Sofia offset without needing tzdata on Windows: EET +02, EEST +03
    from the last Sunday of March to the last Sunday of October."""
    def last_sunday(year: int, month: int) -> date:
        last = date(year, month + 1, 1) - timedelta(days=1)
        return last - timedelta(days=(last.weekday() + 1) % 7)
    dst = last_sunday(d.year, 3) <= d < last_sunday(d.year, 10)
    return timezone(timedelta(hours=3 if dst else 2))


def to_timestamptz(d: date, t: time | None, end_of_day: bool) -> datetime:
    if t is None:
        t = time(23, 59) if end_of_day else time(0, 0)
    return datetime.combine(d, t, tzinfo=_sofia_tz(d))


def _infer_year(month: int, day: int, year: str | None, ref: date) -> int | None:
    if year:
        y = int(year)
        if y < 100:
            y += 2000
        return y
    # No year written: pick the occurrence closest to the reference date, preferring the future.
    y = ref.year
    try:
        candidate = date(y, month, day)
    except ValueError:
        return None
    if candidate < ref - timedelta(days=120):
        y += 1
    return y


def _safe_date(y: int | None, m: int, d: int) -> date | None:
    if y is None:
        return None
    try:
        return date(y, m, d)
    except ValueError:
        return None


def _role(context: str) -> str:
    """Role of a date = the keyword group whose keyword appears closest before it."""
    best_role, best_pos = "unknown", -1
    for role, words in (("ignore", IGNORE_WORDS), ("deadline", DEADLINE_WORDS),
                        ("end", END_WORDS), ("start", START_WORDS)):
        for w in words:
            for m in _kw_pattern(w).finditer(context):
                if m.start() > best_pos:
                    best_role, best_pos = role, m.start()
    return best_role


def find_dates(text: str, ref: date) -> list[DateMention]:
    taken: list[tuple[int, int]] = []
    found: list[DateMention] = []

    def overlaps(a: int, b: int) -> bool:
        return any(a < y and x < b for x, y in taken)

    for kind, pat in _DATE_PATTERNS:
        for m in pat.finditer(text):
            if overlaps(m.start(), m.end()):
                continue
            g = m.groups()
            start = end = None
            if kind == "text_range2":
                m1, m2 = MONTHS[g[1]], MONTHS[g[3]]
                y2 = _infer_year(m2, int(g[2]), g[4], ref)
                y1 = y2 - 1 if y2 and m1 > m2 else y2
                start, end = _safe_date(y1, m1, int(g[0])), _safe_date(y2, m2, int(g[2]))
            elif kind == "num_short":
                d_, m_ = int(g[0]), int(g[1])
                if not (1 <= m_ <= 12 and 1 <= d_ <= 31):
                    continue
                start = _safe_date(_infer_year(m_, d_, None, ref), m_, d_)
            elif kind == "text_range":
                month = MONTHS[g[2]]
                y = _infer_year(month, int(g[0]), g[3], ref)
                start, end = _safe_date(y, month, int(g[0])), _safe_date(y, month, int(g[1]))
            elif kind == "num_range":
                y2 = int(g[5])
                end = _safe_date(y2, int(g[4]), int(g[3]))
                start = _safe_date(int(g[2]) if g[2] else y2, int(g[1]), int(g[0]))
            elif kind == "iso":
                start = _safe_date(int(g[0]), int(g[1]), int(g[2]))
            elif kind == "num":
                y = _infer_year(int(g[1]), int(g[0]), g[2], ref)
                start = _safe_date(y, int(g[1]), int(g[0]))
            elif kind == "text":
                month = MONTHS[g[1]]
                start = _safe_date(_infer_year(month, int(g[0]), g[2], ref), month, int(g[0]))
            elif kind == "text_en":
                month = MONTHS[g[0]]
                start = _safe_date(_infer_year(month, int(g[1]), g[2], ref), month, int(g[1]))
            if start is None or not (2000 <= start.year <= ref.year + 3):
                continue
            if end is not None and end < start:
                end = None

            at = None
            if kind == "iso" and g[3]:
                at = time(int(g[3]), int(g[4]))
            else:
                tm = _TIME.match(text[m.end():m.end() + 25])
                if tm and int(tm.group(1)) < 24 and int(tm.group(2)) < 60:
                    at = time(int(tm.group(1)), int(tm.group(2)))

            context = text[max(0, m.start() - 70):m.start()]
            role = _role(context)
            if end is not None and role != "ignore":
                role = "range" if role in ("unknown", "start", "end") else role
            taken.append((m.start(), m.end()))
            found.append(DateMention(start, end, at, m.start(), role, m.group(0)))

    found.sort(key=lambda d: d.pos)
    return found


def resolve_dates(title: str, body: str, opp_type: str | None, ref: date) -> Dates:
    title_mentions = find_dates(title, ref)
    body_mentions = find_dates(body, ref)
    mentions = title_mentions + body_mentions
    usable = [d for d in mentions if d.role != "ignore"]
    out = Dates(mentions=mentions)

    deadlines = [d for d in usable if d.role == "deadline"]
    events = [d for d in usable if d.role in ("start", "range")]
    ends = [d for d in usable if d.role == "end"]
    unknown = [d for d in usable if d.role == "unknown"]

    # A date in the title ("..., 27 - 29 ноември 2026 г.") is almost always when the event
    # happens; the body often mentions other events (next rounds, related olympiads).
    title_events = [d for d in title_mentions if d.role not in ("ignore", "deadline")]
    if title_events:
        events, ends, unknown = title_events, [], []

    # Nothing labelled: decide by type what a bare date most likely is.
    if not deadlines and not events and unknown:
        if opp_type in ("scholarship", "internship"):
            deadlines = unknown
        else:
            events = unknown

    if deadlines:
        upcoming = [d for d in deadlines if d.start >= ref]
        pick = min(upcoming, key=lambda d: d.start) if upcoming else max(deadlines, key=lambda d: d.start)
        out.deadline_at = to_timestamptz(pick.start, pick.at, end_of_day=True)

    if events:
        first = min(events, key=lambda d: d.start)
        out.starts_at = to_timestamptz(first.start, first.at, end_of_day=False)
        last_end = max((d.end or d.start) for d in events)
        if any(d.end for d in events) or last_end > first.start:
            out.ends_at = to_timestamptz(last_end, None, end_of_day=True)
    if ends:
        e = max(ends, key=lambda d: d.start)
        if out.starts_at is None or e.start >= out.starts_at.date():
            out.ends_at = to_timestamptz(e.start, e.at, end_of_day=True)

    # A deadline after the event has started usually means we mislabeled; drop the deadline.
    if out.deadline_at and out.starts_at and out.deadline_at.date() > out.starts_at.date():
        out.deadline_at = None
    return out


def parse_hint_datetime(value: str | None, end_of_day: bool, ref: date) -> datetime | None:
    """Parse a date string a source already isolated (e.g. a 'Deadline:' field)."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            return to_timestamptz(dt.date(), dt.time() if (dt.hour or dt.minute) else None, end_of_day)
        return dt
    except ValueError:
        pass
    ms = find_dates(value.lower(), ref)
    if not ms:
        return None
    return to_timestamptz(ms[0].start, ms[0].at, end_of_day)
