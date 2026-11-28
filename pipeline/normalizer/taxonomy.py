"""Fixed tag list for opportunities (the `tags` table) and the keywords that trigger each tag.

The `tags` table only has (id, name, slug). The `group` here is used only in code,
to keep the list readable and for debugging; it is not stored in the database.

Keywords are lowercase stems matched at the start of a word, so "математ" matches
"математика", "математическа", "математици". Bulgarian and English are both listed,
because many sources (EU programmes, companies) post in English.

Run `python taxonomy.py` to print tags_seed.json for the database (Гошо / Ники).
"""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass


@dataclass(frozen=True)
class Tag:
    slug: str
    name: str          # Bulgarian display name
    group: str         # code-only grouping
    keywords: tuple[str, ...]


def _t(slug: str, name: str, group: str, *keywords: str) -> Tag:
    return Tag(slug, name, group, tuple(k.lower() for k in keywords))


TAGS: tuple[Tag, ...] = (
    # --- Subjects: STEM -------------------------------------------------------
    _t("math", "Математика", "subject", "математ", "math", "алгебр", "геометри"),
    _t("stem", "STEM / природни науки", "subject", "stem", "природни науки", "природо-математич",
       "science", "наука"),
    _t("informatics", "Информатика", "subject", "информатик", "informatics", "computer science",
       "компютърн", "алгоритм", "algorithm"),
    _t("programming", "Програмиране", "subject", "програмир", "programming", "coding", "кодиран",
       "python", "java", "c++", "javascript", "софтуер", "software", "разработчи", "developer"),
    _t("web-development", "Уеб разработка", "subject", "уеб разработ", "web develop", "frontend",
       "backend", "full stack", "fullstack", "уеб сайт", "website"),
    _t("ai-data", "Изкуствен интелект и данни", "subject", "изкуствен интелект", "artificial intelligence",
       "machine learning", "машинно обучение", "data science", "анализ на данни", "невронн", "neural", " ai "),
    _t("cybersecurity", "Киберсигурност", "subject", "киберсигурност", "cybersecurity", "cyber security",
       "информационна сигурност", "ctf", "capture the flag"),
    _t("robotics", "Роботика", "subject", "роботи", "robot", "arduino", "lego", "мехатрони"),
    _t("game-dev", "Разработка на игри", "subject", "разработка на игри", "game dev", "game jam",
       "unity", "unreal", "геймдев"),
    _t("engineering", "Инженерство", "subject", "инженер", "engineer", "електротехни", "електрони",
       "машиностро", "строителств"),
    _t("physics", "Физика", "subject", "физика", "физич", "physics"),
    _t("astronomy", "Астрономия", "subject", "астроном", "astronom", "космос", "космич", "space"),
    _t("chemistry", "Химия", "subject", "химия", "химич", "chemistry", "chemical"),
    _t("biology", "Биология", "subject", "биолог", "biology", "генети", "genetic"),
    _t("medicine", "Медицина и здраве", "subject", "медицин", "medicine", "medical", "здравеопаз",
       "фармаци", "pharma", "стоматолог", "health"),
    _t("ecology", "Екология и околна среда", "subject", "еколог", "ecolog", "околна среда", "environment",
       "климат", "climate", "устойчив", "sustainab"),
    _t("geography", "География", "subject", "географ", "geograph"),

    # --- Subjects: humanities & social ---------------------------------------
    _t("bulgarian-literature", "Български език и литература", "subject", "български език",
       "литератур", "bulgarian language"),
    _t("creative-writing", "Творческо писане", "subject", "творческо писане", "есе ", "есета", "essay", "разказ",
       "поезия", "стихотвор", "creative writing"),
    _t("history", "История", "subject", "история", "историч", "history", "цивилизаци"),
    _t("philosophy", "Философия", "subject", "философ", "philosoph", "етика", "ethics"),
    _t("civics", "Гражданско образование", "subject", "гражданск", "civic", "демократ", "democra",
       "права на човека", "human rights"),
    # not plain "право": "има право да" (has the right to) is very common
    _t("law", "Право", "subject", "право,", "право и ", "специалност право", "правни", "юрид",
       "law ", "legal", "адвокат"),
    _t("economics", "Икономика", "subject", "икономи", "econom", "финанс", "financ", "счетовод"),
    _t("entrepreneurship", "Предприемачество", "subject", "предприемач", "entrepreneur", "стартъп",
       "startup", "бизнес идея", "бизнес план", "business"),
    _t("marketing", "Маркетинг", "subject", "маркетинг", "marketing", "реклам", "advertis"),
    _t("psychology", "Психология", "subject", "психолог", "psycholog"),
    _t("journalism-media", "Журналистика и медии", "subject", "журналист", "journalis", "медии",
       "media", "репортаж", "подкаст", "podcast"),
    _t("debate", "Дебати и ораторство", "subject", "дебат", "debate", "ораторск", "public speaking",
       "реторик", "модел оон", "model un", "mun "),

    # --- Subjects: languages -------------------------------------------------
    _t("foreign-languages", "Чужди езици", "subject", "чужд език", "чужди езици", "foreign language",
       "езиков"),
    _t("english", "Английски език", "subject", "английск", "english"),
    _t("german", "Немски език", "subject", "немски", "german", "deutsch"),
    _t("french", "Френски език", "subject", "френски", "french", "français"),
    _t("spanish", "Испански език", "subject", "испански", "spanish", "español"),
    _t("russian", "Руски език", "subject", "руски език", "russian"),

    # --- Subjects: arts & sport ----------------------------------------------
    _t("arts", "Изобразително изкуство", "subject", "изобразител", "рисуван", "живопис", "художеств",
       "art ", "arts", "painting"),
    _t("design", "Дизайн", "subject", "дизайн", "design", "ux", "ui ", "графичен"),
    _t("music", "Музика", "subject", "музик", "music", "пеене", "хор ", "музикален инструмент"),
    _t("film-photo", "Кино и фотография", "subject", "филм", "film", "кино", "фотограф", "photo", "видео"),
    _t("theatre", "Театър", "subject", "театър", "театрал", "theatre", "theater", "актьор"),
    _t("sports", "Спорт", "subject", "спорт", "sport", "футбол", "баскетбол", "волейбол", "атлетик",
       "плуван", "шахмат", "шах ", "chess"),

    # --- Format of the opportunity ------------------------------------------
    _t("olympiad", "Олимпиада", "format", "олимпиад", "olympiad"),
    _t("hackathon", "Хакатон", "format", "хакатон", "hackathon", "hack day", "game jam"),
    _t("contest", "Конкурс", "format", "конкурс", "contest", "challenge"),
    _t("summer-school", "Лятно училище", "format", "лятно училище", "лятна академия", "summer school",
       "summer academy", "лагер", "camp"),
    _t("workshop", "Обучение и уъркшоп", "format", "уъркшоп", "workshop", "обучение", "training",
       "курс", "course", "семинар", "seminar", "bootcamp"),
    _t("conference", "Конференция", "format", "конференци", "conference", "форум", "forum", "summit"),
    _t("mentorship", "Менторство", "format", "ментор", "mentor"),
    _t("research", "Научна работа", "format", "научн", "research", "изследван", "проект за наука"),
    _t("volunteering", "Доброволчество", "format", "доброволч", "доброволец", "volunteer"),
    _t("study-abroad", "Обучение в чужбина", "format", "в чужбина", "abroad", "еразъм", "erasmus",
       "обмен", "exchange"),
    _t("career", "Кариера", "format", "кариер", "career", "работа", "job", "trainee", "graduate program",
       "панаир на", "job fair"),
    _t("team", "Отборно участие", "format", "отбор", "team", "екип"),

    # --- Reach and money ------------------------------------------------------
    _t("national", "Национално", "reach", "национал", "national", "републиканск"),
    _t("international", "Международно", "reach", "международ", "international", "european", "европейск",
       "global", "световн"),
    _t("regional", "Областно / регионално", "reach", "областн", "регионал", "regional", "общинск"),
    _t("free", "Безплатно", "money", "безплатн", "free of charge", "без такса", "no fee", "free",
       "входът е свободен", "вход свободен", "свободен вход"),
    _t("prizes", "Награди", "money", "наград", "prize", "award", "парична", "грамот"),
    _t("paid", "Платено", "money", "заплата", "възнагражд", "paid internship", "платен стаж", "salary"),
    _t("has-fee", "С такса", "money", "такса за участие", "такса за школата", "заплатите", "participation fee",
       "registration fee", "малка такса"),

    # --- Who it is for (grade bands; the app maps student_details.grade to one) ---
    _t("grades-1-4", "1–4 клас", "level"),
    _t("grades-5-7", "5–7 клас", "level"),
    _t("grades-8-10", "8–10 клас", "level"),
    _t("grades-11-12", "11–12 клас", "level", "абитуриент", "зрелостни", "кандидат-студент"),
    _t("university-students", "Студенти", "level", "студент", "university student", "undergraduate",
       "бакалав", "bachelor", "магист", "master's", "masters program", "докторант", "phd"),
)

