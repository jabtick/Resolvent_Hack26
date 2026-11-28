// The feed: published opportunities from Supabase (`opportunities`, owned by
// Gosho and Niki), plus the signed-in person's saved ones. While the table is
// empty the feed shows clearly marked sample items instead.
import type { SupabaseClient } from "@supabase/supabase-js";

import { SAMPLE_OPPS } from "@/data/sampleOpps";
import type { Database } from "@/integrations/supabase/types";

import { AppError, mapError } from "./errors";

type Db = SupabaseClient<Database>;
export type OppType = Database["public"]["Enums"]["opportunity_type"];

export const OPP_TYPE_LABEL: Record<OppType, string> = {
  competition: "Състезание",
  scholarship: "Стипендия",
  internship: "Стаж",
  open_day: "Отворени врати",
  university_program: "Програма",
};

/**
 * Types offered in the UI (feed counts, filters, the organizer form). `open_day` and
 * `university_program` still exist in the database and keep their labels above, so an
 * existing item of that type still shows correctly; they are just not offered.
 */
export const OPP_TYPES: OppType[] = ["competition", "scholarship", "internship"];

export type OppColor = "primary" | "secondary" | "accent";

export type Opp = {
  id: string;
  title: string;
  org: string;
  type: OppType;
  tags: string[];
  city: string | null;
  online: boolean;
  deadlineAt: string | null; // ISO
  startsAt: string | null; // ISO
  endsAt?: string | null; // ISO; optional so sample items don't need it
  /** Who it is for; optional so sample items don't need it (treated as "both"). */
  audience?: Audience;
  description: string;
  externalUrl: string | null;
  color: OppColor;
  isSample: boolean;
};

export type Audience = Database["public"]["Enums"]["audience"];

// ---- "за кого?" filter: two school grade groups + university ----

export type Level = "grades-8-10" | "grades-11-12" | "university";

export const LEVELS: { id: Level; label: string; from?: number; to?: number }[] = [
  { id: "grades-8-10", label: "8.–10. клас", from: 8, to: 10 },
  { id: "grades-11-12", label: "11.–12. клас", from: 11, to: 12 },
  { id: "university", label: "Студенти" },
];

