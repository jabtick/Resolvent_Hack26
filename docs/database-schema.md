# Схема на базата: профили и фийд (предложение)

Последно обновено: 2026-11-27 · Автор: Боги
Жива версия (за коментари): https://claude.ai/artifact/UFQhCpbrdzsozg9tpGYQRv — ако се разминават, поправете и двете.

## Какво е това

Предложение за схемата на профилите и фийда: 8 таблици и 1 изглед в `public`. Пише Боги, за Гошо и Ники, които държат базата. Решават те; коментирайте в живата версия.

**SQL:** [supabase/migrations/20261127200000_profiles_feed.sql](../supabase/migrations/20261127200000_profiles_feed.sql) — таблици, enum-и, индекси, права по колони, RLS и изгледът. Без данни: списъкът с тагове е празен.

Значките и резултатите от Excel нарочно не са тук. Ще се добавят после като нови таблици, които сочат към `opportunities` (тип `competition`), без да се пипа нищо от тази схема.

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

## Споделяне

Публичният профил се чете от изгледа `public_profiles`, затова няма отделна таблица за споделяне. Линкът е `/u/<username>`.

- **Показва:** username, display_name, avatar_url, bio, school, интереси.
- **Само където** `is_public = true`. Под 14 г. без родителско съгласие профилът не се показва, дори да е публичен.
- **Никога не показва:** birth_date, gender, city, guardian_email, имейл.

По-късно значките се закачат към същата страница.

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

**Статус:** и петте са вписани в таблиците по-горе и са написани в SQL миграцията. Още не е тествана срещу истинска база.

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
- Верифициран организатор може после да си смени `org_name` и да остане `verified`, т.е. да се представи за друга организация. Предложение: смяна на името връща статуса на `pending`.

## Отложено и отворени въпроси

Отложено (добавя се без промяна на тези таблици):

- **Значки и резултати:** нови таблици с FK към `opportunities`.
- **Препоръки:** заявка тагове срещу интереси.
- **Статистики за организатори:** заявка върху `saved_opportunities`.

Отворени въпроси:

- [ ] Кои са таговете в началния списък?
- [ ] Гошо и Ники: прегледайте миграцията, преди да се пусне в Supabase.
