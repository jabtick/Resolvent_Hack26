import { describe, expect, it, vi } from "vitest";

import type { Badge } from "./achievements";
import {
  badgePublicUrl,
  badgeShareText,
  badgeShareTitle,
  canShareFile,
  canShareLink,
  copyLink,
  imageFileName,
  networkShareUrl,
  placeText,
  shareBadge,
  type ShareNav,
} from "./share";

const gold: Badge = {
  id: "b1",
  event: "Национална олимпиада по математика",
  org: "Министерство на образованието",
  date: "Апр 2026",
  place: 1,
  isHidden: false,
  isSample: false,
};

const took_part: Badge = {
  id: "b3",
  event: "Конкурс за млади писатели",
  org: "Фондация Силно платно",
  date: "Фев 2026",
  place: null,
  isHidden: false,
  isSample: false,
};

function file(): File {
  return new File([new Uint8Array([1, 2, 3])], "badge.png", { type: "image/png" });
}

describe("the shared link", () => {
  it("points at /b/<id>", () => {
    expect(badgePublicUrl("b1", "https://nofuture.bg")).toBe("https://nofuture.bg/b/b1");
  });

  it("does not double the slash when the origin has one", () => {
    expect(badgePublicUrl("b1", "https://nofuture.bg/")).toBe("https://nofuture.bg/b/b1");
  });
});

describe("the wording", () => {
  it("names the place for a podium badge", () => {
    expect(placeText(1)).toBe("1-ВО МЯСТО");
    expect(badgeShareTitle(gold)).toBe("1-ВО МЯСТО — Национална олимпиада по математика");
    expect(badgeShareText(gold)).toContain("1-ВО МЯСТО на Национална олимпиада");
  });

  it("says participation instead of a place", () => {
    expect(placeText(null)).toBe("УЧАСТНИК");
    expect(badgeShareText(took_part)).toContain("Участвах в Конкурс за млади писатели");
  });

  it("always credits the organiser and carries the hashtag", () => {
    for (const b of [gold, took_part]) {
      expect(badgeShareText(b)).toContain(b.org);
      expect(badgeShareText(b)).toContain("Потвърдено от организатора");
      expect(badgeShareText(b)).toContain("#NoFuture");
    }
  });
});

describe("the per-network links", () => {
  const url = "https://nofuture.bg/b/b1";
  const text = "1-ВО МЯСТО!";

  it("encodes the url for every network", () => {
    for (const n of ["facebook", "x", "linkedin", "whatsapp", "viber", "telegram"] as const) {
      expect(networkShareUrl(n, url, text)).toContain(encodeURIComponent(url));
    }
  });

  it("sends only the url to the ones that read Open Graph", () => {
    expect(networkShareUrl("facebook", url, text)).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    );
    expect(networkShareUrl("linkedin", url, text)).not.toContain(encodeURIComponent(text));
  });

  it("puts the caption in the message for the chat apps", () => {
    expect(networkShareUrl("whatsapp", url, text)).toContain(encodeURIComponent(`${text}\n${url}`));
    expect(networkShareUrl("viber", url, text)).toMatch(/^viber:\/\/forward\?text=/);
  });
});

describe("what the browser can do", () => {
  it("reports no sheet when navigator has none", () => {
    expect(canShareLink({})).toBe(false);
    expect(canShareFile(file(), {})).toBe(false);
  });

  it("reports a picture share only when canShare agrees", () => {
    const yes: ShareNav = { share: async () => undefined, canShare: () => true };
    const no: ShareNav = { share: async () => undefined, canShare: () => false };
    expect(canShareFile(file(), yes)).toBe(true);
    expect(canShareFile(file(), no)).toBe(false);
  });

  it("survives a canShare that throws", () => {
    const nav: ShareNav = {
      share: async () => undefined,
      canShare: () => {
        throw new Error("nope");
      },
    };
    expect(canShareFile(file(), nav)).toBe(false);
  });
});

describe("sharing a badge", () => {
  const args = { title: "t", text: "caption", url: "https://nofuture.bg/b/b1" };

  it("attaches the picture when it can", async () => {
    let seen: ShareData | undefined;
    const nav: ShareNav = {
      share: async (d) => {
        seen = d;
      },
      canShare: () => true,
    };
    await expect(shareBadge({ ...args, file: file() }, nav)).resolves.toBe("shared");
    expect(seen?.files).toHaveLength(1);
    // The link rides along in the caption, since files + url is rejected by
    // some targets.
    expect(seen?.text).toContain(args.url);
  });

  it("shares the link when the browser refuses files", async () => {
    let seen: ShareData | undefined;
    const nav: ShareNav = {
      share: async (d) => {
        seen = d;
      },
      canShare: () => false,
    };
    await expect(shareBadge({ ...args, file: file() }, nav)).resolves.toBe("shared");
    expect(seen?.files).toBeUndefined();
    expect(seen?.url).toBe(args.url);
  });

  it("falls back to the link when the picture share fails", async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(new Error("file target blew up"))
      .mockResolvedValueOnce(undefined);
    const nav: ShareNav = { share, canShare: () => true };
    await expect(shareBadge({ ...args, file: file() }, nav)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledTimes(2);
  });

  it("stays quiet when the person closes the sheet", async () => {
    const abort = Object.assign(new Error("cancelled"), { name: "AbortError" });
    const nav: ShareNav = { share: vi.fn().mockRejectedValue(abort), canShare: () => true };
    await expect(shareBadge({ ...args, file: file() }, nav)).resolves.toBe("cancelled");
  });

  it("copies the link when there is no share sheet", async () => {
    const writeText = vi.fn(async () => undefined);
    await expect(shareBadge(args, { clipboard: { writeText } })).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith(`${args.text}\n${args.url}`);
  });

  it("reports failure when copying is blocked too", async () => {
    const nav: ShareNav = { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) } };
    await expect(shareBadge(args, nav)).resolves.toBe("failed");
  });

  it("reports unsupported when the browser offers nothing", async () => {
    await expect(shareBadge(args, {})).resolves.toBe("unsupported");
  });
});

describe("copying just the link", () => {
  it("returns false when there is no clipboard", async () => {
    await expect(copyLink("https://x.bg", {})).resolves.toBe(false);
  });

  it("returns true once written", async () => {
    const writeText = vi.fn(async () => undefined);
    await expect(copyLink("https://x.bg", { clipboard: { writeText } })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://x.bg");
  });
});

describe("the saved picture's name", () => {
  it("is a png named after the event", () => {
    expect(imageFileName(gold)).toBe("no-future-национална-олимпиада-по-математика.png");
  });

  it("falls back to the id when the title has nothing usable", () => {
    expect(imageFileName({ ...gold, event: "!!!" })).toBe("no-future-b1.png");
  });
});