TAGS_BY_SLUG: dict[str, Tag] = {t.slug: t for t in TAGS}

GRADE_BANDS: tuple[tuple[str, int, int], ...] = (
    ("grades-1-4", 1, 4),
    ("grades-5-7", 5, 7),
    ("grades-8-10", 8, 10),
    ("grades-11-12", 11, 12),
)

# Tags implied by other tags: a hackathon is almost always about programming and is a team event.
IMPLIED: dict[str, tuple[str, ...]] = {
    "math": ("stem",),
    "physics": ("stem",),
    "chemistry": ("stem",),
    "biology": ("stem",),
    "astronomy": ("stem",),
    "informatics": ("stem",),
    "engineering": ("stem",),
    "hackathon": ("programming", "team"),
    "web-development": ("programming",),
    "game-dev": ("programming",),
    "ai-data": ("programming",),
    "cybersecurity": ("informatics",),
    "english": ("foreign-languages",),
    "german": ("foreign-languages",),
    "french": ("foreign-languages",),
    "spanish": ("foreign-languages",),
    "russian": ("foreign-languages",),
}


def seed_rows() -> list[dict]:
    """Rows for the `tags` table. id is left to the database."""
    return [{"slug": t.slug, "name": t.name} for t in TAGS]


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(seed_rows(), ensure_ascii=False, indent=2))
