// Badges earned from organisers' verified results. Clients only read them (the server
// writes them, so they can't be forged); the owner can hide one from the public profile.
// Tables: `badges` (own, RLS) and the `public_badges` view (public profiles only).
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { mapError } from "./errors";

type Db = SupabaseClient<Database>;

export type Badge = {
  id: string;
  event: string;
  org: string;
  /** Month and year, already formatted ("Апр 2026"). */
  date: string;
  /** 1, 2, 3 for a podium place; null for participation. */
  place: 1 | 2 | 3 | null;
  isHidden: boolean;
  isSample: boolean;
};

const MONTHS = ["Яну", "Фев", "Мар", "Апр", "Май", "Юни", "Юли", "Авг", "Сеп", "Окт", "Ное", "Дек"];

/** "2026-04-12" → "Апр 2026". Read by hand, so the time zone can't shift the month. */
export function formatBadgeDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month ? `${month} ${m[1]}` : "";
}

function toPlace(n: number | null): Badge["place"] {
  return n === 1 || n === 2 || n === 3 ? n : null;
}

/** Shown while a person has no badges yet, clearly marked as examples. */
export const SAMPLE_BADGES: Badge[] = [
  ["Национална олимпиада по математика", "Министерство на образованието", "Апр 2026", 1],
  ["Роботика Купа Варна", "TechSchool Варна", "Мар 2026", 3],
  ["Конкурс за млади писатели", "Фондация Силно платно", "Фев 2026", null],
  ["Informatics Open", "Riot Code Collective", "Яну 2026", 2],
  ["Климатичен спринт на идеи", "Climate Mosh Pit", "Ное 2025", null],
  ["Турнир по физика", "Garage Science Club", "Окт 2025", null],
].map(([event, org, date, place], i) => ({
  id: `sample-${i + 1}`,
  event: event as string,
  org: org as string,
  date: date as string,
  place: place as Badge["place"],
  isHidden: false,
  isSample: true,
}));

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

async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw mapError(e);
  }
}

export function createAchievementsApi(db: Db) {
  return {
    /** The signed-in person's badges, newest first (empty when signed out). */
    listMine: () =>
      guard(async (): Promise<Badge[]> => {
        const { data: s } = await db.auth.getSession();
        const me = s.session?.user.id;
        if (!me) return [];
        const { data, error } = await db
          .from("badges")
          .select("id, event_title, org_name, event_date, place, is_hidden")
          .eq("profile_id", me)
          .order("event_date", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((r) => ({
          id: r.id,
          event: r.event_title,
          org: r.org_name,
          date: formatBadgeDate(r.event_date),
          place: toPlace(r.place),
          isHidden: r.is_hidden,
          isSample: false,
        }));
      }),

    /** Someone's visible badges for their public page (hidden ones never come back). */
    listPublic: (username: string) =>
      guard(async (): Promise<Badge[]> => {
        const { data, error } = await db
          .from("public_badges")
          .select("id, event_title, org_name, event_date, place")
          .eq("username", username)
          .order("event_date", { ascending: false });
        if (error) throw error;
        return (data ?? []).map((r) => ({
          id: r.id ?? "",
          event: r.event_title ?? "",
          org: r.org_name ?? "",
          date: formatBadgeDate(r.event_date ?? ""),
          place: toPlace(r.place),
          isHidden: false,
          isSample: false,
        }));
      }),

    /**
     * One visible badge, for the link a share points at (`/b/<id>`). Reads the
     * public view, so a hidden badge or a private profile comes back as null
     * and the page says the badge isn't there. Used by routes/b.$id.tsx.
     */
    loadPublicById: (id: string) =>
      guard(async (): Promise<Badge | null> => {
        const { data, error } = await db
          .from("public_badges")
          .select("id, event_title, org_name, event_date, place")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
          id: data.id ?? id,
          event: data.event_title ?? "",
          org: data.org_name ?? "",
          date: formatBadgeDate(data.event_date ?? ""),
          place: toPlace(data.place),
          isHidden: false,
          isSample: false,
        };
      }),

    /** Hide or show one of my badges on my public profile. */
    setHidden: (id: string, hidden: boolean) =>
      guard(async () => {
        const { error } = await db.from("badges").update({ is_hidden: hidden }).eq("id", id);
        if (error) throw error;
      }),
  };
}

export type AchievementsApi = ReturnType<typeof createAchievementsApi>;
