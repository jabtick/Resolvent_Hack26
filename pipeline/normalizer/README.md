# Normalizer (Zahari)

Turns scraped pages into rows for the `opportunities` table (see `docs/database-schema.md`):
it detects **type, dates, city, online, audience** and adds **many theme tags** per item, which
the feed / recommendation algorithm matches against `profile_interests`.

Python 3.10+, standard library only. No database writes yet.

```
fetch.py  (or Niki's scraper / any adapter)  →  raw_items.json
normalize.py                                  →  opportunities.json   (rows + tag slugs)
taxonomy.py                                   →  tags_seed.json       (rows for `tags`)
```

## Run

```
cd pipeline/normalizer
python normalize.py examples/raw_items.json -o examples/opportunities.json
python normalize.py examples/raw_items.json --debug     # shows why each field/tag was chosen
python fetch.py urls.txt -o out/raw_items.json          # simple one-page-per-opportunity sites
python adapters/infos.py -o examples/infos_raw.json     # INFOS home feed (list of cards)
python normalize.py examples/infos_raw.json -o examples/infos_opportunities.json
python taxonomy.py                                      # prints the tag list
```

## Adapters (one per site with many items per page)

| Adapter | Site | Notes |
| --- | --- | --- |
| [adapters/infos.py](adapters/infos.py) | https://infos.infosbg.com/home | one item per `<article>` card; the site has no page per announcement, so `source_url` = `home#<hash of title>`; `external_url` = the competition's own site; PDFs go to `_source.attachments` |

A raw item may carry a `_source` block with site-specific extras (upload time, attachments); the normalizer ignores it.

## Input: raw item (what every source/adapter outputs)

Only `source_url` and `title` are required. Everything else is optional; if a source already
knows a field (e.g. a separate "Deadline:" box), put it in, and it overrides what is read from the text.

```json
{
  "source_url": "https://...",          // required, unique, used for dedup
  "title": "Национална олимпиада по информатика",   // required
  "text": "full page text / description",
  "external_url": "https://... apply link",          // default: source_url
  "image_url": "https://...",
  "fetched_at": "2026-11-27T10:00:00+00:00",         // dates without a year are read relative to this
  "type": "competition",                // hint: competition | scholarship | internship | open_day | university_program
  "city": "гр. Бургас",                 // hint, normalized to "Бургас"
  "is_online": true,                    // hint
  "audience": "school",                 // hint: school | university | both
  "dates": { "starts_at": "...", "ends_at": "...", "deadline_at": "..." },   // hints, any format
  "tags": ["math", "роботика"]          // hints: tag slugs or keywords
}
```

## Output: one row per opportunity

Same column names as `opportunities`. `id`, `search_vector`, `created_at` and `updated_at` are left
to the database. `tags` is not a column: on insert each slug becomes a row in `opportunity_tags`
(`tag_id` looked up by `tags.slug`).

```json
{
  "type": "competition",
  "organizer_id": null,
  "title": "Национална олимпиада по информатика 2026/2027",
  "description": "...",
  "image_url": null,
  "external_url": "https://...",
  "city": "Бургас",
  "is_online": false,
  "audience": "school",
  "starts_at": "2026-12-13T09:00:00+02:00",
  "ends_at": "2027-03-14T23:59:00+02:00",
  "deadline_at": "2026-12-05T23:59:00+02:00",
  "status": "published",
  "source": "scraper",
  "source_url": "https://...",
  "tags": ["informatics", "national", "olympiad", "grades-11-12", "grades-5-7", "grades-8-10",
           "programming", "regional", "free", "stem"]
}
```

## How fields are chosen

| Field | Rule |
| --- | --- |
| `type` | keyword scores per type, title counts ×3; ties → open_day > internship > scholarship > competition > university_program; nothing found → `competition` |
| `city` | Bulgarian cities in Cyrillic and Latin, plus adjectives ("Бургаски университет" → Бургас); the most mentioned wins; none → `null` |
| `is_online` | онлайн / online / дистанционно / хибрид / zoom ... (a hybrid event keeps its city) |
| `audience` | ученици / клас / гимназия vs студенти / бакалавър / магистър; both → `both`; none → default per type |
| dates | finds `15.03.2027`, `15 март 2027`, `12–14 март`, `March 20, 2027`, ISO, + time `10:30 ч.`. The words just before a date decide what it is: *срок, до, кандидатстване, регистрация, deadline* → `deadline_at`; *провежда, начало, кръг, takes place* → `starts_at`; ranges → `starts_at`/`ends_at`; *публикувано, обновено* → ignored. Several event dates (rounds) → `starts_at` = first, `ends_at` = last. Times are Europe/Sofia; a deadline without a time = 23:59 |
| `status` | `published`, or `archived` if every date is already in the past |
| `tags` | see below |

## Tags (for the feed / recommendations)

`taxonomy.py` is the single fixed list (65 tags) that goes into the `tags` table (`tags_seed.json`).
Groups (only in code, not in the DB):

- **subject:** math, informatics, programming, web-development, ai-data, cybersecurity, robotics, physics, biology, ecology, history, economics, entrepreneurship, languages, arts, music, sports, …
- **format:** olympiad, hackathon, contest, summer-school, workshop, conference, mentorship, research, volunteering, study-abroad, career, team
- **reach / money:** national, international, regional, free, prizes, paid
- **level:** `grades-1-4`, `grades-5-7`, `grades-8-10`, `grades-11-12`, `university-students` — the app maps `student_details.grade` to the band, so a grade-9 student gets items tagged `grades-8-10`

`tags` in the output are **ordered by relevance** (title hits ×3 + body hits). Some tags imply others
(`hackathon` → `programming`, `team`; `math` → `stem`; `english` → `foreign-languages`).
`opportunity_tags` has no weight column, so only the order is lost on insert. If the algorithm needs
weights, a `weight real` column in `opportunity_tags` would do it (that change goes through Гошо and Ники).

To tune: run with `--debug`, look at `tag_scores` / `date_mentions`, and add keywords in `taxonomy.py` or `extract.py`.

## Not done yet

- Writing to Supabase (upsert by `source_url`, through service_role on the server).
- Sources that need their own adapter (PDFs, lists of many items, JS pages), e.g. MON in `../scraper`.
- An AI step for messy pages: it should output the same raw-item format, with this normalizer as a check after it.
