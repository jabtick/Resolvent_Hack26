// Sharing a badge to other apps, the way Strava does it:
//
//  1. The phone's own share sheet first (`navigator.share`). It already lists
//     Instagram, Facebook, Messenger, Viber, WhatsApp — we don't reimplement
//     any of them, and the person picks.
//  2. With a picture when the browser allows files. Instagram and the Stories
//     of the other apps take pictures, never links, so a link-only share is
//     useless there. The picture is drawn in lib/badge-image.ts.
//  3. Plain per-network links as the desktop fallback, where there is no share
//     sheet. Instagram has no such link (it accepts no prefilled content from
//     the web), so there the picture is offered as a download instead.
//
// Nothing here touches the DOM, so it is all testable; the browser bits are
// passed in.
import type { Badge } from "./achievements";
import { PLACE_LABEL } from "./achievements";

export const BRAND = "NO FUTURE?";

/** The public page a shared link points at: `https://<site>/b/<id>`. */
export function badgePublicUrl(badgeId: string, origin: string): string {
  return `${origin.replace(/\/+$/, "")}/b/${badgeId}`;
}

/** "1-ВО МЯСТО" or "УЧАСТНИК" — the same wording as the badge card. */
export function placeText(place: Badge["place"]): string {
  return place ? PLACE_LABEL[place] : "УЧАСТНИК";
}

/** One line for a window title or an `og:title`. */
export function badgeShareTitle(b: Badge): string {
  return `${placeText(b.place)} — ${b.event}`;
}

/**
 * The caption that goes with the share. Kept short: Instagram and X cut long
 * text, and the person can always edit it before posting.
 */
export function badgeShareText(b: Badge): string {
  const opening = b.place ? `${PLACE_LABEL[b.place]} на ${b.event}!` : `Участвах в ${b.event}.`;
  return `${opening}\n${b.org} · ${b.date}\nПотвърдено от организатора. #NoFuture`;
}

export type ShareNetwork = "facebook" | "x" | "linkedin" | "whatsapp" | "viber" | "telegram";

/** Label for the button, and whether the network needs a picture, not a link. */
export const NETWORKS: Record<ShareNetwork, { label: string }> = {
  facebook: { label: "Facebook" },
  x: { label: "X" },
  linkedin: { label: "LinkedIn" },
  whatsapp: { label: "WhatsApp" },
  viber: { label: "Viber" },
  telegram: { label: "Telegram" },
};

/**
 * The network's own share page, prefilled. These are the public endpoints the
 * networks document for a share button; none of them needs an API key.
 *
 * Facebook and LinkedIn read the title and picture from the Open Graph tags on
 * the shared page (see routes/b.$id.tsx), so passing text to them is pointless
 * — they ignore it.
 */
export function networkShareUrl(n: ShareNetwork, url: string, text: string): string {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (n) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encodeURIComponent(`${text}\n${url}`)}`;
    case "viber":
      return `viber://forward?text=${encodeURIComponent(`${text}\n${url}`)}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
  }
}

/** What the screen should say after a share attempt. */
export type ShareOutcome = "shared" | "copied" | "cancelled" | "unsupported" | "failed";

/** The slice of `navigator` we use; injected so tests need no browser. */
export type ShareNav = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  clipboard?: { writeText: (s: string) => Promise<void> };
};

function nav(n?: ShareNav): ShareNav {
  return n ?? (globalThis.navigator as ShareNav | undefined) ?? {};
}

/** True when this browser can put a picture into the share sheet. */
export function canShareFile(file: File, n?: ShareNav): boolean {
  const v = nav(n);
  if (!v.share || !v.canShare) return false;
  try {
    return v.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** True when there is a share sheet at all (links, no picture). */
export function canShareLink(n?: ShareNav): boolean {
  return typeof nav(n).share === "function";
}

/** The person closed the sheet: not an error, so the screen stays quiet. */
function isAbort(e: unknown): boolean {
  return (e as { name?: string } | null)?.name === "AbortError";
}

/**
 * Opens the share sheet with the picture when possible, falls back to a link
 * share, and to copying the link when there is no sheet at all. The caller
 * turns the outcome into a message.
 */
export async function shareBadge(
  args: { title: string; text: string; url: string; file?: File | undefined },
  n?: ShareNav,
): Promise<ShareOutcome> {
  const v = nav(n);
  const { title, text, url, file } = args;

  if (file && v.share && canShareFile(file, v)) {
    try {
      // The url is left out on purpose: sharing files and a url together is
      // rejected by some targets, and the caption already carries the link.
      await v.share({ files: [file], title, text: `${text}\n${url}` });
      return "shared";
    } catch (e) {
      if (isAbort(e)) return "cancelled";
      // Fall through: try again without the picture.
    }
  }

  if (v.share) {
    try {
      await v.share({ title, text, url });
      return "shared";
    } catch (e) {
      if (isAbort(e)) return "cancelled";
    }
  }

  if (v.clipboard) {
    try {
      await v.clipboard.writeText(`${text}\n${url}`);
      return "copied";
    } catch {
      return "failed";
    }
  }
  return "unsupported";
}

/** Copies just the link. */
export async function copyLink(url: string, n?: ShareNav): Promise<boolean> {
  const c = nav(n).clipboard;
  if (!c) return false;
  try {
    await c.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/** A short, safe file name for the downloaded picture. */
export function imageFileName(b: Badge): string {
  const slug = b.event
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `no-future-${slug || b.id}.png`;
}
