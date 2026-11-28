// Profiles: reads and writes only what the profiles_feed migration grants:
// profiles (display_name), student_details (city, school, grade, bio,
// is_public), organizer_details (org_name, website), and the public_profiles view.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import type { AccountType, OrgType } from "./auth";
import { AppError, mapError } from "./errors";
import { validateUsername } from "./validators";

type Db = SupabaseClient<Database>;

export type StudentInfo = {
  birthDate: Date;
  city: string | null;
  school: string | null;
  grade: number | null;
  bio: string | null;
  isPublic: boolean;
  consentGranted: boolean;
};

export type OrganizerInfo = {
  orgName: string;
  orgType: OrgType;
  website: string | null;
  verificationStatus: "pending" | "verified" | "rejected";
};

export type MyProfile = {
  type: AccountType;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  student: StudentInfo | null;
  organizer: OrganizerInfo | null;
};

export type PublicProfile = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  school: string | null;
  interests: string[];
};

export type PublicOrganizer = {
  profileId: string;
  username: string;
  displayName: string;
  orgName: string;
  orgType: OrgType;
  website: string | null;
  verified: boolean;
};

/** Only the fields that change; `grade: null` clears the grade. */
export type ProfilePatch = {
  displayName?: string;
  city?: string;
  school?: string;
  grade?: number | null;
  bio?: string;
  isPublic?: boolean;
  orgName?: string;
  website?: string;
};

/** "Петя Иванова" → "ПИ"; empty → "?". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((w) => Array.from(w)[0]!.toUpperCase())
    .join("");
}

// ---- Profile pictures (Storage bucket "avatars", one folder per user) ----

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // same limit as the bucket
const AVATAR_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
export const AVATAR_ACCEPT = Object.keys(AVATAR_EXT).join(",");

/** Null when the file can be used as a profile picture, otherwise the reason. */
export function validateAvatar(f: { type: string; size: number }): string | null {
  if (!AVATAR_EXT[f.type]) return "Снимката трябва да е JPG, PNG, WebP или GIF.";
  if (f.size > AVATAR_MAX_BYTES) return "Снимката е над 2 MB. Избери по-малка.";
  return null;
}

/** profiles.avatar_url holds a Storage path; the site needs a URL. Full URLs pass through. */
function avatarSrc(db: Db, path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return db.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Storage errors are not PostgREST errors; a missing bucket means the migration isn't applied. */
function storageError(e: { message?: string }): AppError {
  if (/bucket not found/i.test(e.message ?? "")) {
    return new AppError("Качването на снимки още не е включено.");
  }
  if (/exceeded the maximum|too large|payload/i.test(e.message ?? "")) {
    return new AppError("Снимката е над 2 MB. Избери по-малка.");
  }
  return new AppError("Снимката не се качи. Опитай пак.");
}

/** The shareable link: `https://<site>/u/<username>`. */
export function publicProfileUrl(username: string, origin: string): string {
  return `${origin.replace(/\/+$/, "")}/u/${username}`;
}

async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw mapError(e);
  }
}

