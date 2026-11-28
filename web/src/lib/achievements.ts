// Badges earned from organisers' verified results (`badges`, written only by the
// server; see supabase/migrations/20261128140000_badges.sql). Until a student has
// a real badge the page shows clearly marked samples instead.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { AppError, mapError } from "./errors";

type Db = SupabaseClient<Database>;

export type Badge = {
  id: string;
  event: string;
  org: string;
  /** Month and year, already formatted ("Апр 2026"). */
  date: string;
  /** 1, 2, 3 for a podium place; null for participation. */
  place: 1 | 2 | 3 | null;
  /** Hidden from the public profile by its owner. */
  hidden: boolean;
  isSample: boolean;
};

const sample = (b: Omit<Badge, "hidden" | "isSample">): Badge => ({
  ...b,
  hidden: false,
  isSample: true,
});

export const SAMPLE_BADGES: Badge[] = [
  sample({
    id: "b1",
    event: "Национална олимпиада по математика",
    org: "Министерство на образованието",
    date: "Апр 2026",
    place: 1,
  }),
  sample({
    id: "b2",
    event: "Роботика Купа Варна",
    org: "TechSchool Варна",
    date: "Мар 2026",
    place: 3,
  }),
  sample({
    id: "b3",
    event: "Конкурс за млади писатели",
    org: "Фондация Силно платно",
    date: "Фев 2026",
    place: null,
  }),
  sample({
    id: "b4",
    event: "Informatics Open",
    org: "Riot Code Collective",
    date: "Яну 2026",
    place: 2,
  }),
  sample({
    id: "b5",
    event: "Климатичен спринт на идеи",
    org: "Climate Mosh Pit",
    date: "Ное 2025",
    place: null,
  }),
  sample({
    id: "b6",
    event: "Турнир по физика",
    org: "Garage Science Club",
    date: "Окт 2025",
    place: null,
  }),
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

const MONTHS = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];

/** "2026-04-15" → "Апр 2026". Read as text, so time zones can't shift the month. */
export function formatBadgeDate(date: string): string {
  const [y, m] = date.split("-");
  const month = MONTHS[Number(m) - 1];
  return month && y ? `${month} ${y}` : date;
}

function toPlace(n: number | null): Badge["place"] {
  return n === 1 || n === 2 || n === 3 ? n : null;
}

async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw mapError(e);
  }
}

export function createAchievementsApi(db: Db) {
  async function uid(): Promise<string | null> {
    const { data } = await db.auth.getSession();
    return data.session?.user.id ?? null;
  }

  return {
    /** The signed-in student's badges, newest event first (hidden ones too). */
    listMine: () =>
      guard(async (): Promise<Badge[]> => {
        const me = await uid();
        if (!me) return [];
        const { data, error } = await db
          .from("badges")
          .select("id, event_title, org_name, event_date, place, is_hidden")
          .eq("profile_id", me)
          .order("event_date", { ascending: false })
          .limit(200);
        if (error) throw error;
        return (data ?? []).map((r) => ({
          id: r.id,
          event: r.event_title,
          org: r.org_name,
          date: formatBadgeDate(r.event_date),
          place: toPlace(r.place),
          hidden: r.is_hidden,
          isSample: false,
        }));
      }),

    /** Badges anyone can see on /u/<username> (public profiles, not hidden). */
    listPublic: (username: string) =>
      guard(async (): Promise<Badge[]> => {
        const { data, error } = await db
          .from("public_badges")
          .select("id, event_title, org_name, event_date, place")
          .eq("username", username)
          .order("event_date", { ascending: false })
          .limit(200);
        if (error) throw error;
        return (data ?? []).flatMap((r) =>
          r.id && r.event_title && r.org_name && r.event_date
            ? [
                {
                  id: r.id,
                  event: r.event_title,
                  org: r.org_name,
                  date: formatBadgeDate(r.event_date),
                  place: toPlace(r.place),
                  hidden: false,
                  isSample: false,
                },
              ]
            : [],
        );
      }),

    /** Hide or show one of your badges on your public profile (the only change allowed). */
    setHidden: (badge: Pick<Badge, "id" | "isSample">, hidden: boolean) =>
      guard(async () => {
        if (badge.isSample) throw new AppError("Това е примерна значка.");
        const me = await uid();
        if (!me) throw new AppError("Влез, за да промениш значките си.");
        const { error } = await db
          .from("badges")
          .update({ is_hidden: hidden })
          .eq("id", badge.id)
          .eq("profile_id", me);
        if (error) throw error;
      }),
  };
}

export type AchievementsApi = ReturnType<typeof createAchievementsApi>;
