# Scraper (Niki)

Status: planning, no code yet.

The scraper fills the feed with opportunities: competitions, olympiads, scholarships, internships and university open days. The work is split into two tasks.

## Task 1: Test scraper (pull data from a known source)

Goal: show what data we can get from a source we already know, and how clean it is.

- Source: the MON olympiads and national competitions page
  https://www.mon.bg/dyasno-menyu/olimpiadi-i-sastezaniya/olimpiadi-i-natsionalni-sastezaniya/
- Flow: fetch the page → collect PDF links (schedule order and rules documents) → extract structured data from each PDF → write `competitions.json`.
- Extracted fields: name, subject, grades, rounds (school / regional / national) with date and city, registration deadline, source URL.
- Scope: a local script working on 3–5 PDFs. No database, no schedule, no deduplication.
- Open choices: Python or TypeScript; whether the first version uses AI extraction or only lists competitions and their PDF links.

## Task 2: Opportunity discovery (find new sources on the internet)

Goal: find opportunities we don't already have a source for, instead of only scraping hand-picked sites.

- Search the web for opportunities (by type, subject, region, school year), for example with search queries or by crawling links from known sources.
- Decide whether a found page is a real, current opportunity for school or university students.
- Extract the same fields as in Task 1 and remove duplicates of things we already have.
- Each new source that proves reliable becomes its own adapter, like MON in Task 1.
- Harder part: filtering noise, outdated pages and duplicates; deciding which sources we can trust.

## Later (not part of the test)

- Run as a scheduled Supabase Edge Function. AI keys live only there.
- Save to the database. The schema goes through Боги.
- Agree with Гошо on how this relates to the AI normalizer.
