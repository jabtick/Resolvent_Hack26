# Web App Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Flutter web app in `app/` with the Lovable "NO FUTURE?" zine look, real email sign-up/sign-in against Supabase, own + public profile, settings with delete-account, and empty feature folders for the rest of the team.

**Architecture:** Each feature has an abstract repo (`ChangeNotifier`), a fake implementation with sample data and a Supabase implementation; pages talk only to the interface. `--dart-define=FAKE=true` swaps every repo for its fake. `go_router` with path URLs; a pure `redirect` function decides where signed-out / no-profile users go.

**Tech Stack:** Flutter 3.44.6 / Dart 3.12 (web only), `supabase_flutter ^2.18.3`, `go_router`, `shared_preferences`, `lucide_icons_flutter ^4.0.1`, `flutter_lints ^6.0.0`; fonts bundled as assets.

**Spec:** `docs/superpowers/specs/2026-11-27-web-app-foundation-design.md`. Design reference: `design/lovable/no-future-source.zip` (React/Tailwind; `src/styles.css`, `src/components/Nav.tsx`, `src/components/OppCard.tsx`, `src/routes/{join,profile,settings}.tsx`).

## Global Constraints

- **No commits by Claude.** Every "Commit" step = tell Bogi the exact `git add`/`git commit` to run. Branch: `bogi/server`.
- Run `flutter` commands from PowerShell after `Set-Location C:\Users\Bogi\Resolvent_Hack26\app` (upper-case `C:`), never from Bash `/c/...`.
- All user-facing text in **Bulgarian**; code, identifiers, comments in English.
- Supabase URL `https://tjkwpebrakwfkhenpayl.supabase.co`; the **publishable** key (`sb_publishable_…`, public by design) lives in `lib/core/config.dart`. Never the secret key, never the DB password. Fetch the key with `npx -y supabase@2 projects api-keys --project-ref tjkwpebrakwfkhenpayl -o json`, filtering output so only the publishable key is printed.
- Password rule (matches `supabase/config.toml`): ≥ 10 characters, at least one letter and one digit.
- Username rule (matches DB check): `^[A-Za-z0-9_.-]{3,30}$`, unique case-insensitively.
- Tables and grants come from `supabase/migrations/20261127200000_profiles_feed.sql` (Gosho). The app writes only columns granted there.
- Brand text: `NO FUTURE?` (from the design; Ico/Anton may rename later — keep it in one constant).

**Design tokens (from `styles.css`, oklch → hex):**

| Token | Zine (default) | Dark ("Basement") | Acid |
| --- | --- | --- | --- |
| background | `0xFFF9F5E6` | `0xFF090909` | `0xFFD8FA52` |
| foreground / ink | `0xFF070707` | `0xFFF6F2E3` | `0xFF070707` |
| card | `0xFFFEFCF4` | `0xFF161616` | `0xFFF5FCE6` |
| primary | `0xFFF40091` | `0xFFF40091` | `0xFF8C34E9` |
| secondary | `0xFFD4F73E` | `0xFFD4F73E` | `0xFF24E9F2` |
| accent | `0xFFFCEE28` | `0xFFFCEE28` | `0xFFFFA034` |
| muted / mutedFg | `0xFFE2DED0` / `0xFF3A3A3A` | `0xFF242424` / `0xFFAEAEAE` | as zine |
| destructive | `0xFFE60016` | same | same |

Radius 0 everywhere. Border 3 px ink. "Brutal" shadow: offset (6, 6), blur 0, ink (or primary for the pink variant). Body background: 1 px dots, 6 px grid, ink at 18 % opacity.

