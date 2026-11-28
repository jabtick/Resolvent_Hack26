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
  isHidden?: boolean | undefined;
  isSample?: boolean | undefined;
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

type PublicRow = {
  id: string | null;
  event_title: string | null;
  org_name: string | null;
  event_date: string | null;
  place: number | null;
};

/** View columns are all nullable in the generated types; skip a row missing any. */
function fromPublic(r: PublicRow): Badge | null {
  if (!r.id || !r.event_title || !r.org_name || !r.event_date) return null;
  return {
    id: r.id,
    event: r.event_title,
    org: r.org_name,
    date: formatBadgeDate(r.event_date),
    place: toPlace(r.place),
    isHidden: false,
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
        return (data ?? []).flatMap((r) => fromPublic(r) ?? []);
      }),

    /**
     * One badge for its shared link (/b/<id>), with the owner's username. Null when it
     * doesn't exist or isn't public: the view hides badges of private profiles, of
     * under-14s without parental consent, and hidden ones.
     */
    getPublic: (id: string) =>
      guard(async (): Promise<{ badge: Badge; username: string } | null> => {
        if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
        const { data, error } = await db
          .from("public_badges")
          .select("username, id, event_title, org_name, event_date, place")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        const badge = data && fromPublic(data);
        return badge && data.username ? { badge, username: data.username } : null;
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
