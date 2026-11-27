# NO FUTURE? — уеб приложението

Flutter за web. Свързано е със Supabase проекта на екипа (`tjkwpebrakwfkhenpayl`).

## Пускане

От PowerShell, с **главно `C:`** в пътя (с малко `c:` Flutter понякога си чупи файловете):

```
Set-Location C:\Users\<ти>\Resolvent_Hack26\app
flutter pub get
flutter run -d chrome                       # истинският Supabase
flutter run -d chrome --dart-define=FAKE=true   # само примерни данни, без сървър
flutter test                                # всички тестове
flutter build web --release                 # за Netlify → build/web
```

Във FAKE режим кодът от имейла е винаги `123456`, а заето потребителско име е `ivan`.

## Папки — всеки в своята

```
lib/
  core/            общото (Боги): config, Supabase, навигация (router.dart, app.dart), тема, общи уиджети
  features/
    auth/          вход, регистрация, код, нова парола (Боги)
    profile/       собствен и публичен профил /u/<име> (Боги)
    settings/      визия, изход, изтриване на акаунт (Боги)
    feed/          фийд (Гошо)
    calendar/      календар (Ники)
    achievements/  постижения и значки (Захари)
```

Пипай само своята папка. Ако ти трябва нещо в `core/`, кажи на Боги.

## Как се прави една функционалност

Екраните **не викат Supabase директно**. Всяка папка има:

1. `<x>_repo.dart` — абстрактен клас (`extends ChangeNotifier`) с методите, които екраните ползват;
2. `fake_<x>_repo.dart` — примерни данни в паметта (за FAKE режим и тестове);
3. `supabase_<x>_repo.dart` — истинските заявки;
4. `pages/` — екраните.

После:

- добави repo-то в `core/services.dart` (поле + `Services.fake()` + `Services.live()`);
- в екрана го взимаш с `ServicesScope.of(context).<x>`;
- страницата се закача в `appPages()` в `core/app.dart` (там вече има ред за твоя път).

Пример за всичко това: `features/profile/`.

## Визията (от дизайна в Lovable)

`core/widgets/zine.dart`:

- `ZineBox` — кутия с 3px рамка и твърда сянка (`pink: true` за розова сянка, `tilt:` за наклон);
- `RansomText` — заглавие „изрязано“ на черна лента;
- `ZineButton` — дебел бутон;
- `HalftoneBackground` — точковият фон.

Цветовете: `context.zine.primary`, `.secondary`, `.accent`, `.ink`, `.card`… (`core/theme/palette.dart`). Шрифтове: `ZineText.heavy(…)`, `ZineText.hand(…)`, `ZineText.display(…)` (`core/theme/app_theme.dart`). Не слагай цветове на ръка — така трите теми (Ксерокс, Мазе, Киселина) работят сами.

## Сигурност

- В приложението е **само публичният** ключ (`sb_publishable_…`) — той е публичен по замисъл.
- **Никога** не слагай тайния ключ (`sb_secret_…` / `service_role`) или паролата на базата в кода.
- Какво може да прави потребителят решават RLS правилата в `supabase/migrations/`, не приложението. Нужно е ново право → кажи на Боги.
- Грешките към потребителя минават през `AppError` (съобщение на български).

## Netlify

`web/_redirects` пренасочва всички адреси към `index.html`, за да работи опресняване на `/u/<име>`. Сайтът се качва от `build/web`.
