# Scraper (Niki)

Status: planning, no code yet.

The scraper fills the feed with opportunities: competitions, olympiads, scholarships, internships and university open days.

We don't search the whole internet for new sources. The raw data arrives as a bucket of JSON files, and this part reads them, pulls out the fields the feed needs and adds tags for search and filters.

```
bucket of raw JSONs  →  extract fields  →  add tags  →  clean opportunities JSON  →  (later) database / feed
```

## Input: the bucket of JSONs

- A folder (later a Supabase Storage bucket) with JSON files, one or more opportunities per file.
- The files can come from different sources, so their shape can differ. An example source is the MON olympiads and national competitions page:
  https://www.mon.bg/dyasno-menyu/olimpiadi-i-sastezaniya/olimpiadi-i-natsionalni-sastezaniya/
- Open: the exact format of the raw JSON. To agree on it with whoever fills the bucket (Захари).

## Step 1: Extract fields

Each raw record becomes one row of the `opportunities` table from [docs/database-schema.md](../../docs/database-schema.md). Fields that are missing stay `null`; nothing is guessed. `id`, `search_vector`, `created_at` and `updated_at` are filled by the database, so the scraper leaves them out.

| Column | Rule |
| --- | --- |
| `type` | `competition` / `scholarship` / `internship` / `open_day` / `university_program`. Olympiads, tournaments and camps are all `competition`; the difference goes into tags. |
| `organizer_id` | Always `null` (scraped). |
| `title` | As on the source, in Bulgarian. |
| `description` | Short text from the source. Also holds what has no column: the country of an event abroad, or "dates not announced yet". |
| `image_url` | `null` unless the source has an image. |
| `external_url` | The event's own link (apply / details). `null` if the source has none. |
| `city` | City only, without "гр.". `null` if only a country is known. |
| `is_online` | `true` if the source says "онлайн" (also for mixed events), otherwise `false`. |
| `audience` | `school` / `university` / `both`. |
| `starts_at`, `ends_at` | timestamptz in Bulgarian time (`+02:00` in winter, `+03:00` in summer). A date with no time means start at `00:00:00`, end at `23:59:59`. A time from the source ("9:00 часа") is used. "до 20 декември" sets only `ends_at`. "?" means `null`. |
| `deadline_at` | Registration deadline, only if the source states one. |
| `status` | `published` for upcoming and ongoing, `archived` for past. |
| `source` | Always `scraper`. |
| `source_url` | Must be unique. It is the calendar page + `#<short-slug>` (e.g. `…/calendar#ioi-2027`), not `external_url`: many events have no link, and some editions share one (`sofiacode.com/sti/` spring and autumn). |

## Step 2: Add tags

Tags come from the fixed `tags` list (`slug` + Bulgarian `name`), not free text. They go into `opportunity_tags`. Things that already have a column (type, city, online, dates, status) are not repeated as tags.

- Subject: `informatics`, `math`, `physics`, `biology`, ...
- Format: `olympiad`, `tournament`, `camp`, `team`, `girls-only`
- Level: `level-municipal`, `level-regional`, `level-national`, `level-international`

First version: rule-based tagging (keyword matching in Bulgarian and English), e.g. "олимпиада" gives `olympiad`, "Областен кръг" gives `level-regional`, "Международна / Балканска / Европейска" gives `level-international`. AI only for records the rules can't tag, and only later, inside an Edge Function.

## Output

- One clean JSON file: the `tags` used, and an `opportunities` array of rows in the shape above, each with a `tags` array of slugs. Example: [samples/infos_calendar.opportunities.json](samples/infos_calendar.opportunities.json), made from [samples/infos_calendar.json](samples/infos_calendar.json).
- Scope of the first version: a local script that runs on a handful of sample JSONs. No database, no schedule.
- Deduplication: by `source_url` (unique in the database).

## Run

[process_bucket.py](process_bucket.py) (Python 3.9+, standard library only) does steps 1 and 2:

```
python process_bucket.py                                  # samples/infos_calendar.json -> out/opportunities.json
python process_bucket.py bucket/ -o out/opportunities.json --today 2026-11-27
```

It takes files or folders of raw JSONs, parses dates and places from `raw_date_text`, tags each event with the rules above, and prints one line per opportunity: date, place, status, tags. `--today` decides what counts as past (`archived`).

## Open questions

- Raw JSON format: agree with Захари.
- Tag list: agree with Гошо, since his filters and search use it.
- Overlap with the AI normalizer: check with Гошо so it isn't built twice.
- Language: Python (to match Захари's side) or TypeScript.

## Later

- Read straight from the Supabase Storage bucket and run as a scheduled Edge Function. AI keys live only there.
- Save to the database. Schema through Гошо and Ники, access rules (RLS) through Боги.
