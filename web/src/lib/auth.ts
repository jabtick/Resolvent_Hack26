// Email + password accounts, confirmed with the 6-digit code from the email
// (templates in supabase/templates). The site writes the profile rows itself;
// the column grants in the profiles_feed migration decide what it may write.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

import { AppError, mapError } from "./errors";
import { toIsoDate } from "./validators";

export type AccountStatus = "signedOut" | "awaitingCode" | "needsProfile" | "signedIn";
export type AccountType = "student" | "organizer";
export type OrgType = "school" | "university" | "ngo" | "company" | "public_body";

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  student: "ученик",
  organizer: "организатор",
};

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  school: "Училище",
  university: "Университет",
  ngo: "Неправителствена организация",
  company: "Компания",
  public_body: "Държавна институция",
};

/** What the create-profile form collects. */
export type NewProfile = {
  type: AccountType;
  username: string;
  displayName: string;
  birthDate?: Date | undefined; // students
  orgName?: string | undefined; // organizers
  orgType?: OrgType | undefined; // organizers
};

/** Throws when a field the account type needs is missing. */
export function checkNewProfile(p: NewProfile) {
  if (!p.displayName.trim()) throw new AppError("Въведи име.");
  if (p.type === "student" && !p.birthDate) throw new AppError("Въведи дата на раждане.");
  if (p.type === "organizer" && (!p.orgName?.trim() || !p.orgType)) {
    throw new AppError("Въведи име и вид на организацията.");
  }
}

type Db = SupabaseClient<Database>;

async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw mapError(e);
  }
}

/** Supabase-js returns `{ error }` instead of throwing; make it throw. */
function ok<T extends { error: unknown }>(res: T): T {
  if (res.error) throw res.error;
  return res;
}

export function createAuthApi(db: Db) {
  const norm = (email: string) => email.trim().toLowerCase();

  async function currentUserId(): Promise<string | null> {
    const { data } = await db.auth.getSession();
    return data.session?.user.id ?? null;
  }

  async function requireUid(): Promise<string> {
    const id = await currentUserId();
    if (!id) throw new AppError("Влез отново и опитай пак.");
    return id;
  }

  /** The profile row and whether its details row exists too. */
  async function profileState(): Promise<{ type: AccountType | null; complete: boolean }> {
    const uid = await requireUid();
    const { data } = ok(
      await db
        .from("profiles")
        .select("id, account_type, student_details(profile_id), organizer_details(profile_id)")
        .eq("id", uid)
        .maybeSingle(),
    );
    if (!data) return { type: null, complete: false };
    const type = data.account_type as AccountType;
    const details = type === "student" ? data.student_details : data.organizer_details;
    return { type, complete: details != null };
  }

  async function statusAfterSignIn(): Promise<AccountStatus> {
    return (await profileState()).complete ? "signedIn" : "needsProfile";
  }

  async function dropLocalSession() {
    try {
      await db.auth.signOut({ scope: "local" });
    } catch {
      /* nothing to drop */
    }
  }

  return {
    currentUserId,
    profileState,

    /** Picks up a session kept from the last visit. Never throws. */
    async restore(): Promise<AccountStatus> {
      try {
        if (!(await currentUserId())) return "signedOut";
        return await statusAfterSignIn();
      } catch {
        return "signedOut";
      }
    },

    /** Starts sign-up; a 6-digit code is emailed. */
    signUp: (email: string, password: string) =>
      guard(async () => {
        const { data } = ok(await db.auth.signUp({ email: norm(email), password }));
        // With email confirmation on, an existing address comes back as a
        // user with no identities instead of an error.
        if (data.user && (data.user.identities ?? []).length === 0) {
          throw new AppError("Вече има акаунт с този имейл. Влез.");
        }
      }),

    resendCode: (email: string) =>
      guard(async () => {
        ok(await db.auth.resend({ type: "signup", email: norm(email) }));
      }),

    /** → needsProfile (a brand-new account) or signedIn. */
    confirmCode: (email: string, code: string) =>
      guard(async (): Promise<AccountStatus> => {
        ok(await db.auth.verifyOtp({ type: "signup", email: norm(email), token: code.trim() }));
        try {
          return await statusAfterSignIn();
        } catch {
          // The code worked, so this is a new account: it has no profile yet.
          return "needsProfile";
        }
      }),

    /** → signedIn, needsProfile, or awaitingCode when the email isn't confirmed yet. */
    signIn: (email: string, password: string) =>
      guard(async (): Promise<AccountStatus> => {
        const e = norm(email);
        const { error } = await db.auth.signInWithPassword({ email: e, password });
        if (error) {
          if (error.code !== "email_not_confirmed") throw error;
          // Signed up but never entered the code: send a fresh one.
          await db.auth.resend({ type: "signup", email: e }).catch(() => undefined);
          return "awaitingCode";
        }
        return statusAfterSignIn();
      }),

    createProfile: (p: NewProfile) =>
      guard(async () => {
        checkNewProfile(p);
        const uid = await requireUid();
        const existing = await profileState();
        if (existing.type == null) {
          ok(
            await db.from("profiles").insert({
              id: uid,
              account_type: p.type,
              username: p.username.trim(),
              display_name: p.displayName.trim(),
              terms_accepted_at: new Date().toISOString(),
            }),
          );
        } else {
          // Retry after a failed details insert: the type is fixed (only the
          // server may change it), the names may have been corrected.
          if (existing.type !== p.type) {
            throw new AppError(
              `Акаунтът вече е създаден като ${ACCOUNT_TYPE_LABEL[existing.type]}.`,
            );
          }
          ok(
            await db
              .from("profiles")
              .update({ username: p.username.trim(), display_name: p.displayName.trim() })
              .eq("id", uid),
          );
        }
        if (p.type === "student") {
          ok(
            await db
              .from("student_details")
              .upsert(
                { profile_id: uid, birth_date: toIsoDate(p.birthDate!) },
                { ignoreDuplicates: true },
              ),
          );
        } else {
          ok(
            await db
              .from("organizer_details")
              .upsert(
                { profile_id: uid, org_name: p.orgName!.trim(), org_type: p.orgType! },
                { ignoreDuplicates: true },
              ),
          );
        }
      }),

    sendPasswordReset: (email: string) =>
      guard(async () => {
        ok(await db.auth.resetPasswordForEmail(norm(email)));
      }),

    resetPassword: (email: string, code: string, newPassword: string) =>
      guard(async (): Promise<AccountStatus> => {
        ok(await db.auth.verifyOtp({ type: "recovery", email: norm(email), token: code.trim() }));
        const { error } = await db.auth.updateUser({ password: newPassword });
        if (error) {
          // The code is used up and opened a session; drop it so the site and
          // the server agree, and the person asks for a new code.
          await dropLocalSession();
          throw error;
        }
        return statusAfterSignIn();
      }),

    /** Never throws: the local session is dropped even if the server can't be reached. */
    async signOut(): Promise<void> {
      try {
        const { error } = await db.auth.signOut();
        if (error) await dropLocalSession();
      } catch {
        await dropLocalSession();
      }
    },

    /** Deletes the account and all its data (Edge Function delete-account). */
    deleteAccount: () =>
      guard(async () => {
        const { error } = await db.functions.invoke("delete-account", {
          body: { confirm: "DELETE" },
        });
        if (error) {
          const status = (error as { context?: Response }).context?.status;
          throw Object.assign(error, { status });
        }
        await dropLocalSession();
      }),
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
