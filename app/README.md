# NO FUTURE? — the web app

Flutter for web (phone later), hosted on Netlify, backed by the team's Supabase
project (`tjkwpebrakwfkhenpayl`). This file is the map: how to run it, where
everything is, and how to change the look without breaking anything. Team
rules (who owns what, git, language) are in the root [CLAUDE.md](../CLAUDE.md).

## Running

From PowerShell, with a **capital `C:`** in the path (with a lowercase `c:`
Flutter sometimes breaks its files):

```
Set-Location C:\Users\<you>\Resolvent_Hack26\app
flutter pub get
flutter run -d chrome                           # real Supabase
flutter run -d chrome --dart-define=FAKE=true   # sample data only, no server
flutter test                                    # all tests (run before saying "done")
flutter analyze                                 # lints
dart format lib test                            # formatting
flutter build web --release                     # for Netlify → build/web
```

FAKE mode: the email code is always `123456`; the username `ivan` is taken.

## Folders

```
lib/
  main.dart            start-up: Supabase or fake, load theme + language
  core/                shared — Bogi (ask before changing)
    ui.dart            ONE import for the look: theme + widgets + context.tr
    app.dart           route table (appPages) + MaterialApp
    router.dart        go_router + who may open which page (_private, _authOnly)
    app_shell.dart     header, side menu (_menuItems), page frame
    services.dart      every repo, fake or live (Services, ServicesScope)
    config.dart        Supabase URL + publishable key, FAKE flag, brand name
    app_error.dart     AppError: a message to show the user
    i18n/              language.dart (context.tr), dates.dart (month names…)
    theme/             palette.dart (colours), tokens.dart (sizes), app_theme.dart (fonts, Material theme)
    widgets/           the zine widgets (catalogue below)
  features/
    auth/              sign up, log in, code, new password      — Bogi
    profile/           own profile, public /u/<username>         — Bogi
    settings/          theme, language, log out, delete account — Bogi
    feed/              feed, /opp/:id, /saved                    — Gosho
    calendar/          calendar                                  — Niki
    achievements/      badges                                    — Zahari
test/                  mirrors lib/ (core/, features/<x>/)
web/                   index.html, icons, _redirects (Netlify)
assets/fonts/          bundled fonts (Cyrillic)
```

**Only touch your own feature folder.** Need something in `core/`? Ask Bogi.

## Changing the look

Everything visual is decided in four files. Pages never hard-code a colour,
size or font — a test (`test/core/no_hardcoded_colors_test.dart`) fails if
someone writes `Color(0x…)` or `Colors.x` outside the palette.

| I want to change… | Edit | Notes |
| --- | --- | --- |
| a colour (pink, lime, paper, ink…) | `core/theme/palette.dart` | one `Palette` per vibe (`_zine`, `_basement`, `_acid`) |
| add a whole new theme | `core/theme/palette.dart` | add a `ZineVibe` value + a `Palette` + a case in `Palette.of`; the pickers show it automatically |
| border thickness, shadow, card tilt | `core/theme/tokens.dart` → `ZineSize` | |
| where the layout switches to mobile | `core/theme/tokens.dart` → `Breakpoints` | `phone` 640, `tablet` 768, `desktop` 1024 |
| page max widths | `core/theme/tokens.dart` → `PageWidth` | |
| a font | `pubspec.yaml` (asset) + `core/theme/app_theme.dart` → `ZineFonts` | must support Cyrillic |
| text styles | `core/theme/app_theme.dart` → `ZineText` | `heavy`, `hand`, `display`, `small`, `bold` |
| how inputs, dialogs, switches, snack bars look | `core/theme/app_theme.dart` → `buildTheme` | stock Material widgets pick this up |
| how every card / button looks | `core/widgets/boxes.dart`, `buttons.dart` | |
| the brand name | `core/config.dart` → `kBrand` | |
| the menu | `core/app_shell.dart` → `_menuItems` | |

### Colours

In a widget: `final p = context.zine;` then

