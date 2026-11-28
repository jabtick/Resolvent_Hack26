import { describe, expect, it } from "vitest";

import { fakeClient, FakeServer, pgError } from "@/test/fakeSupabase";

import { badgeStats, createAchievementsApi, formatBadgeDate, SAMPLE_BADGES } from "./achievements";

async function setup(signedIn = true) {
  const server = new FakeServer();
  const db = fakeClient(server);
  if (signedIn) {
    await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
  }
  return { server, api: createAchievementsApi(db) };
}

describe("dates and stats", () => {
  it("formats the month by hand (no time-zone shift)", () => {
    expect(formatBadgeDate("2026-04-01")).toBe("Апр 2026");
    expect(formatBadgeDate("2025-12-31")).toBe("Дек 2025");
    expect(formatBadgeDate("")).toBe("");
  });

  it("counts badges, podium places and organisers", () => {
    expect(badgeStats(SAMPLE_BADGES)).toEqual({ total: 6, podium: 3, orgs: 6 });
  });
});

describe("my badges", () => {
  it("maps rows; an unknown place becomes participation", async () => {
    const { server, api } = await setup();
    server.badges = [
      {
        id: "b1",
        event_title: "Купа",
        org_name: "TechSchool",
        event_date: "2026-03-10",
        place: 2,
        is_hidden: true,
      },
      {
        id: "b2",
        event_title: "Конкурс",
        org_name: "Фонд",
        event_date: "2026-02-01",
        place: 9,
        is_hidden: false,
      },
    ];
    const list = await api.listMine();
    expect(list[0]).toMatchObject({ place: 2, isHidden: true, date: "Мар 2026", isSample: false });
    expect(list[1]!.place).toBeNull();
  });

  it("signed out → empty, and nothing is requested", async () => {
    const { server, api } = await setup(false);
    expect(await api.listMine()).toEqual([]);
    expect(server.readsOf("badges")).toHaveLength(0);
  });

  it("hiding sends only is_hidden", async () => {
    const { server, api } = await setup();
    await api.setHidden("b1", true);
    const w = server.writesTo("badges");
    expect(w).toHaveLength(1);
    expect(w[0]!.body).toEqual({ is_hidden: true });
  });

  it("a refused update becomes a Bulgarian message", async () => {
    const { server, api } = await setup();
    server.on("PATCH /rest/v1/badges", () => pgError("42501", 403));
    await expect(api.setHidden("b1", true)).rejects.toThrow("Нямаш права за това.");
  });
});

describe("public badges", () => {
  it("asks the public view by username", async () => {
    const { server, api } = await setup(false);
    server.publicBadges = [
      { id: "b1", event_title: "Купа", org_name: "TS", event_date: "2026-03-10", place: 1 },
    ];
    const list = await api.listPublic("petya");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ place: 1, isHidden: false });
    expect(server.readsOf("public_badges")[0]!.url.searchParams.get("username")).toBe("eq.petya");
  });
});
