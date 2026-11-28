// Sample items shown while the opportunities table is empty (demo, local dev).
// Clearly marked as samples in the UI and cannot be saved.
import type { Opp } from "@/lib/opps";

type Raw = Omit<Opp, "id" | "isSample" | "color" | "externalUrl" | "startsAt"> & { in: number };

const DAY = 86_400_000;
// 16:00 UTC = 18:00 in Bulgaria.
const at = (days: number) => new Date(Date.UTC(2026, 11, 1, 16) + days * DAY).toISOString();

const raw: Raw[] = [
  {
    title: "Хакатон Бургас 26",
    org: "Резолвент",
    type: "competition",
    tags: ["Програмиране", "Екипна работа"],
    city: "Бургас",
    online: false,
    in: 10,
    deadlineAt: null,
    description:
      "48 часа, отбори до 6 души, ментори от индустрията и награди за първите три места.",
  },
  {
    title: "Стипендия „Млади таланти“",
    org: "Фондация „Еволюция“",
    type: "scholarship",
    tags: ["Наука", "Математика"],
    city: null,
    online: true,
    in: 25,
    deadlineAt: null,
    description: "Месечна стипендия за ученици с отличен успех и участие в олимпиади.",
  },
  {
    title: "Летен стаж — уеб разработка",
    org: "Код Академия",
    type: "internship",
    tags: ["Програмиране"],
    city: "София",
    online: true,
    in: 40,
    deadlineAt: null,
    description:
      "Три месеца платен стаж в екип, който прави приложения за неправителствени организации.",
  },
  {
    title: "Ден на отворените врати — ФМИ",
    org: "Софийски университет",
    type: "open_day",
    tags: ["Университет"],
    city: "София",
    online: false,
    in: 14,
    deadlineAt: null,
    description:
      "Запознай се с преподаватели и студенти, разгледай лабораториите и пробвай задачи от приемния изпит.",
  },
  {
    title: "Национална олимпиада по роботика",
    org: "Роботика БГ",
    type: "competition",
    tags: ["Роботика", "Инженерство"],
    city: "Пловдив",
    online: false,
    in: 30,
    deadlineAt: null,
    description: "Отборно състезание с роботи, които сами решават полоса с препятствия.",
  },
  {
    title: "Програма „Предприемач за един ден“",
    org: "Джуниър Ачийвмънт",
    type: "university_program",
    tags: ["Бизнес", "Предприемачество"],
    city: "Варна",
    online: false,
    in: 20,
    deadlineAt: null,
    description: "Ден в реален бизнес с ментор: срещи, решения и представяне пред инвеститори.",
  },
  {
    title: "Стипендия за изкуство",
    org: "Фондация „Цвят“",
    type: "scholarship",
    tags: ["Изкуство", "Дизайн"],
    city: null,
    online: true,
    in: 55,
    deadlineAt: null,
    description: "Финансиране за портфолио и материали за млади художници и дизайнери.",
  },
  {
    title: "Стаж в лаборатория по биотехнологии",
    org: "БАН",
    type: "internship",
    tags: ["Наука", "Биология"],
    city: "София",
    online: false,
    in: 35,
    deadlineAt: null,
    description: "Работа с истински изследователи по проект за опазване на Черно море.",
  },
];

export const SAMPLE_OPPS: Opp[] = raw.map((r, i) => {
  const colors = ["primary", "secondary", "accent"] as const;
  const { in: inDays, ...rest } = r;
  return {
    ...rest,
    id: `sample-${i + 1}`,
    deadlineAt: at(inDays),
    startsAt: at(inDays + 7),
    externalUrl: null,
    color: colors[i % 3]!,
    isSample: true,
  };
});
