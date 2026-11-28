import type { AccountStatus } from "./auth";

/** Pages that send a signed-in person on to their profile. */
const AUTH_ONLY = new Set(["/login", "/join", "/code", "/create-profile", "/forgot"]);

/** Pages that need an account with a profile. */
const PRIVATE = new Set(["/profile", "/settings", "/saved"]);

/** Where to send someone, given their account state. Null = stay. */
export function authRedirect(status: AccountStatus, path: string): string | null {
  const p = path.length > 1 ? path.replace(/\/+$/, "") : path;
  switch (status) {
    case "signedOut":
      if (PRIVATE.has(p)) return "/login";
      if (p === "/code") return "/join";
      if (p === "/create-profile") return "/login";
      return null;
    case "awaitingCode":
      return p === "/code" || p === "/join" ? null : "/code";
    case "needsProfile":
      return p === "/create-profile" ? null : "/create-profile";
    case "signedIn":
      return AUTH_ONLY.has(p) ? "/profile" : null;
  }
}