**Fonts (Cyrillic-capable replacements — the design's Bebas Neue, Space Mono, Permanent Marker have no Cyrillic):** display = Rubik Glitch, heavy = Oswald (700), body = IBM Plex Mono (400/700), hand = Caveat (700). All OFL, from the google/fonts GitHub repo, bundled in `app/assets/fonts/` (no runtime fetch from Google: GDPR).

## Review Focus

1. **Under-14 student signs up** — no parental consent flow yet. Expect: profile is created, stays hidden, and the create-profile page says so in Bulgarian. Test in Task 6.
2. **Username taken or invalid** — expect the same regex client-side and the DB unique-violation (`23505`) shown as "Това потребителско име е заето", account stays signed in with `needsProfile`. Tests in Tasks 3 and 4.
3. **Wrong / expired / re-requested code** — expect a Bulgarian message, and "send again" refused inside 60 s (server `max_frequency`) shown as a message, not a crash. Tests in Tasks 3 and 4.
4. **Refreshing `/u/<username>` on the hosted site** — expect the page, not a 404. Needs the SPA fallback file in Task 1.
5. **Signed in without a profile (closed the tab after the code)** — expect every route to land on `/create-profile`. Test in Task 5.

---

### Task 1: Project scaffold, config, fonts, SPA fallback

**Files:**
- Create: `app/` via `flutter create --platforms web --org bg.nofuture --project-name nofuture app`
- Create: `app/lib/core/config.dart`, `app/lib/main.dart` (replace), `app/web/_redirects`, `app/assets/fonts/*.ttf`
- Modify: `app/pubspec.yaml`, `app/analysis_options.yaml`
- Test: `app/test/config_test.dart`

**Interfaces:**
- Produces: `const kSupabaseUrl`, `const kSupabasePublishableKey`, `const bool kFake = bool.fromEnvironment('FAKE')`, `const kBrand = 'NO FUTURE?'`; font families `RubikGlitch`, `Oswald`, `IBMPlexMono`, `Caveat`.

- [ ] **Step 1:** Run `flutter create` (above) from `C:\Users\Bogi\Resolvent_Hack26`. Delete the counter sample in `lib/main.dart` and `test/widget_test.dart`.
- [ ] **Step 2:** Add dependencies: `supabase_flutter: ^2.18.3`, `go_router`, `shared_preferences`, `lucide_icons_flutter: ^4.0.1`; dev `flutter_lints: ^6.0.0`. `flutter pub get` succeeds.
- [ ] **Step 3:** Download TTFs (RubikGlitch-Regular, Oswald variable or Bold, IBMPlexMono-Regular/Bold, Caveat variable or Bold) from `https://github.com/google/fonts/raw/main/ofl/<family>/…` into `assets/fonts/`; declare them in `pubspec.yaml` under the family names above.
- [ ] **Step 4: Write the failing test** `config_test.dart`: `kSupabaseUrl == 'https://tjkwpebrakwfkhenpayl.supabase.co'`; `kSupabasePublishableKey.startsWith('sb_publishable_')`; `kFake == false` by default.
- [ ] **Step 5:** Run `flutter test test/config_test.dart` → FAIL (file missing).
- [ ] **Step 6:** Write `config.dart` with the doc comment "public by design" (as in TANKlemetry `supabase_config.dart`). `main.dart`: `usePathUrlStrategy()`, `Supabase.initialize` unless `kFake`, `runApp` of a placeholder `MaterialApp` showing `kBrand`.
- [ ] **Step 7:** `web/_redirects` containing exactly `/*    /index.html   200` (Netlify SPA fallback). Set `<title>` in `web/index.html` to `NO FUTURE?` and `lang="bg"`.
- [ ] **Step 8:** `flutter test` PASS; `flutter analyze` no issues; `flutter build web` succeeds.
- [ ] **Step 9: Commit** — tell Bogi: `git add app` · `git commit -m "app: Flutter web scaffold, config, fonts"`.

### Task 2: Zine theme and building blocks

**Files:**
- Create: `app/lib/core/theme/palette.dart`, `app/lib/core/theme/app_theme.dart`, `app/lib/core/theme/theme_controller.dart`, `app/lib/core/widgets/zine.dart`
- Test: `app/test/core/theme_test.dart`, `app/test/core/zine_test.dart`

**Interfaces:**
- Produces:
  - `enum ZineVibe { zine, basement, acid }` with Bulgarian `label`s `Ксерокс`, `Мазе`, `Киселина`.
  - `class Palette { final Color background, ink, card, primary, secondary, accent, muted, mutedFg, destructive; static Palette of(ZineVibe v); }` — values from the token table.
  - `ThemeData buildTheme(ZineVibe v)` — Material 3, `ColorScheme` from the palette, zero radius, 3 px ink `OutlineInputBorder`, body font `IBMPlexMono`, `displayLarge/Medium` = `Oswald` 700, palette exposed via `ThemeExtension<ZineColors>`.
  - `class ThemeController extends ChangeNotifier { ZineVibe get vibe; Future<void> load(); Future<void> set(ZineVibe v); }` persisted in `shared_preferences` key `vibe`.
  - Widgets: `ZineBox({required Widget child, Color? color, bool pink = false, double tilt = 0, EdgeInsets padding})` (3 px ink border, offset (6,6) blur-0 shadow ink or primary, rotation in degrees), `RansomText(String text, {Color? background})` (ink background, paper text, Oswald), `HalftoneBackground({required Widget child})` (dot grid painter), `ZineButton({required String label, required VoidCallback? onPressed, bool pink = false, IconData? icon})`.

- [ ] **Step 1: Failing tests:** `Palette.of(ZineVibe.zine).primary == const Color(0xFFF40091)`; `Palette.of(ZineVibe.acid).primary == const Color(0xFF8C34E9)`; `buildTheme(ZineVibe.basement).colorScheme.brightness == Brightness.dark`; `ThemeController` with mocked prefs (`SharedPreferences.setMockInitialValues({'vibe': 'acid'})`) loads `acid`; pumping `ZineBox(pink: true)` finds a `DecoratedBox` whose `BoxDecoration` has `Border.all(width: 3)` and one `BoxShadow(offset: Offset(6, 6), blurRadius: 0, color: primary)`.
- [ ] **Step 2:** `flutter test test/core` → FAIL.
- [ ] **Step 3:** Implement the files above.
- [ ] **Step 4:** `flutter test test/core` → PASS; `flutter analyze` clean.
- [ ] **Step 5: Commit** — tell Bogi: `git add app/lib/core app/test/core` · `git commit -m "app: zine theme and widgets"`.

### Task 3: Auth repo interface, errors, fake implementation

**Files:**
- Create: `app/lib/core/app_error.dart`, `app/lib/features/auth/auth_repo.dart`, `app/lib/features/auth/fake_auth_repo.dart`, `app/lib/features/auth/validators.dart`
- Test: `app/test/features/auth/fake_auth_repo_test.dart`, `app/test/features/auth/validators_test.dart`

**Interfaces:**
- Produces:
  - `class AppError implements Exception { final String message; }` — message is Bulgarian and shown as is.
  - `enum AccountType { student, organizer }`; `enum OrgType { school, university, ngo, company, publicBody }` (DB value `public_body`).
  - `class NewProfile { AccountType type; String username; String displayName; DateTime? birthDate; String? orgName; OrgType? orgType; }`
  - `abstract class AuthRepo extends ChangeNotifier`:
    - `AuthStatus get status` where `enum AuthStatus { signedOut, awaitingCode, needsProfile, signedIn }`; `String? get pendingEmail`; `String? get userId`.
    - `Future<void> signUp(String email, String password)` → `awaitingCode`.
    - `Future<void> resendCode()`.
    - `Future<void> confirmCode(String code)` → `needsProfile`.
    - `Future<void> createProfile(NewProfile p)` → `signedIn`.
    - `Future<void> signIn(String email, String password)` → `signedIn` or `needsProfile` (no profile row).
    - `Future<void> sendPasswordReset(String email)`; `Future<void> resetPassword(String email, String code, String newPassword)`.
    - `Future<void> signOut()`; `Future<void> deleteAccount()` → `signedOut`.
  - `String? validatePassword(String)`, `String? validateUsername(String)`, `String? validateEmail(String)` — return a Bulgarian message or null. `bool isUnder14(DateTime birthDate, DateTime today)`.
  - `FakeAuthRepo({String code = '123456', Set<String> takenUsernames = const {'ivan'}})`.

- [ ] **Step 1: Failing tests:**
  - `validatePassword('short1')` not null; `validatePassword('abcdefghij')` not null (no digit); `validatePassword('abcdefghi1')` null.
  - `validateUsername('ab')` not null; `validateUsername('иван')` not null; `validateUsername('ivan_99')` null.
  - `isUnder14(DateTime(2013, 11, 28), DateTime(2027, 11, 27))` true; `isUnder14(DateTime(2013, 11, 27), DateTime(2027, 11, 27))` false.
  - Fake flow: `signUp` → `awaitingCode`; `confirmCode('000000')` throws `AppError` and stays `awaitingCode`; `confirmCode('123456')` → `needsProfile`; `createProfile(username: 'IVAN')` throws `AppError('Това потребителско име е заето')` and stays `needsProfile`; `createProfile(username: 'petya')` → `signedIn`; `deleteAccount()` → `signedOut`; listeners notified on each change.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Fake keeps users in memory; username check case-insensitive.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** — tell Bogi: `git add app/lib/core/app_error.dart app/lib/features/auth app/test/features/auth` · `git commit -m "app: auth repo interface and fake"`.

### Task 4: Supabase auth repo + email code template

**Files:**
- Create: `app/lib/features/auth/supabase_auth_repo.dart`, `app/lib/features/auth/auth_error_mapper.dart`, `supabase/templates/confirmation.html`, `supabase/templates/recovery.html`
- Modify: `supabase/config.toml` (`[auth.email.template.confirmation]` and `[auth.email.template.recovery]` → the files, Bulgarian subjects)
- Test: `app/test/features/auth/auth_error_mapper_test.dart`

**Interfaces:**
- Consumes: `AuthRepo`, `NewProfile`, `AppError` (Task 3).
- Produces: `SupabaseAuthRepo(SupabaseClient client)`; `AppError mapAuthError(Object e)`.

- [ ] **Step 1: Failing tests** for `mapAuthError`: `PostgrestException(code: '23505')` → message `Това потребителско име е заето`; `AuthException('Token has expired or is invalid')` → `Кодът е грешен или изтекъл`; `AuthException(statusCode: '429')` / `over_email_send_rate_limit` → `Изчакай минута и опитай пак`; `AuthException('Invalid login credentials')` → `Грешен имейл или парола`; `FunctionException(status: 429)` → `Твърде много опити. Опитай по-късно.`; anything else → `Нещо се обърка. Опитай пак.`
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the mapper and `SupabaseAuthRepo`:
  - `signUp` → `auth.signUp(email, password)`; `confirmCode` → `auth.verifyOTP(type: OtpType.signup, email, token)`; `resendCode` → `auth.resend(type: OtpType.signup, email)`.
  - after sign-in/confirm: select `profiles.id` for `auth.currentUser.id`; none → `needsProfile`.
  - `createProfile` → insert `profiles` (`id, account_type, username, display_name, terms_accepted_at: now UTC`), then `student_details` (`profile_id, birth_date`) or `organizer_details` (`profile_id, org_name, org_type`). If the second insert fails, delete nothing — status stays `needsProfile` and the page lets them retry (the profile row exists; on retry skip the `profiles` insert if it is there).
  - password reset → `resetPasswordForEmail` + `verifyOTP(type: OtpType.recovery)` + `updateUser(password)`.
  - `deleteAccount` → `functions.invoke('delete-account', body: {'confirm': 'DELETE'})`, then `signOut`.
  - listen to `onAuthStateChange` to keep `status` in sync across tabs.
- [ ] **Step 4:** Templates: confirmation shows `{{ .Token }}` big, Bulgarian text "Твоят код за NO FUTURE?"; recovery the same for password reset.
- [ ] **Step 5:** Run → PASS; `flutter analyze` clean.
- [ ] **Step 6 (needs Bogi):** Ask Bogi before `npx -y supabase@2 db push --linked` of Gosho's `20261127200000_profiles_feed.sql` (Gosho's tables — get his OK). Paste the two templates in Dashboard → Authentication → Email Templates (don't `config push`: it would also push the local `site_url`).
- [ ] **Step 7: Manual check** with `flutter run -d chrome` against the live project using Bogi's own email (built-in mailer only sends to project members): sign up → code arrives → profile created → row visible in Table editor → sign out/in → delete account → row gone.
- [ ] **Step 8: Commit** — tell Bogi: `git add app/lib/features/auth app/test/features/auth supabase/templates supabase/config.toml` · `git commit -m "app: Supabase auth with email codes"`.

### Task 5: Router, app shell, navigation

**Files:**
- Create: `app/lib/core/router.dart`, `app/lib/core/app_shell.dart`, `app/lib/core/services.dart`
- Modify: `app/lib/main.dart`
- Test: `app/test/core/router_test.dart`, `app/test/core/app_shell_test.dart`

**Interfaces:**
- Consumes: `AuthRepo`, `AuthStatus` (Task 3), `ThemeController` (Task 2).
- Produces:
  - `class Services { final AuthRepo auth; final ProfileRepo profiles; final ThemeController theme; static Services fake(); static Services live(SupabaseClient c); }` provided via an `InheritedWidget` `ServicesScope.of(context)`. (`ProfileRepo` is added in Task 7; until then `Services` has `auth` and `theme` only — add the field in Task 7.)
  - `String? authRedirect(AuthStatus status, String location)` — pure: public paths are `/`, `/u/*`, `/login`, `/join`, `/forgot`; `awaitingCode` → `/code` (unless there); `needsProfile` → `/create-profile` (unless there); `signedIn` on `/login|/join|/code|/create-profile` → `/profile`; private paths (`/profile`, `/settings`, `/saved`) while `signedOut` → `/login`; else null.
  - Routes: `/` (feed placeholder), `/calendar`, `/achievements`, `/join`, `/login`, `/code`, `/create-profile`, `/forgot`, `/profile`, `/u/:username`, `/settings`. `refreshListenable: auth`.
  - `AppShell` = the design's `Nav`: sticky header, brand in Rubik Glitch primary, calendar icon button, `ВХОД` / `ПРОФИЛ` pink ink button, menu button opening an end drawer with items Фийд, Профил, Календар, Постижения, Настройки, Вход/Изход; halftone background; content max width 1152.
- [ ] **Step 1: Failing tests:** `authRedirect(signedOut, '/profile') == '/login'`; `authRedirect(signedOut, '/u/ivan') == null`; `authRedirect(needsProfile, '/settings') == '/create-profile'`; `authRedirect(needsProfile, '/create-profile') == null`; `authRedirect(awaitingCode, '/') == '/code'`; `authRedirect(signedIn, '/login') == '/profile'`. Shell: with `Services.fake()` the header shows `NO FUTURE?` and `ВХОД`; tapping the menu shows `Настройки`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; `main.dart` builds `Services.fake()` when `kFake`, else `Services.live(Supabase.instance.client)`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** — tell Bogi: `git add app/lib/core app/lib/main.dart app/test/core` · `git commit -m "app: router and shell"`.

### Task 6: Auth pages

**Files:**
- Create: `app/lib/features/auth/pages/{join_page,login_page,code_page,create_profile_page,forgot_page}.dart`
- Test: `app/test/features/auth/pages_test.dart`

**Interfaces:**
- Consumes: `AuthRepo`, validators, `NewProfile` (Task 3); `ZineBox`, `ZineButton`, `RansomText` (Task 2); `ServicesScope` (Task 5).

Look follows `design/lovable` `join.tsx`: two big tilted cards "НА КОЯ СТРАНА СИ?" — `УЧЕНИК` (secondary) / `ОРГАНИЗАТОР` (primary); then a ZineBox form with Регистрация/Вход toggle. No Google/Lovable buttons. The chosen side is carried into `/create-profile`.

- [ ] **Step 1: Failing widget tests (with `FakeAuthRepo`):**
  - join: submitting password `abc` shows the `validatePassword` message and does not call `signUp`.
  - code page: entering `000000` shows `Кодът е грешен или изтекъл`; `123456` navigates to `/create-profile`.
  - create-profile, student, birth date under 14: shows `Профилът ти ще е скрит, докато родител не даде съгласие.` before submit.
  - create-profile: submit disabled until "Приемам Условията" is checked.
  - create-profile, username `IVAN`: shows `Това потребителско име е заето` and stays on the page.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the five pages. Errors from `AppError` shown in a SnackBar; buttons disabled while busy.
- [ ] **Step 4:** Run → PASS; then `flutter run -d chrome --dart-define=FAKE=true` and click through sign-up with code `123456`.
- [ ] **Step 5: Commit** — tell Bogi: `git add app/lib/features/auth/pages app/test/features/auth/pages_test.dart` · `git commit -m "app: auth pages"`.

### Task 7: Profile (own + public) and sharing

**Files:**
- Create: `app/lib/features/profile/{profile_models,profile_repo,fake_profile_repo,supabase_profile_repo}.dart`, `app/lib/features/profile/pages/{my_profile_page,public_profile_page}.dart`
- Modify: `app/lib/core/services.dart` (add `profiles`)
- Test: `app/test/features/profile/profile_test.dart`

**Interfaces:**
- Consumes: `AuthRepo.userId`, `AccountType`, `OrgType` (Task 3); `Services` (Task 5).
- Produces:
  - `class MyProfile { AccountType type; String username; String displayName; String? avatarUrl; StudentInfo? student; OrganizerInfo? organizer; }`, `StudentInfo { DateTime birthDate; String? city, school, bio; int? grade; bool isPublic; bool consentGranted; }`, `OrganizerInfo { String orgName; OrgType orgType; String? website; String verificationStatus; }`, `PublicProfile { String username, displayName; String? avatarUrl, bio, school; List<String> interests; }`.
  - `abstract class ProfileRepo extends ChangeNotifier { Future<MyProfile> loadMine(); Future<void> updateMine({String? displayName, String? city, String? school, int? grade, String? bio, bool? isPublic, String? orgName, String? website}); Future<PublicProfile?> loadPublic(String username); }` — Supabase impl reads `profiles` + details, writes only granted columns, `loadPublic` reads view `public_profiles` with `ilike` on `username`.
  - `String publicProfileUrl(String username)` = `Uri.base.origin + '/u/' + username`.
- Look follows `profile.tsx`: pink cover strip, round initials avatar overlapping it, name in Oswald, `РЕДАКТИРАЙ` button opening a dialog, sections with `RansomText` headings, `КОПИРАЙ ЛИНК` button.
- [ ] **Step 1: Failing tests (fake repo):** `loadPublic('IVAN')` returns ivan's profile (case-insensitive); a fake user with `isPublic: false` → `loadPublic` null; my-profile page with `isPublic: false` shows `Профилът ти е скрит` and a switch; tapping `КОПИРАЙ ЛИНК` puts `<origin>/u/<username>` on the clipboard (mock `SystemChannels.platform`); public page for unknown username shows `Няма такъв профил`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS; manual check against live project once Task 4 step 6 is done: make the profile public, open `/u/<username>` signed out in a private window.
- [ ] **Step 5: Commit** — tell Bogi: `git add app/lib/features/profile app/lib/core/services.dart app/test/features/profile` · `git commit -m "app: own and public profile"`.

### Task 8: Settings

**Files:**
- Create: `app/lib/features/settings/pages/settings_page.dart`
- Test: `app/test/features/settings/settings_test.dart`

**Interfaces:**
- Consumes: `ThemeController`, `ZineVibe` (Task 2); `AuthRepo.signOut/deleteAccount` (Task 3).

Look follows `settings.tsx`: `НАСТРОЙКИ` title; ZineBox "ВИЗИЯ" with three vibe buttons; ZineBox "АКАУНТ" with role, `ИЗХОД`, and red-bordered `ИЗТРИЙ АКАУНТА`. No notification switches (not built).

- [ ] **Step 1: Failing tests:** tapping `Киселина` sets `ThemeController.vibe == acid`; `ИЗТРИЙ АКАУНТА` opens a dialog whose confirm button stays disabled until the field reads `ИЗТРИЙ`; confirming calls `deleteAccount` and ends on `/`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** — tell Bogi: `git add app/lib/features/settings app/test/features/settings` · `git commit -m "app: settings with delete account"`.

### Task 9: Team placeholders and docs

**Files:**
- Create: `app/lib/features/{feed,calendar,achievements}/pages/<x>_page.dart`, `app/README.md`
- Modify: `CLAUDE.md` (new section "Приложение (`app/`)")
- Test: `app/test/features/placeholders_test.dart`

- [ ] **Step 1: Failing test:** each placeholder page shows its title (`ФИЙД`, `КАЛЕНДАР`, `ПОСТИЖЕНИЯ`) and the owner line (`Гошо`, `Ники`, `Захари`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement placeholders (title + "скоро — прави го <owner>" in a ZineBox).
- [ ] **Step 4:** `app/README.md`: how to run (`flutter run -d chrome`, `--dart-define=FAKE=true`), the folder-per-person rule, the repo pattern (interface + fake + supabase), where the theme widgets are, "never put the secret key in the app". Add the same in short to `CLAUDE.md`.
- [ ] **Step 5:** Full check: `flutter test` all PASS; `flutter analyze` clean; `flutter build web --release` succeeds.
- [ ] **Step 6: Commit** — tell Bogi: `git add app CLAUDE.md` · `git commit -m "app: team placeholders and docs"`.