/** "8.–10. клас", "8–10 клас", "11.–12. клас" → [from, to]; any other tag → null. */
export function gradeRangeOf(tag: string): [number, number] | null {
  const m = /^(\d{1,2})\.?\s*[–-]\s*(\d{1,2})\.?\s*клас$/.exec(tag.trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** Tags that say who an item is for (grade groups, "За студенти"); shown under "за кого?", not as themes. */
export function isLevelTag(tag: string): boolean {
  return gradeRangeOf(tag) != null || /^(за )?студенти$/i.test(tag.trim());
}

/**
 * True if the item fits at least one picked level (or none is picked).
 * University: audience "university" or "both".
 * A grade group: the item has a grade tag overlapping it, or it is for school and names no
 * grades at all (most olympiads don't list grades, they shouldn't disappear).
 */
export function matchesLevels(o: Pick<Opp, "tags" | "audience">, levels: Level[]): boolean {
  if (!levels.length) return true;
  const audience = o.audience ?? "both";
  const ranges = o.tags.map(gradeRangeOf).filter((r): r is [number, number] => r != null);
  return levels.some((id) => {
    if (id === "university") return audience !== "school";
    if (audience === "university") return false;
    const lv = LEVELS.find((l) => l.id === id)!;
    if (!ranges.length) return true;
    return ranges.some(([a, b]) => a <= lv.to! && b >= lv.from!);
  });
}

/** One recommended item: how well it fits this student, and why (short Bulgarian phrases). */
export type Recommendation = { opp: Opp; rating: number; why: string[] };

/** The four parts of the rating, each 0..1, as the database returns them. */
export type RatingParts = { interest: number; history: number; location: number; urgency: number };

/** Turns the rating parts into at most two reasons a person can read. */
export function whyText(p: RatingParts): string[] {
  const out: string[] = [];
  if (p.interest >= 0.5) out.push("съвпада с интересите ти");
  if (p.history >= 0.3) out.push("прилича на обява, която запази");
  if (p.urgency >= 0.6) out.push("срокът наближава");
  if (p.location >= 1) out.push("в твоя град или онлайн");
  return out.slice(0, 2);
}

/** One line of the organizer dashboard. */
export type OppStat = {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  saves: number;
};

export type NewOpp = {
  title: string;
  type: OppType;
  city: string | null;
  online: boolean;
  startsAt: string | null;
  deadlineAt: string | null;
  description: string;
  externalUrl: string | null;
  publish: boolean;
  /** Tag ids from `tags`. Left out = tags are not touched. */
  tagIds?: number[] | undefined;
};

/** One of the organizer's own items, as the edit form needs it. */
export type EditableOpp = NewOpp & { id: string; status: OppStat["status"]; tagIds: number[] };

export type Tag = { id: number; name: string };

const NOT_VERIFIED = "Публикуването е само за проверени организатори. Запази като чернова.";
const NOT_YOURS = "Обявата я няма или не е твоя.";

/** The columns an organizer may write (the rest are filled by the database). */
function toColumns(p: NewOpp) {
  return {
    title: p.title.trim(),
    type: p.type,
    city: p.city,
    is_online: p.online,
    starts_at: p.startsAt,
    deadline_at: p.deadlineAt,
    description: p.description,
    external_url: p.externalUrl,
    status: p.publish ? ("published" as const) : ("draft" as const),
  };
}

function writeError(p: NewOpp, error: { code?: string }): unknown {
  return p.publish && error.code === "42501" ? new AppError(NOT_VERIFIED) : error;
}

const UUID = /^[0-9a-f-]{36}$/i;

const COLORS: OppColor[] = ["primary", "secondary", "accent"];

/** Same item, same colour, every time. */
export function colorFor(id: string): OppColor {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

const MONTHS = ["яну", "фев", "мар", "апр", "май", "юни", "юли", "авг", "сеп", "окт", "ное", "дек"];

/** "до 20 дек", "изтекъл", or "без срок". */
export function formatDeadline(iso: string | null, now = new Date()): string {
  if (!iso) return "без срок";
  const d = new Date(iso);
  if (d < now) return "изтекъл";
  return `до ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * True while the event is happening: from `starts_at` until `ends_at`
 * (or the end of the start day when there is no end).
 */
export function isOngoing(o: Pick<Opp, "startsAt" | "endsAt">, now = new Date()): boolean {
  if (!o.startsAt) return false;
  const start = new Date(o.startsAt);
  let end: Date;
  if (o.endsAt) {
    end = new Date(o.endsAt);
  } else {
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  }
  return start <= now && now <= end;
}

/**
 * The label on a card: "тече сега" while the event runs (even if registration
 * already closed), otherwise the deadline ("до 20 дек", "изтекъл", "без срок").
 */
export function formatStatus(
  o: Pick<Opp, "deadlineAt" | "startsAt" | "endsAt">,
  now = new Date(),
): string {
  if (isOngoing(o, now)) return "тече сега";
  return formatDeadline(o.deadlineAt, now);
}

/**
 * The days an event happens, for the calendar: start through end (or just the start day).
 * Falls back to the deadline day for items with no start (e.g. most scholarships).
 */
export function periodOf(
  o: Pick<Opp, "startsAt" | "endsAt" | "deadlineAt">,
): { from: Date; to: Date } | null {
  if (o.startsAt) {
    const from = new Date(o.startsAt);
    const to = o.endsAt ? new Date(o.endsAt) : from;
    return { from, to: to < from ? from : to };
  }
  if (o.deadlineAt) {
    const d = new Date(o.deadlineAt);
    return { from: d, to: d };
  }
  return null;
}

/** Every calendar day from `from` to `to` (local midnights), both included. */
export function daysOf(p: { from: Date; to: Date }): Date[] {
  const out: Date[] = [];
  const d = new Date(p.from.getFullYear(), p.from.getMonth(), p.from.getDate());
  const last = new Date(p.to.getFullYear(), p.to.getMonth(), p.to.getDate());
  for (; d <= last && out.length < 366; d.setDate(d.getDate() + 1)) out.push(new Date(d));
  return out;
}

/**
 * Calendar marks: every day an event runs (start to end), or its deadline day if it has no
 * start. A deadline before the start is not marked.
 */
export function markDates(opps: Pick<Opp, "startsAt" | "endsAt" | "deadlineAt">[]): Date[] {
  return opps.flatMap((o) => {
    const p = periodOf(o);
    return p ? daysOf(p) : [];
  });
}

/**
 * Font size for a card title, in `cqw` (percent of the card's width), so the whole title fits
 * the card's fixed 4:3 box at every screen width. The card itself never changes size.
 *
 * It simulates word wrapping in the display font (about 0.8em per letter) and picks the
 * largest size where the lines fit, without breaking words in the middle. The text area is
 * taken as 84% of the card width and 40% of it in height (what is left on a phone after the
 * padding, the tag line and the deadline line).
 */
export function titleFontSize(title: string): string {
  const W = 84; // usable width, % of card width
  const H = 40; // usable height, % of card width
  const CHAR = 0.8; // average letter width in em (Rubik Glitch)
  const SPACE = 0.3;
  const MAX = 11; // cqw; the old size on a phone
  const MIN = 3;
  const words = title.split(/\s+/).filter(Boolean);
  const longest = Math.max(0, ...words.map((w) => w.length * CHAR));

  const lines = (maxEm: number): number => {
    let n = 0;
    let cur = 0;
    for (const w of words) {
      const len = w.length * CHAR;
      if (cur === 0) cur = len;
      else if (cur + SPACE + len <= maxEm) cur += SPACE + len;
      else {
        n++;
        cur = len;
      }
    }
    return cur > 0 ? n + 1 : n;
  };

  let size = MIN;
  for (let f = MAX; f >= MIN; f -= 0.25) {
    const maxEm = W / f;
    if (longest <= maxEm && lines(maxEm) * f <= H) {
      size = f;
      break;
    }
  }
  // never bigger than the original desktop size (text-5xl = 3rem)
  return `min(${size}cqw, 3rem)`;
}

/** ISO → the value a datetime-local input wants, in local time ("2026-12-10T11:00"). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function placeOf(o: Pick<Opp, "city" | "online">): string {
  if (o.online && o.city) return `${o.city} · онлайн`;
  if (o.online) return "Онлайн";
  return o.city ?? "—";
}

/** Org name for a scraped item: the site it came from. */
export function hostOf(url: string | null): string {
  if (!url) return "Изскрейпено";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Изскрейпено";
  }
}

async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw mapError(e);
  }
}

const SELECT =
  "id, title, type, city, is_online, audience, deadline_at, starts_at, ends_at, description, external_url, source_url, organizer_id, opportunity_tags(tags(name))";

type Row = {
  id: string;
  title: string;
  type: OppType;
  city: string | null;
  is_online: boolean;
  audience?: Audience;
  deadline_at: string | null;
  starts_at: string | null;
  ends_at?: string | null;
  description: string | null;
  external_url: string | null;
  source_url: string | null;
  organizer_id: string | null;
  opportunity_tags: { tags: { name: string } | null }[] | null;
};

export function createOppsApi(db: Db) {
  async function orgNames(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) return new Map();
    const { data, error } = await db
      .from("organizer_details")
      .select("profile_id, org_name")
      .in("profile_id", ids);
    if (error) throw error;
    return new Map((data ?? []).map((o) => [o.profile_id, o.org_name]));
  }

  async function toOpps(rows: Row[]): Promise<Opp[]> {
    const ids = [...new Set(rows.map((r) => r.organizer_id).filter((x): x is string => !!x))];
    const names = await orgNames(ids);
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      org: r.organizer_id ? (names.get(r.organizer_id) ?? "Организатор") : hostOf(r.source_url),
      type: r.type,
      tags: (r.opportunity_tags ?? []).map((t) => t.tags?.name).filter((x): x is string => !!x),
      city: r.city,
      online: r.is_online,
      audience: r.audience ?? "both",
      deadlineAt: r.deadline_at,
      startsAt: r.starts_at,
      endsAt: r.ends_at ?? null,
      description: r.description ?? "",
      externalUrl: r.external_url ?? r.source_url,
      color: colorFor(r.id),
      isSample: false,
    }));
  }

  /** Replace an item's tags with exactly these. */
  async function setTags(id: string, tagIds: number[]) {
    const del = await db.from("opportunity_tags").delete().eq("opportunity_id", id);
    if (del.error) throw del.error;
    const unique = [...new Set(tagIds)];
    if (!unique.length) return;
    const ins = await db
      .from("opportunity_tags")
      .insert(unique.map((tag_id) => ({ opportunity_id: id, tag_id })));
    if (ins.error) throw ins.error;
  }

  async function uid(): Promise<string | null> {
    const { data } = await db.auth.getSession();
    return data.session?.user.id ?? null;
  }

  return {
    /** Published items, soonest deadline first. Samples while the table is empty. */
    listFeed: () =>
      guard(async (): Promise<Opp[]> => {
        const { data, error } = await db
          .from("opportunities")
          .select(SELECT)
          .eq("status", "published")
          .order("deadline_at", { ascending: true, nullsFirst: false })
          .limit(200);
        if (error) throw error;
        const opps = await toOpps((data ?? []) as unknown as Row[]);
        return opps.length ? opps : SAMPLE_OPPS;
      }),

    /** One item (a sample id works too). Null when it doesn't exist. */
    get: (id: string) =>
      guard(async (): Promise<Opp | null> => {
        const sample = SAMPLE_OPPS.find((o) => o.id === id);
        if (sample) return sample;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
        const { data, error } = await db
          .from("opportunities")
          .select(SELECT)
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return (await toOpps([data as unknown as Row]))[0]!;
      }),

    /** An organizer's published items, soonest deadline first. */
    listByOrganizer: (profileId: string) =>
      guard(async (): Promise<Opp[]> => {
        const { data, error } = await db
          .from("opportunities")
          .select(SELECT)
          .eq("organizer_id", profileId)
          .eq("status", "published")
          .order("deadline_at", { ascending: true, nullsFirst: false })
          .limit(100);
        if (error) throw error;
        return toOpps((data ?? []) as unknown as Row[]);
      }),

    /** Dashboard numbers for the signed-in organizer: saves per own item. */
    myStats: () =>
      guard(async (): Promise<OppStat[]> => {
        const { data, error } = await db.rpc("my_opportunity_stats");
        if (error) throw error;
        return (data ?? []).map((r) => ({
          id: r.opportunity_id,
          title: r.title,
          status: r.status,
          saves: Number(r.saves),
        }));
      }),

    /**
     * "For you": the database rates every eligible item for the signed-in student
     * (`recommended_feed`, Niki's algorithm) and we load the best ones. Empty for
     * organizers, signed-out visitors and students with nothing that fits.
     */
    recommended: () =>
      guard(async (): Promise<Recommendation[]> => {
        const { data: rated, error } = await db.rpc("recommended_feed", {
          p_min_rating: 0.5,
          p_limit: 30,
        });
        if (error) throw error;
        if (!rated?.length) return [];
        const { data, error: e2 } = await db
          .from("opportunities")
          .select(SELECT)
          .in(
            "id",
            rated.map((r) => r.opportunity_id),
          );
        if (e2) throw e2;
        const byId = new Map(
          (await toOpps((data ?? []) as unknown as Row[])).map((o) => [o.id, o]),
        );
        // Keep the database's order (best first); drop anything that vanished in between.
        return rated.flatMap((r) => {
          const opp = byId.get(r.opportunity_id);
          return opp ? [{ opp, rating: Number(r.rating), why: whyText(r) }] : [];
        });
      }),

    /** Ids the signed-in person saved (empty when signed out). */
    savedIds: () =>
      guard(async (): Promise<Set<string>> => {
        const me = await uid();
        if (!me) return new Set();
        const { data, error } = await db
          .from("saved_opportunities")
          .select("opportunity_id")
          .eq("profile_id", me);
        if (error) throw error;
        return new Set((data ?? []).map((r) => r.opportunity_id));
      }),

    /**
     * An organizer's new item. `organizer_id` and `source` are filled by the
     * database (clients may not set them); publishing needs a verified org.
     */
    create: (p: NewOpp) =>
      guard(async (): Promise<string> => {
        const { data, error } = await db
          .from("opportunities")
          .insert(toColumns(p))
          .select("id")
          .single();
        if (error) throw writeError(p, error);
        if (p.tagIds?.length) await setTags(data.id, p.tagIds);
        return data.id;
      }),

    /** Every tag, A to Z, for the organizer form. */
    listTags: () =>
      guard(async (): Promise<Tag[]> => {
        const { data, error } = await db.from("tags").select("id, name").order("name");
        if (error) throw error;
        return data ?? [];
      }),

    /** One of my own items (any status) for the edit form. Null when not mine. */
    getForEdit: (id: string) =>
      guard(async (): Promise<EditableOpp | null> => {
        const me = await uid();
        if (!me || !UUID.test(id)) return null;
        const { data, error } = await db
          .from("opportunities")
          .select(
            "id, title, type, city, is_online, starts_at, deadline_at, description, external_url, status, opportunity_tags(tag_id)",
          )
          .eq("id", id)
          .eq("organizer_id", me)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
          id: data.id,
          title: data.title,
          type: data.type,
          city: data.city,
          online: data.is_online,
          startsAt: data.starts_at,
          deadlineAt: data.deadline_at,
          description: data.description ?? "",
          externalUrl: data.external_url,
          publish: data.status === "published",
          status: data.status,
          tagIds: (data.opportunity_tags ?? []).map((t) => t.tag_id),
        };
      }),

    /** Change one of my items. Database rules stop changes to anyone else's. */
    update: (id: string, p: NewOpp) =>
      guard(async () => {
        const me = await uid();
        if (!me) throw new AppError("Влез, за да промениш обявата.");
        const { data, error } = await db
          .from("opportunities")
          .update(toColumns(p))
          .eq("id", id)
          .eq("organizer_id", me)
          .select("id");
        if (error) throw writeError(p, error);
        if (!data?.length) throw new AppError(NOT_YOURS);
        if (p.tagIds) await setTags(id, p.tagIds);
      }),

    /** Delete one of my items (its tags and saves go with it). */
    remove: (id: string) =>
      guard(async () => {
        const me = await uid();
        if (!me) throw new AppError("Влез, за да изтриеш обявата.");
        const { data, error } = await db
          .from("opportunities")
          .delete()
          .eq("id", id)
          .eq("organizer_id", me)
          .select("id");
        if (error) throw error;
        if (!data?.length) throw new AppError(NOT_YOURS);
      }),

    setSaved: (opp: Pick<Opp, "id" | "isSample">, saved: boolean) =>
      guard(async () => {
        const me = await uid();
        if (!me) throw new AppError("Влез, за да запазваш обяви.");
        if (opp.isSample) throw new AppError("Това е примерна обява — не може да се запази.");
        const q = saved
          ? db.from("saved_opportunities").insert({ profile_id: me, opportunity_id: opp.id })
          : db
              .from("saved_opportunities")
              .delete()
              .eq("profile_id", me)
              .eq("opportunity_id", opp.id);
        const { error } = await q;
        if (error) throw error;
      }),
  };
}

export type OppsApi = ReturnType<typeof createOppsApi>;
