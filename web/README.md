# NO FUTURE? — website

React site for the hackathon project: TanStack Start (server-rendered React), Tailwind v4, shadcn/ui, Supabase. It started from the Lovable prototype (`design/lovable/no-future-source/`, kept as reference) and is connected to the team's Supabase project and the schema in `supabase/migrations/`.

## Run

```
cd web
npm install
npm run dev          # http://localhost:8080
npm test             # vitest
npm run typecheck    # tsc
npm run lint         # eslint + prettier
npm run build        # production build for Netlify
```

No `.env` is needed: the Supabase URL and the **publishable** key are in `src/integrations/supabase/client.ts` (public by design). To point at another project, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put the secret key or the DB password in this folder.

## Layout

```
src/
  routes/            one file = one URL (TanStack Router file routes)
  components/        Nav, OppCard, AccountProvider, forms, ProfileHeader, ui/ (shadcn)
  lib/               data + logic, no React:
    auth.ts          sign-up with email code, sign-in, profile creation, reset, delete
    profiles.ts      own profile, public profile (/u/<name>)
    opps.ts          feed, single opportunity, saved, organizer posts
    validators.ts    form rules (match the DB checks)
    errors.ts        any Supabase error → one Bulgarian message
    redirect.ts      where each account state may go
    api.ts           the three APIs on the shared client
    queries.ts       React Query hooks over api.ts
  data/sampleOpps.ts sample items shown while `opportunities` is empty
  test/fakeSupabase.ts  fake Supabase server for unit tests
  integrations/supabase/  client + generated DB types
```

Pages never call Supabase directly; they use `lib/` (via `api` or the hooks in `queries.ts`). Every `lib/` module has tests against the fake server.

## Accounts

`components/AccountProvider.tsx` holds the account state: `signedOut → awaitingCode → needsProfile → signedIn`. `AuthGate` in `routes/__root.tsx` redirects using `lib/redirect.ts`. Sign-up is email + password, then a 6-digit code from the email (needs the templates in `supabase/templates/` pasted into the Supabase dashboard, which needs custom SMTP), then the profile form. Under-14 students stay hidden until a parent consents.

## Database types

After any migration, regenerate:

```
npx supabase gen types typescript --project-id tjkwpebrakwfkhenpayl --schema public > web/src/integrations/supabase/types.ts
```

## Look

The zine style comes from the Lovable design: utility classes `zine`, `zine-pink`, `ransom`, `tape`, `jitter`, `tilt-l`, `tilt-r` and the colour tokens in `src/styles.css` (three themes: Ксерокс, Мазе, Киселина). Fonts are Cyrillic-capable and self-hosted via `@fontsource` (no requests to Google). Enter animations use `tw-animate-css` (`animate-in fade-in …`) and switch off under `prefers-reduced-motion`.

## Deploy (Netlify)

`npm run build` runs `@netlify/vite-plugin-tanstack-start`, which outputs the client to `dist/client` and the SSR function to `.netlify/`. In Netlify: base directory `web`, build command `npm run build`. Server rendering gives real titles and link previews for `/u/<username>` and `/opp/<id>`.
