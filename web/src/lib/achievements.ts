// Badges earned from organisers' verified results.
// TODO(Zahari + Gosho): there is no badges table yet. When it exists, add
// createAchievementsApi(db) here (like opps.ts) and swap SAMPLE_BADGES for it.

export type Badge = {
  id: string;
  event: string;
  org: string;
  /** Month and year, already formatted ("Апр 2026"). */
  date: string;
  /** 1, 2, 3 for a podium place; null for participation. */
  place: 1 | 2 | 3 | null;
};

export const SAMPLE_BADGES: Badge[] = [
  {
    id: "b1",
    event: "Национална олимпиада по математика",
    org: "Министерство на образованието",
    date: "Апр 2026",
    place: 1,
  },
  { id: "b2", event: "Роботика Купа Варна", org: "TechSchool Варна", date: "Мар 2026", place: 3 },
  {
    id: "b3",
    event: "Конкурс за млади писатели",
    org: "Фондация Силно платно",
    date: "Фев 2026",
    place: null,
  },
  {
    id: "b4",
    event: "Informatics Open",
    org: "Riot Code Collective",
    date: "Яну 2026",
    place: 2,
  },
  {
    id: "b5",
    event: "Климатичен спринт на идеи",
    org: "Climate Mosh Pit",
    date: "Ное 2025",
    place: null,
  },
  {
    id: "b6",
    event: "Турнир по физика",
    org: "Garage Science Club",
    date: "Окт 2025",
    place: null,
  },
];

export const PLACE_LABEL: Record<1 | 2 | 3, string> = {
  1: "1-ВО МЯСТО",
  2: "2-РО МЯСТО",
  3: "3-ТО МЯСТО",
};

export function badgeStats(badges: Badge[]) {
  return {
    total: badges.length,
    podium: badges.filter((b) => b.place !== null).length,
    orgs: new Set(badges.map((b) => b.org)).size,
  };
}
