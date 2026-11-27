// Supabase clients and auth helpers for Edge Functions.
//
// Two clients, never mix them up:
// - userClient(req): acts AS the caller. RLS applies. Use this by default.
// - adminClient(): bypasses RLS (service role). Use only for actions the
//   caller is not allowed to do directly, AFTER checking they are allowed.

import {
  createClient,
  type SupabaseClient,
  type User,
} from "npm:@supabase/supabase-js@2";
import { HttpError } from "./http.ts";

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_ANON_KEY = env("SUPABASE_ANON_KEY");

export function userClient(req: Request): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

let admin: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  admin ??= createClient(SUPABASE_URL, env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return admin;
}

/** Returns the signed-in user, or throws 401. */
export async function requireUser(req: Request): Promise<User> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new HttpError(401, "unauthorized", "Sign in required.");
  }
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) {
    throw new HttpError(401, "unauthorized", "Sign in required.");
  }
  return data.user;
}

/** Best-effort client IP, for rate limiting anonymous endpoints. */
export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown"
  );
}

/**
 * Fixed-window rate limit backed by public.check_rate_limit (service role only).
 * Throws 429 when the caller is over the limit.
 * Example: await rateLimit(`delete-account:${user.id}`, 3, 3600);
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const { data, error } = await adminClient().rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  if (data !== true) {
    throw new HttpError(429, "rate_limited", "Too many requests. Try again later.");
  }
}
