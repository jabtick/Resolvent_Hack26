# NO FUTURE? — the web app

Flutter for web. Connected to the team's Supabase project (`tjkwpebrakwfkhenpayl`).

## Running

From PowerShell, with a **capital `C:`** in the path (with a lowercase `c:` Flutter sometimes breaks its files):

```
Set-Location C:\Users\<you>\Resolvent_Hack26\app
flutter pub get
flutter run -d chrome                           # real Supabase
flutter run -d chrome --dart-define=FAKE=true   # sample data only, no server
flutter test                                    # all tests
flutter build web --release                     # for Netlify → build/web
```

In FAKE mode the email code is always `123456`, and the taken username is `ivan`.

## Folders: each person in their own

```
lib/
  core/            shared (Bogi): config, Supabase, navigation (router.dart, app.dart), theme, shared widgets
  features/
    auth/          sign in, sign up, code, new password (Bogi)
    profile/       own and public profile /u/<username> (Bogi)
    settings/      look, sign out, delete account (Bogi)
    feed/          feed (Gosho)
    calendar/      calendar (Niki)
    achievements/  achievements and badges (Zahari)
```

Only touch your own folder. If you need something in `core/`, ask Bogi.

## How to build a feature

Screens **never call Supabase directly**. Each feature folder has:

1. `<x>_repo.dart` — an abstract class (`extends ChangeNotifier`) with the methods the screens use;
2. `fake_<x>_repo.dart` — sample data in memory (for FAKE mode and tests);
3. `supabase_<x>_repo.dart` — the real queries;
4. `pages/` — the screens.

Then:

- add the repo to `core/services.dart` (field + `Services.fake()` + `Services.live()`);
- in a screen, get it with `ServicesScope.of(context).<x>`;
- hook the page into `appPages()` in `core/app.dart` (there is already a line for your path).

Example of all of this: `features/profile/`.

## The look (from the Lovable design)

`core/widgets/zine.dart`:

- `ZineBox` — a box with a 3px border and a hard shadow (`pink: true` for a pink shadow, `tilt:` to rotate it);
- `RansomText` — a heading "cut out" on a black strip;
- `ZineButton` — a chunky button;
- `HalftoneBackground` — the dotted background;
- `ZineChip` (filter chip), `Taped` (masking-tape strip on a box), `InitialsAvatar`, `DashedLine`, `Jitter` (shakes on hover);
- `ZineTone.primary / .secondary / .accent` — a loud block colour with its matching text colour (`tone.bg(p)`, `tone.fg(p)`).

**Language (EN / БГ).** The site's own text switches between English and Bulgarian (menu → "language", or Settings → LANGUAGE; remembered in the browser). Write every UI string in both languages right where it is used:

```dart
import '../../../core/i18n/language.dart';
Text(context.tr('Settings', 'Настройки'))
```

`context.tr` can't go inside a `const` widget — drop the `const`. **Never translate content people wrote** (post titles, descriptions, org names, event and badge names): show it as stored. Categories that belong to the site (opportunity types and fields) are translated — see `oppTypeLabel` in `features/feed/feed_sample.dart`.

**UI-only pages.** Feed (`/`), opportunity (`/opp/:id`), saved (`/saved`), calendar and achievements copy the Lovable design but run on hard-coded sample data (`features/feed/feed_sample.dart`, `_sample` in the calendar and achievements pages). Search, filters, like/save, apply and add-event only look right — nothing is loaded or saved. Wiring one up = add its repo (see below) and swap the sample list for the repo's data; the layout stays.

Colors: `context.zine.primary`, `.secondary`, `.accent`, `.ink`, `.card`… (`core/theme/palette.dart`). Fonts: `ZineText.heavy(…)`, `ZineText.hand(…)`, `ZineText.display(…)` (`core/theme/app_theme.dart`). Never hard-code colors, so the three themes (`ZineVibe.zine`, `.basement`, `.acid`) work on their own.

## Security

- The app contains **only the publishable** key (`sb_publishable_…`), which is public by design.
- **Never** put the secret key (`sb_secret_…` / `service_role`) or the database password in the code.
- What a user may do is decided by the RLS policies in `supabase/migrations/`, not by the app. Need a new permission → ask Bogi.
- Errors shown to the user go through `AppError` (messages in Bulgarian).

## Netlify

`web/_redirects` sends every path to `index.html`, so refreshing `/u/<username>` works. The site is deployed from `build/web`.
