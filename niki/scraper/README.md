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

Turn each raw record into one fixed shape. Fields that are missing stay empty; nothing is guessed.

| Field | Meaning |
| --- | --- |
| `title` | Name of the opportunity |
| `type` | competition, olympiad, scholarship, internship, open_day |
| `subject` | e.g. math, informatics, biology |
| `grades` | Grades or age range it is for |
| `rounds[]` | Stage (school / regional / national), date, city |
| `registration_deadline` | Last day to sign up |
| `organizer` | Who runs it |
| `city` / `online` | Where it happens |
| `source_url` | Where the data came from |

## Step 2: Add tags

Tags come from a fixed list, not free text, so the filters can rely on them. Tags are in English; the app shows Bulgarian labels.

- Type: `olympiad`, `competition`, `scholarship`, `internship`, `open-day`
- Subject: `math`, `informatics`, `physics`, `biology`, ...
- Level: `grades-1-4`, `grades-5-7`, `grades-8-12`, `university`
- Place: city name (`burgas`, `sofia`, ...), `national`, `online`
- Status: `registration-open`, `deadline-soon`, `past`

First version: rule-based tagging (keyword matching in Bulgarian and English). AI only for records the rules can't tag, and only later, inside an Edge Function.

## Output

- One clean JSON file with all opportunities in the shape above, plus their tags.
- Scope of the first version: a local script that runs on a handful of sample JSONs. No database, no schedule.
- Simple deduplication: the same title + organizer + date counts as one opportunity.

## Open questions

- Raw JSON format: agree with Захари.
- Tag list: agree with Гошо, since his filters and search use it.
- Overlap with the AI normalizer: check with Гошо so it isn't built twice.
- Language: Python (to match Захари's side) or TypeScript.

## Later

- Read straight from the Supabase Storage bucket and run as a scheduled Edge Function. AI keys live only there.
- Save to the database. Schema through Гошо and Ники, access rules (RLS) through Боги.
