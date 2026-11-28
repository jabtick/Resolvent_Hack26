# Схема на базата: профили и фийд

Последно обновено: 2026-11-28 · Схема: Гошо, Ники · Правила за достъп (RLS): Боги
Жива версия (за коментари): https://claude.ai/artifact/UFQhCpbrdzsozg9tpGYQRv — ако се разминават, поправете и двете.

## Какво е това

Схемата на профилите и фийда: 8 таблици и 1 изглед в `public`. **Качена е в Supabase** (проект `tjkwpebrakwfkhenpayl`). Промени по таблиците → Гошо и Ники; кой какво може да чете и пише → Боги.

**SQL:**

- [20261127200000_profiles_feed.sql](../supabase/migrations/20261127200000_profiles_feed.sql) — таблици, enum-и, индекси, права по колони, RLS и изгледът.
- [20261127200100_organizer_rename_resets_verification.sql](../supabase/migrations/20261127200100_organizer_rename_resets_verification.sql) — верифициран организатор, който смени `org_name`, става отново `pending`.

Качена миграция не се редактира: всяка промяна е нов файл в `supabase/migrations/`. Таблицата `tags` още е празна.

Значките и резултатите са в отделна миграция, [20261128140000_badges.sql](../supabase/migrations/20261128140000_badges.sql) — виж „Значки и резултати“ по-долу. Качена е в Supabase.

## Профили

Всеки потребител има ред в `profiles` и точно един ред с детайли според типа си. Организаторският акаунт е самата организация (простият вариант, без членове). Имейлът живее само в `auth.users`.

**profiles**

| Колона | Тип | Бележки |
| --- | --- | --- |
| id | uuid PK | `references auth.users(id) on delete cascade` |
| account_type | enum `student` / `organizer` | задава се при създаване на профила, после **само сървърът** го сменя |
| username | text | за публичния линк `/u/<username>`; 3–30 знака, само `A-Z a-z 0-9 _ . -`; уникален индекс по `lower(username)`, за да не съществуват `Ivan` и `ivan` едновременно |
| display_name | text, задължително | до 80 знака |
| avatar_url | text | път в Storage |
| terms_accepted_at | timestamptz, задължително | кога е приел Условията; тук, за да важи и за организатори |
| created_at | timestamptz | |

**student_details**

| Колона | Тип | Бележки |
| --- | --- | --- |
| profile_id | uuid PK | `references profiles(id) on delete cascade` |
| birth_date | date, задължително | дата, не възраст; нужна за съгласието под 14 г.; задава се веднъж при регистрация, после **само сървърът** я сменя |
| gender | enum `male` / `female` / `other` / `prefer_not_to_say`, nullable | по желание, никога публично |
| city | text | |
| school | text | |
| grade | smallint | 1–12; празно за студенти |
| bio | text | до 1000 знака |
| is_public | bool, default false | профилът е скрит, докато ученикът не го направи публичен |
| guardian_email | text | само под 14 г.; пише се **само от сървъра** |
| consent_token_hash | text | за линка за потвърждение към родителя; **само сървърът** |
| consent_granted_at | timestamptz | null = няма съгласие; **само сървърът**, когато родителят потвърди |

**organizer_details**

| Колона | Тип | Бележки |
| --- | --- | --- |
| profile_id | uuid PK | `references profiles(id) on delete cascade` |
| org_name | text, задължително | до 120 знака |
| org_type | enum `school` / `university` / `ngo` / `company` / `public_body` | |
| website | text | |
| verification_status | enum `pending` / `verified` / `rejected`, default `pending` | сменя се **само от сървъра**; засега на ръка от таблото на Supabase |
| verified_at | timestamptz | |

## Фийд и календар

Всичко във фийда е в една таблица, `opportunities`. Изскрейпените обяви са в същата таблица с `organizer_id = null`. Календарът се строи от `deadline_at` и `starts_at`.

**opportunities**

