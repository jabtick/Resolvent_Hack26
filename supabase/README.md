# Supabase: database, server, emails

Project `tjkwpebrakwfkhenpayl` (Frankfurt). Schema overview: [docs/database-schema.md](../docs/database-schema.md).

| Folder | What | Owner |
| --- | --- | --- |
| [migrations/](migrations/) | SQL: tables, indexes, RLS policies | schema: Gosho, Niki; RLS: Bogi |
| [functions/](functions/) | Edge Functions (server logic) | Bogi, Gosho |
| [templates/](templates/) | Auth emails (sign-up code, password reset) | Bogi |
| [config.toml](config.toml) | Local Supabase settings and email subjects | Bogi |

## What is live

| Thing | What it does |
| --- | --- |
| `20261127180126_rate_limits.sql` | `private.rate_limits` + `public.check_rate_limit()` for Edge Functions |
| `20261127200000_profiles_feed.sql` | Profiles and feed: 8 tables, 1 view, RLS |
| `20261127200100_organizer_rename_resets_verification.sql` | A verified organizer who changes `org_name` goes back to `pending` |
| `20261128090000_schema_comments.sql` | Table and column descriptions for the dashboard (documentation only). **Not confirmed live yet** |
| `20261128140000_badges.sql` | `event_results`, `badges`, view `public_badges`, RLS. Schema only, no upload/awarding yet |
| `delete-account` function | The user deletes their own account |

Check before relying on this table: `supabase migration list` and `supabase functions list`.

## Working with migrations

```
supabase link --project-ref tjkwpebrakwfkhenpayl
supabase migration new <short_name>     # creates migrations/<timestamp>_<short_name>.sql
supabase db push                        # applies new migrations to the live project
```

- **Never edit a migration that is already live.** Every change is a new file.
- One migration per change; merge it to `main` quickly so the order stays right.

Rules for every table in `public`:

1. `alter table … enable row level security;` (Bogi writes the policies).
2. User data references `auth.users(id) on delete cascade`, otherwise `delete-account` leaves data behind (GDPR).
3. `organizer_details.verification_status` is changed **only by the server**.
4. The student profile has `birth_date` (parental consent under 14) and `terms_accepted_at`.

New table or column → Gosho and Niki. Who can read or change what → Bogi.

## Edge Functions

The server is for anything that can't live in Flutter: secret keys, checks, actions with more rights than the user has.

```
supabase functions serve                   # run locally
supabase functions deploy <name>           # deploy one function
```

Shared code in [functions/_shared/](functions/_shared/):

- `http.ts`: `handler(methods, fn)` (CORS, method check, safe JSON errors), `json()`, `readJson()`, `HttpError`.
- `supabase.ts`:
  - `userClient(req)`: acts as the caller, RLS applies. Use this by default.
  - `adminClient()`: bypasses RLS (service role). Use only **after** checking the caller is allowed.
  - `requireUser(req)`: the signed-in user, or 401.
  - `rateLimit(key, limit, windowSeconds)`: 429 when over the limit.

A new function looks like [functions/delete-account/index.ts](functions/delete-account/index.ts):

```ts
Deno.serve(handler(["POST"], async (req) => {
  const user = await requireUser(req);
  await rateLimit(`my-function:${user.id}`, 10, 60);
  // ...
  return json({ ok: true });
}));
```

### Functions

| Function | Request | Response |
| --- | --- | --- |
| `delete-account` | `POST`, body `{ "confirm": "DELETE" }` | `{ "deleted": true }` |

### Environment

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are set by Supabase automatically. Optional: `ALLOWED_ORIGIN` (the Flutter web URL, to restrict CORS). Set your own secrets (e.g. AI keys) with `supabase secrets set NAME=value`; they never go into git or into the Flutter app.

## Emails

`templates/confirmation.html` (sign-up code) and `templates/recovery.html` (password reset). Subjects are in `config.toml` under `[auth.email.template.*]`. On the live project, copy changes into Dashboard → Authentication → Email Templates.