export function createProfilesApi(db: Db) {
  async function uid() {
    const { data } = await db.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new AppError("Влез, за да видиш профила си.");
    return id;
  }

  /** The stored Storage path of my picture (null for none or an external URL). */
  async function currentAvatarPath(id: string): Promise<string | null> {
    const { data } = await db.from("profiles").select("avatar_url").eq("id", id).maybeSingle();
    const p = (data as { avatar_url: string | null } | null)?.avatar_url ?? null;
    return p && !/^https?:\/\//.test(p) ? p : null;
  }

  return {
    loadMine: () =>
      guard(async (): Promise<MyProfile> => {
        const { data: r, error } = await db
          .from("profiles")
          // Only what the site shows (no guardian e-mail or consent token).
          .select(
            "account_type, username, display_name, avatar_url, " +
              "student_details(birth_date, city, school, grade, bio, is_public, consent_granted_at), " +
              "organizer_details(org_name, org_type, website, verification_status)",
          )
          .eq("id", await uid())
          .single();
        if (error) throw error;
        const row = r as unknown as {
          account_type: AccountType;
          username: string;
          display_name: string;
          avatar_url: string | null;
          student_details: {
            birth_date: string;
            city: string | null;
            school: string | null;
            grade: number | null;
            bio: string | null;
            is_public: boolean;
            consent_granted_at: string | null;
          } | null;
          organizer_details: {
            org_name: string;
            org_type: OrgType;
            website: string | null;
            verification_status: OrganizerInfo["verificationStatus"];
          } | null;
        };
        const s = row.student_details;
        const o = row.organizer_details;
        return {
          type: row.account_type,
          username: row.username,
          displayName: row.display_name,
          avatarUrl: avatarSrc(db, row.avatar_url),
          student: s && {
            birthDate: new Date(`${s.birth_date}T00:00:00`),
            city: s.city,
            school: s.school,
            grade: s.grade,
            bio: s.bio,
            isPublic: s.is_public,
            consentGranted: s.consent_granted_at != null,
          },
          organizer: o && {
            orgName: o.org_name,
            orgType: o.org_type,
            website: o.website,
            verificationStatus: o.verification_status,
          },
        };
      }),

    updateMine: (p: ProfilePatch) =>
      guard(async () => {
        const id = await uid();
        if (p.displayName !== undefined) {
          const { error } = await db
            .from("profiles")
            .update({ display_name: p.displayName })
            .eq("id", id);
          if (error) throw error;
        }
        const student: Database["public"]["Tables"]["student_details"]["Update"] = {};
        if (p.city !== undefined) student.city = p.city;
        if (p.school !== undefined) student.school = p.school;
        if (p.grade !== undefined) student.grade = p.grade;
        if (p.bio !== undefined) student.bio = p.bio;
        if (p.isPublic !== undefined) student.is_public = p.isPublic;
        if (Object.keys(student).length) {
          const { error } = await db.from("student_details").update(student).eq("profile_id", id);
          if (error) throw error;
        }
        const org: Database["public"]["Tables"]["organizer_details"]["Update"] = {};
        if (p.orgName !== undefined) org.org_name = p.orgName;
        if (p.website !== undefined) org.website = p.website;
        if (Object.keys(org).length) {
          const { error } = await db.from("organizer_details").update(org).eq("profile_id", id);
          if (error) throw error;
        }
      }),

    /**
     * New profile picture: uploads to "avatars/<uid>/<time>.<ext>", points
     * profiles.avatar_url at it, then deletes the previous file (best effort).
     */
    uploadAvatar: (file: File) =>
      guard(async () => {
        const problem = validateAvatar(file);
        if (problem) throw new AppError(problem);
        const id = await uid();
        const old = await currentAvatarPath(id);
        const path = `${id}/${Date.now()}.${AVATAR_EXT[file.type]}`;
        const bucket = db.storage.from(AVATAR_BUCKET);
        const up = await bucket.upload(path, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });
        if (up.error) throw storageError(up.error);
        const { error } = await db.from("profiles").update({ avatar_url: path }).eq("id", id);
        if (error) {
          await bucket.remove([path]);
          throw error;
        }
        if (old && old !== path) await bucket.remove([old]);
      }),

    /** Back to initials: clears profiles.avatar_url and deletes the file. */
    removeAvatar: () =>
      guard(async () => {
        const id = await uid();
        const old = await currentAvatarPath(id);
        const { error } = await db.from("profiles").update({ avatar_url: null }).eq("id", id);
        if (error) throw error;
        if (old) await db.storage.from(AVATAR_BUCKET).remove([old]);
      }),

    /** Anyone's public profile, or null if it doesn't exist or is hidden. */
    loadPublic: (username: string) =>
      guard(async (): Promise<PublicProfile | null> => {
        // A name no account can have is not looked up; this also keeps `*`
        // and `%` from acting as wildcards.
        if (validateUsername(username) != null) return null;
        const pattern = username.replace(/[\\%_]/g, (c) => `\\${c}`);
        const { data, error } = await db
          .from("public_profiles")
          .select("*")
          .ilike("username", pattern)
          .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        return {
          username: data.username ?? username,
          displayName: data.display_name ?? username,
          avatarUrl: avatarSrc(db, data.avatar_url),
          bio: data.bio,
          school: data.school,
          interests: (data.interests as string[] | null) ?? [],
        };
      }),

    /** An organizer's public page, or null. Same name rules as `loadPublic`. */
    loadPublicOrganizer: (username: string) =>
      guard(async (): Promise<PublicOrganizer | null> => {
        if (validateUsername(username) != null) return null;
        const pattern = username.replace(/[\\%_]/g, (c) => `\\${c}`);
        const { data, error } = await db
          .from("public_organizers")
          .select("*")
          .ilike("username", pattern)
          .maybeSingle();
        if (error) throw error;
        if (!data?.profile_id || !data.username) return null;
        return {
          profileId: data.profile_id,
          username: data.username,
          displayName: data.display_name ?? data.username,
          orgName: data.org_name ?? data.display_name ?? data.username,
          orgType: data.org_type as OrgType,
          website: data.website,
          verified: data.verification_status === "verified",
        };
      }),
  };
}

export type ProfilesApi = ReturnType<typeof createProfilesApi>;