| Колона | Тип | Бележки |
| --- | --- | --- |
| id | uuid PK | |
| type | enum `competition` / `scholarship` / `internship` / `open_day` / `university_program` | |
| organizer_id | uuid, nullable, default `auth.uid()` | `references profiles(id) on delete cascade`; null = изскрейпено; попълва се сам, клиентът не може да го подаде |
| title | text, задължително | до 200 знака |
| description | text | |
| image_url | text | |
| external_url | text | линкът за кандидатстване |
| city | text | |
| is_online | bool, default false | |
| audience | enum `school` / `university` / `both`, default `both` | |
| starts_at, ends_at | timestamptz, nullable | кога се случва; `ends_at` не може да е преди `starts_at` |
| deadline_at | timestamptz, nullable | срок за кандидатстване |
| status | enum `draft` / `published` / `archived`, default `draft` | `published` само ако организаторът е `verified` |
| source | enum `organizer` / `scraper`, default `organizer` | клиентът не може да го подаде; `scraper` само през service_role; `source = 'organizer'` винаги върви с попълнен `organizer_id` |
| source_url | text unique | скрейпърът да не добавя два пъти едно и също |
| search_vector | tsvector, generated | търсене по заглавие и описание; конфигурация `simple`, защото Postgres няма български речник |
| created_at, updated_at | timestamptz | |

**Тагове и свързващи таблици**

| Таблица | Колони | Защо |
| --- | --- | --- |
| tags | id (smallint identity), name, slug (и двете уникални) | фиксиран списък, зареждаме го ние; клиентите не добавят |
| opportunity_tags | opportunity_id, tag_id | тагове на обявата, за филтри |
| profile_interests | profile_id, tag_id | интереси на ученика, за препоръки |
| saved_opportunities | profile_id, opportunity_id, created_at | запазени обяви = „моят календар“ |

Всички FK към `profiles` и `opportunities` са `on delete cascade`. Препоръките и статистиките за организатори са заявки върху тези таблици и не искат нови.

## Значки и резултати

Миграция [20261128140000_badges.sql](../supabase/migrations/20261128140000_badges.sql), качена е в Supabase. Само схемата: четенето на Excel и раздаването на значки (сървърът) още не са направени.

Как е замислено: организаторът на състезание качва резултатите → сървърът пише по ред за участник в `event_results` → свързва редовете с профили на ученици → пише `badges`. **Клиентът никога не пише значки или резултати**, само сървърът (service_role), затова значка не може да се фалшифицира от браузъра.

**event_results** — един ред на участник, както е качен от организатора

| Колона | Тип | Бележки |
| --- | --- | --- |
| id | uuid PK | |
| opportunity_id | uuid, задължително | `references opportunities(id) on delete cascade` — събитието |
| rank | smallint, nullable | крайно класиране, 1 = победител; null = участвал без място |
| full_name | text, задължително | до 120 знака |
| email | text, nullable | с малки букви; за свързване с профил; уникален в рамките на едно събитие |
| profile_id | uuid, nullable | `references profiles(id) on delete set null`; null = още не е свързан (напр. ученикът няма акаунт) |
| created_at | timestamptz | |

**badges** — какво е спечелил ученикът

| Колона | Тип | Бележки |
| --- | --- | --- |
| id | uuid PK | за линк към конкретна значка |
| profile_id | uuid, задължително | `references profiles(id) on delete cascade` |
| opportunity_id | uuid, nullable | `references opportunities(id) on delete set null`; една значка на ученик на събитие |
| result_id | uuid, nullable | `references event_results(id) on delete set null` — от кой ред е дошла |
| place | smallint, nullable | 1, 2, 3 = място на подиума; null = значка за участие (същото като `Badge.place` в `web/src/lib/achievements.ts`) |
| event_title, org_name, event_date | text, text, date — задължителни | копие от събитието при раздаване, за да остане значката, ако организаторът изтрие събитието или акаунта си |
| is_hidden | bool, default false | ученикът може да скрие значка от публичния си профил; единствената колона, която клиентът може да сменя |
| awarded_at | timestamptz | |

**public_badges** (изглед) — значките, които всеки вижда: само на публични профили, под 14 г. само със съгласие от родител (същите правила като `public_profiles`), без скритите. Колони: id, username, opportunity_id, event_title, org_name, event_date, place, awarded_at.

**Достъп:**

| Таблица | Кой чете | Кой пише |
| --- | --- | --- |
| event_results | само организаторът на събитието (има имена и имейли) | само сървърът |
| badges | ученикът (своите) и организаторът на събитието | само сървърът; ученикът сменя само `is_hidden` |
| public_badges | всеки, и без вход | — |

**Сървърът трябва да проверява** (не е в схемата, защото пише само той): организаторът е `verified`, събитието е негово и е `competition`, профилът е на ученик.

**Отворено:** как ред от Excel се свързва с профил (предложение: по потвърден имейл; несвързаните редове чакат с `profile_id = null` и се свързват при регистрация). Таблица за самите качени файлове (Storage) ще се добави заедно с качването.

## Споделяне

Публичният профил се чете от изгледа `public_profiles`, затова няма отделна таблица за споделяне. Линкът е `/u/<username>`.