| Token | Use |
| --- | --- |
| `p.background` | page paper |
| `p.ink` | text, borders, shadows |
| `p.card` | inside boxes |
| `p.primary` / `p.secondary` / `p.accent` | the three loud block colours |
| `p.onPrimary` | text on `primary` (and `destructive`) |
| `p.onBright` | text on `secondary` / `accent` |
| `p.muted`, `p.mutedFg` | quiet surfaces, grey captions |
| `p.destructive` | errors, delete |

`ZineTone.primary / .secondary / .accent` bundles a block colour with its text
colour: `tone.bg(p)`, `tone.fg(p)`. `ZineTone.cycle(i)` rotates them for lists.

### Widget catalogue

All come from `import '../../../core/ui.dart';`.

| Widget | What it is |
| --- | --- |
| `ZineBox` | the card: 3px ink border, hard shadow. `color:`, `pink: true` (pink shadow), `tilt:` (degrees), `onTap:` (makes it a button that jitters), `padding:` |
| `ZineButton` | chunky button. `kind: ZineButtonKind.primary` (main action, ink + pink shadow), `.plain` (default), `.bright` (lime). `icon:`. `onPressed: null` = disabled |
| `ZineIconButton` | square icon button, lime (`filled: true`) or outlined. Always set `tooltip:` |
| `ZineChip` | square toggle chip (filters, tabs). `selected:` |
| `ZinePicker` | row of chips, one selected; `VibePicker`, `LanguagePicker` are ready-made |
| `TextLink` | small underlined link |
| `PageHeading` | big page title: `kicker:` (hand line above), `title:`, `ransom:` (words on an ink strip), `trailing:` (button on the right) |
| `RansomText` | heavy words cut out on a strip (section headings, labels) |
| `IconLabel` | icon + short grey line ("📍 Sofia") |
| `ZineTag` | small coloured label (skills, interests) |
| `Notice` | yellow box with a warning sentence |
| `Taped` | masking-tape strip over a box's top edge |
| `InitialsAvatar` | round initials badge |
| `DashedLine` | dashed divider |
| `Jitter` | shakes its child on hover (ZineBox with `onTap` already does) |
| `HalftoneBackground` | the dot grid behind every page (used by the shell) |
| `PageColumn` | centres the page and caps its width: `PageColumn(maxWidth: PageWidth.reading, child: …)` |
| `ZineGrid` | equal-width cards in columns: `columns: (w) => w >= Breakpoints.tablet ? 2 : 1` |
| `StickyRail` | a side column that stays in view while the page scrolls |
| `EmptyState` | big "nothing here" message, optional icon, note, action |
| `LoadError` | "could not load" + RETRY |
| `showSnack(context, msg)` | short message at the bottom |

Not in the catalogue? Build it from `ZineBox` + `ZineText` inside your
feature folder first; if a second feature needs it, ask Bogi to move it to
`core/widgets/`.

### A page skeleton

```dart
import 'package:flutter/material.dart';

import '../../../core/ui.dart';

class ThingsPage extends StatelessWidget {
  const ThingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final p = context.zine;
    return PageColumn(
      maxWidth: PageWidth.wide,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          PageHeading(
            kicker: context.tr('all in one place', 'всичко на едно място'),
            title: context.tr('YOUR ', 'ТВОИТЕ '),
            ransom: context.tr('THINGS', 'НЕЩА'),
          ),
          const SizedBox(height: 32),
          ZineGrid(
            columns: (w) => w >= Breakpoints.tablet ? 2 : 1,
            spacing: 32,
            children: [
              for (final (i, t) in things.indexed)
                ZineBox(
                  tilt: ZineSize.tiltFor(i),
                  onTap: () => context.go('/things/${t.id}'),
                  child: Text(t.title, style: ZineText.heavy(28, color: p.ink)),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
```

## Language (EN / БГ)

The site's own text switches between English and Bulgarian (menu → language,
or Settings; remembered in the browser). Write every UI string in both
languages right where it is used:

```dart
Text(context.tr('Settings', 'Настройки'))
```

- `context.tr` can't go inside a `const` widget — drop the `const`.
- **Never translate content people wrote** (post titles, descriptions, org
  names, event and badge names): show it as stored.
