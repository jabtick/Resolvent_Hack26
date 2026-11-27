# Схема на базата: профили и фийд (предложение)

Последно обновено: 2026-11-27 · Автор: Боги
Жива версия (за коментари): https://claude.ai/artifact/UFQhCpbrdzsozg9tpGYQRv — ако се разминават, поправете и двете.

## Какво е това

Предложение за схемата на профилите и фийда: 8 таблици и 1 изглед в `public`. Пише Боги, за Гошо и Ники, които държат базата. Решават те; коментирайте в живата версия.

Значките и резултатите от Excel нарочно не са тук. Ще се добавят после като нови таблици, които сочат към `opportunities` (тип `competition`), без да се пипа нищо от тази схема.

## Профили

Всеки потребител има ред в `profiles` и точно един ред с детайли според типа си. Организаторският акаунт е самата организация (простият вариант, без членове). Имейлът живее само в `auth.users`.

**profiles**

| Колона | Тип | Бележки |
| --- | --- | --- |
| id | uuid PK | `references auth.users(id) on delete cascade` |
| account_type | enum `student` / `organizer` | |
| username | text unique | за публичния линк `/u/<username>` |
| display_name | text | |
| avatar_url | text | път в Storage |
| terms_accepted_at | timestamptz | кога е приел Условията; тук, за да важи и за организатори |
| created_at | timestamptz | |

**student_details**

| Колона | Тип | Бележки |
| --- | --- | --- |
| profile_id | uuid PK | `references profiles(id) on delete cascade` |
| birth_date | date | дата, не възраст; нужна за съгласието под 14 г. |
| gender | enum `male` / `female` / `other` / `prefer_not_to_say`, nullable | по желание, никога публично |
| city | text | |
| school | text | |
| grade | smallint | |
| bio | text | |
| is_public | bool, default false | профилът е скрит, докато ученикът не го направи публичен |
| guardian_email | text | само под 14 г. |
| consent_token_hash | text | за линка за потвърждение към родителя |
| consent_granted_at | timestamptz | null = няма съгласие |

**organizer_details**

| Колона | Тип | Бележки |
| --- | --- | --- |
| profile_id | uuid PK | `references profiles(id) on delete cascade` |
| org_name | text | |
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
| organizer_id | uuid, nullable | `references profiles(id) on delete cascade`; null = изскрейпено |
| title, description | text | |
| image_url | text | |
| external_url | text | линкът за кандидатстване |
| city | text | |
| is_online | bool | |
| audience | enum `school` / `university` / `both` | |
| starts_at, ends_at | timestamptz, nullable | кога се случва |
| deadline_at | timestamptz, nullable | срок за кандидатстване |
| status | enum `draft` / `published` / `archived` | |
| source | enum `organizer` / `scraper` | |
| source_url | text unique | скрейпърът да не добавя два пъти едно и също |
| search_vector | tsvector, generated | търсене по заглавие и описание; конфигурация `simple`, защото Postgres няма български речник |
| created_at, updated_at | timestamptz | |

**Тагове и свързващи таблици**

| Таблица | Колони | Защо |
| --- | --- | --- |
| tags | id, name, slug | фиксиран списък, зареждаме го ние; клиентите не добавят |
| opportunity_tags | opportunity_id, tag_id | тагове на обявата, за филтри |
| profile_interests | profile_id, tag_id | интереси на ученика, за препоръки |
| saved_opportunities | profile_id, opportunity_id, created_at | запазени обяви = „моят календар“ |

Всички FK към `profiles` и `opportunities` са `on delete cascade`. Препоръките и статистиките за организатори са заявки върху тези таблици и не искат нови.

## Споделяне

Публичният профил се чете от изгледа `public_profiles`, затова няма отделна таблица за споделяне. Линкът е `/u/<username>`.

- **Показва:** username, display_name, avatar_url, bio, school, интереси.
- **Само където** `is_public = true`.
- **Никога не показва:** birth_date, gender, city, guardian_email, имейл.

По-късно значките се закачат към същата страница.

## Достъп (RLS) и легални изисквания

RLS е включено на всички 8 таблици. Правилата ги пише Боги.

| Таблица | Кой чете | Кой пише |
| --- | --- | --- |
| profiles, student_details | собственикът; другите само през `public_profiles` | собственикът |
| organizer_details | всеки | собственикът, без `verification_status` и `verified_at` (те само от сървъра) |
| opportunities | всеки, и без вход, ако е `published`; организаторът вижда и своите чернови | организаторът, само своите; скрейпърът през service_role |
| tags, opportunity_tags | всеки | tags: никой от клиента; opportunity_tags: организаторът на обявата |
| profile_interests, saved_opportunities | собственикът | собственикът |

Легално задължително, останалото е по избор (да се провери с Антон преди пускане):

- **Скрит по подразбиране** (GDPR чл. 25(2)): `is_public default false`.
- **Родителско съгласие под 14 г.** (ЗЗЛД): `birth_date` + трите колони за съгласие.
- **Изтриване на акаунт:** `on delete cascade` навсякъде, за да работи `delete-account`.
- **Пол:** по желание, с посочена цел в Политиката за личните данни.

## Отложено и отворени въпроси

Отложено (добавя се без промяна на тези таблици):

- **Значки и резултати:** нови таблици с FK към `opportunities`.
- **Препоръки:** заявка тагове срещу интереси.
- **Статистики за организатори:** заявка върху `saved_opportunities`.
- **„Само верифициран организатор публикува“:** едно условие в RLS, когато решим.

Отворени въпроси:

- [ ] Кои са таговете в началния списък?
- [ ] Гошо и Ники: съгласни ли сте със схемата и кой пише миграцията?