- **Показва:** username, display_name, avatar_url, bio, school, интереси.
- **Само където** `is_public = true`. Под 14 г. без родителско съгласие профилът не се показва, дори да е публичен.
- **Никога не показва:** birth_date, gender, city, guardian_email, имейл.

Значките на същата страница идват от изгледа `public_badges`.

## Достъп (RLS) и легални изисквания

RLS е включено на всички 8 таблици. Правилата ги пише Боги.

| Таблица | Кой чете | Кой пише |
| --- | --- | --- |
| profiles | собственикът; другите само през `public_profiles` | собственикът, без `account_type` след създаване (само сървърът) |
| student_details | собственикът; другите само през `public_profiles` | собственикът, без `birth_date` след създаване и без `guardian_email`, `consent_token_hash`, `consent_granted_at` (само сървърът) |
| organizer_details | всеки | собственикът, без `verification_status` и `verified_at` (само сървърът) |
| opportunities | всеки, и без вход, ако е `published`; организаторът вижда и своите чернови | организаторът, само своите: `with check (organizer_id = auth.uid() and source = 'organizer')`; `published` само ако `verification_status = 'verified'`; скрейпърът през service_role |
| tags, opportunity_tags | всеки | tags: никой от клиента; opportunity_tags: организаторът на обявата |
| profile_interests, saved_opportunities | собственикът | собственикът |

Легално задължително, останалото е по избор (да се провери с Антон преди пускане):

- **Скрит по подразбиране** (GDPR чл. 25(2)): `is_public default false`.
- **Родителско съгласие под 14 г.** (ЗЗЛД): `birth_date` + трите колони за съгласие.
- **Изтриване на акаунт:** `on delete cascade` навсякъде, за да работи `delete-account`.
- **Пол:** по желание, с посочена цел в Политиката за личните данни.

## Сигурност: задължителни поправки (от Боги, 2026-11-27)

Пет дупки, които трябва да са затворени, преди схемата да стане SQL. 1–4 Боги ги прави с RLS и права на ниво колона, таблиците не се променят. 5 е за Гошо и Ники при писане на таблицата.

**Статус:** и петте са в SQL миграцията и са качени в Supabase. Правилата още не са тествани с истински акаунти (опит да се пише забранено поле).

| # | Проблем | Какво може да направи някой | Поправка |
| --- | --- | --- | --- |
| 1 | Ученикът пише сам в `student_details` | Дете под 14 си слага `consent_granted_at` само и „дава“ родителско съгласие, или си сменя `birth_date`, за да изглежда по-голямо | `guardian_email`, `consent_token_hash`, `consent_granted_at` се пишат **само от сървъра**; `birth_date` се задава веднъж при регистрация и после само сървърът я сменя |
| 2 | `profiles.account_type` се пише от собственика | Ученик става организатор с един ред | Задава се само при създаване на профила, после само от сървъра |
| 3 | „Само верифициран организатор публикува“ беше отложено | Всеки се регистрира като организатор и веднага публикува обяви пред деца (спам, фишинг) | Влиза сега: неверифициран организатор може да има само `draft`; `published` иска `verification_status = 'verified'` |
| 4 | `opportunities`: „организаторът пише своите“ | Без проверка може да подаде чужд `organizer_id` или `source = 'scraper'` | RLS `with check`: `organizer_id = auth.uid()` и `source = 'organizer'` |
| 5 | `username unique` различава главни и малки букви | `Ivan` и `ivan` са различни акаунти, което улеснява представянето за чужд човек | Уникален индекс по `lower(username)` |

Технически: права на ниво колона (`revoke update (…) on … from authenticated`) плюс RLS `with check`. Сървърът (Edge Functions със service_role) не е засегнат.

**За обсъждане (не блокира):**

- `public_profiles` показва училището публично, включително на деца, а така дете може да бъде намерено. Предложение: под 14 години училището не се показва.
- В `public_profiles` липсват организаторите, а и те трябва да имат публична страница.
- ~~Верифициран организатор може после да си смени `org_name` и да остане `verified`.~~ Решено: смяна на името връща статуса на `pending` (миграция `organizer_rename_resets_verification`).

## Отложено и отворени въпроси

Отложено (добавя се без промяна на тези таблици):

- **Препоръки:** заявка тагове срещу интереси.
- **Статистики за организатори:** заявка върху `saved_opportunities`.

Отворени въпроси:

- [ ] Кои са таговете в началния списък? Списъците в `pipeline/scraper` (Ники) и `pipeline/normalizer/taxonomy.py` (Захари) се разминават.