- Categories that belong to the site (opportunity types, fields) are
  translated — see `oppTypeLabel` in `features/feed/feed_sample.dart`.
- Dates: `context.monthName(m)`, `context.weekdayName(d)`,
  `context.shortDate(date)`, `hhmm(date)` (`core/i18n/dates.dart`).
- Known gap: form validator messages (`features/auth/validators.dart`) and
  `AppError` messages from the repos are Bulgarian only.

## Data: how to build a feature

Screens **never call Supabase directly**. Each feature folder has:

1. `<x>_repo.dart` — an abstract class (`extends ChangeNotifier`) with the
   methods the screens use;
2. `fake_<x>_repo.dart` — sample data in memory (FAKE mode and tests);
3. `supabase_<x>_repo.dart` — the real queries;
4. `pages/` — the screens; `widgets/` — pieces only this feature uses.

Then:

- add the repo to `core/services.dart` (field + `Services.fake()` + `Services.live()`);
- in a screen, get it with `ServicesScope.of(context).<x>`;
- the page is already in `appPages()` in `core/app.dart` (or add a line).

Full example: `features/profile/` (repo, fake, supabase, pages, tests in
`test/features/profile/`).

### Pages that are still UI-only

Feed (`/`), opportunity (`/opp/:id`), saved (`/saved`), calendar and
achievements copy the Lovable design (`design/lovable/no-future-source/`) but
run on hard-coded samples:

| Page | Sample data | Owner |
| --- | --- | --- |
| feed, opp, saved | `features/feed/feed_sample.dart` (`kSampleOpps`) | Gosho |
| calendar | `features/calendar/calendar_sample.dart` (`kSampleEvents`) | Niki |
| achievements | `features/achievements/achievements_sample.dart` (`kSampleBadges`) | Zahari |

Search, filters, like/save, apply, add/edit event, share badge only look
right — nothing is loaded or saved. Wiring one up = add its repo (above) and
swap the sample list for the repo's data; the layout stays. The sample
classes (`Opp`, `CalendarEvent`, `EarnedBadge`) show which fields the pages
need.

## Routes and access

| Path | Page | Who |
| --- | --- | --- |
| `/` | feed | everyone |
| `/opp/:id`, `/saved`, `/calendar`, `/achievements` | UI-only pages | everyone (for now) |
| `/join`, `/login`, `/code`, `/create-profile`, `/forgot` | sign-up / log-in flow | signed-out (signed-in → `/profile`) |
| `/profile`, `/settings` | own profile, settings | signed-in with a profile |
| `/u/:username` | public profile | everyone |

Redirects are in `authRedirect()` in `core/router.dart`. A new private page
→ add its path to `_private` there.

## Security

- The app contains **only the publishable** key (`sb_publishable_…`), which
  is public by design.
- **Never** put the secret key (`sb_secret_…` / `service_role`) or the
  database password in the code.
- What a user may do is decided by the RLS policies in
  `supabase/migrations/`, not by the app. Need a new permission → ask Bogi.
- Errors shown to the user go through `AppError`.

## Netlify

`web/_redirects` sends every path to `index.html`, so refreshing
`/u/<username>` works. The site is deployed from `build/web`.

## Notes for Claude sessions

- Read the root `CLAUDE.md` first; only edit the folders your human owns.
- Use the widgets and tokens above instead of new hand-made styling; keep
  pages free of `Color(0x…)`, raw border widths and magic breakpoints.
- Run `flutter test` (and `flutter analyze`) before saying something is done.
  Flutter commands from PowerShell with a capital `C:` in the path. If
  `flutter` is not on PATH, find the SDK's `bin` folder and prepend it.
- `flutter analyze` on Flutter ≥ 3.47 reports
  "`package:flutter/material.dart` is deprecated" on every file. Ignore it:
  **do not** run `dart fix --apply` without `--code=…` — it rewrites every
  import to `package:material_ui`, which teammates on older Flutter can't
  build.
- No commits, pushes or merges — tell your human which branch to use.
