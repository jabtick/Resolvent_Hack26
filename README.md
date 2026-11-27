# NO FUTURE? — Resolvent_Hack26

A LinkedIn-style platform for school and university students, where competition achievements are proven by the organizers themselves. Built at Hackathon Burgas 26.

- **Profiles** for students and verified organizers, with a public link `/u/<username>`.
- **Feed and calendar** of competitions, scholarships, internships, open days and university programs, with search and filters.
- **Badges:** organizers upload results and the system awards place and participation badges that employers can trust.

## Stack

Flutter (web first, then mobile) + Supabase (Postgres with RLS, Auth, Storage, Edge Functions). Hosted on Netlify.

## Repo

| Folder | What |
| --- | --- |
| [app/](app/) | Flutter app. How to run: [app/README.md](app/README.md) |
| [supabase/](supabase/) | Database migrations, Edge Functions, email templates: [supabase/README.md](supabase/README.md) |
| [pipeline/](pipeline/) | Python tools that turn scraped opportunities into feed rows: [scraper](pipeline/scraper/), [normalizer](pipeline/normalizer/) |
| [docs/](docs/) | Database schema ([database-schema.md](docs/database-schema.md)) and reports |
| [design/](design/) | Lovable design prototype, reference only: [design/README.md](design/README.md) |

Team context and working rules (in Bulgarian): [CLAUDE.md](CLAUDE.md).
