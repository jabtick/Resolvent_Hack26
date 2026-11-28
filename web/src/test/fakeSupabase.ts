// A fake Supabase server for testing the data layer without a network.
// Default answers cover the happy path; a test overrides any endpoint with
// `server.on("METHOD /path", handler)`.
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export const fakeUid = "11111111-1111-1111-1111-111111111111";

const b64 = (o: object) =>
  btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

/** A syntactically valid (unsigned) access token. */
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: fakeUid, role: "authenticated", exp: 4102444800 })}.sig`;

export const fakeUser = {
  id: fakeUid,
  aud: "authenticated",
  email: "petya@example.com",
  app_metadata: {},
  user_metadata: {},
  identities: [{ id: "i1", user_id: fakeUid, provider: "email", identity_data: {} }],
  created_at: "2026-11-27T00:00:00Z",
};

export const fakeSession = {
  access_token: jwt,
  token_type: "bearer",
  expires_in: 3600,
  expires_at: 4102444800,
  refresh_token: "refresh",
  user: fakeUser,
};

export const json = (body: unknown, status = 200) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/** GoTrue error body. */
export const authError = (code: string, status = 400) =>
  json({ code, error_code: code, msg: code }, status);

/** PostgREST error body. */
export const pgError = (code: string, status = 400) =>
  json({ code, message: code, details: null, hint: null }, status);

export type Seen = { method: string; url: URL; body: unknown };
type Handler = (req: Seen) => Response | Promise<Response>;

export class FakeServer {
  /** What `profiles` returns for the user (null = no row). */
  profileRow: Record<string, unknown> | null = null;
  publicProfiles: Record<string, unknown>[] = [];
  opportunities: Record<string, unknown>[] = [];
  organizers: Record<string, unknown>[] = [];
  saved: Record<string, unknown>[] = [];
  readonly requests: Seen[] = [];
  private overrides = new Map<string, Handler>();

  on(route: string, h: Handler) {
    this.overrides.set(route, h);
  }

  fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    const text = await req.text();
    let body: unknown = text;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      /* not JSON */
    }
    const seen: Seen = { method: req.method, url, body };
    this.requests.push(seen);
    const override = this.overrides.get(`${req.method} ${url.pathname}`);
    if (override) return override(seen);

    const wantsObject = (req.headers.get("accept") ?? "").includes("vnd.pgrst.object+json");
    const rows = (r: Record<string, unknown>[]) =>
      wantsObject ? (r[0] ? json(r[0]) : pgError("PGRST116", 406)) : json(r);

    switch (`${req.method} ${url.pathname}`) {
      case "POST /auth/v1/token":
      case "POST /auth/v1/verify":
        return json(fakeSession);
      case "POST /auth/v1/signup":
        return json(fakeUser);
      case "PUT /auth/v1/user":
      case "GET /auth/v1/user":
        return json(fakeUser);
      case "POST /auth/v1/resend":
      case "POST /auth/v1/recover":
      case "POST /auth/v1/logout":
        return json({});
      case "GET /rest/v1/profiles":
        return rows(this.profileRow ? [this.profileRow] : []);
      case "GET /rest/v1/public_profiles":
        return rows(this.publicProfiles);
      case "GET /rest/v1/opportunities":
        return rows(this.opportunities);
      case "GET /rest/v1/organizer_details":
        return rows(this.organizers);
      case "GET /rest/v1/saved_opportunities":
        return rows(this.saved);
      case "POST /functions/v1/delete-account":
        return json({ deleted: true });
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      return new Response(null, { status: req.method === "POST" ? 201 : 204 });
    }
    return json({ message: `not found: ${url.pathname}` }, 404);
  };

  writesTo(table: string) {
    return this.requests.filter(
      (r) => r.url.pathname === `/rest/v1/${table}` && r.method !== "GET",
    );
  }

  readsOf(table: string) {
    return this.requests.filter(
      (r) => r.url.pathname === `/rest/v1/${table}` && r.method === "GET",
    );
  }
}

export function fakeClient(server: FakeServer) {
  const mem = new Map<string, string>();
  return createClient<Database>("https://test.supabase.co", "sb_publishable_test", {
    global: { fetch: server.fetch },
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => void mem.set(k, v),
        removeItem: (k) => void mem.delete(k),
      },
    },
  });
}
