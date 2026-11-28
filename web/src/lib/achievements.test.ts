import { describe, expect, it } from "vitest";

import { fakeClient, FakeServer, fakeUid, pgError } from "@/test/fakeSupabase";

import { SAMPLE_BADGES, badgeStats, createAchievementsApi, formatBadgeDate } from "./achievements";

const BADGE = "55555555-5555-5555-5555-555555555555";

async function signedIn() {
  const server = new FakeServer();
  const db = fakeClient(server);
  await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
  return { server, api: createAchievementsApi(db) };
}

const row = {
  id: BADGE,
  event_title: "Национална олимпиада по информатика",
  org_name: "Код Академия",
  event_date: "2026-04-15",
  place: 2,
  is_hidden: true,
};

describe("my badges", () => {
  it("maps rows and asks only for the signed-in student's, newest first", async () => {
    const { server, api } = await signedIn();
    server.badges = [row, { ...row, id: "b", place: null, is_hidden: false }];
    const list = await api.listMine();
    expect(list[0]).toEqual({
      id: BADGE,
      event: "Национална олимпиада по информатика",
      org: "Код Академия",
      date: "Апр 2026",
      place: 2,
      hidden: true,
      isSample: false,
    });
    expect(list[1]).toMatchObject({ place: null, hidden: false });
    const q = server.readsOf("badges")[0]!.url.searchParams;
    expect(q.get("profile_id")).toBe(`eq.${fakeUid}`);
    expect(q.get("order")).toBe("event_date.desc");
  });

  it("signed out: empty, no request", async () => {
    const server = new FakeServer();
    const api = createAchievementsApi(fakeClient(server));
    expect(await api.listMine()).toEqual([]);
    expect(server.readsOf("badges")).toHaveLength(0);
  });

  it("an unexpected place number becomes participation", async () => {
    const { server, api } = await signedIn();
    server.badges = [{ ...row, place: 7 }];
    expect((await api.listMine())[0]!.place).toBeNull();
  });

  it("a failing load is an error", async () => {
    const { server, api } = await signedIn();
    server.on("GET /rest/v1/badges", () => pgError("XX000"));
    await expect(api.listMine()).rejects.toThrow("Нещо се обърка. Опитай пак.");
  });
});

describe("public badges", () => {
  it("reads public_badges by username and skips incomplete rows", async () => {
    const server = new FakeServer();
    const api = createAchievementsApi(fakeClient(server));
    server.publicBadges = [
      { ...row, username: "petya", is_hidden: undefined },
      { id: null, event_title: null, org_name: null, event_date: null, place: null },
    ];
    const list = await api.listPublic("petya");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: BADGE, date: "Апр 2026", hidden: false });
    const q = server.readsOf("public_badges")[0]!.url.searchParams;
    expect(q.get("username")).toBe("eq.petya");
  });
});

describe("hiding a badge", () => {
  it("updates only is_hidden on your own badge", async () => {
    const { server, api } = await signedIn();
    await api.setHidden({ id: BADGE, isSample: false }, true);
    const [w] = server.writesTo("badges");
    expect(w).toMatchObject({ method: "PATCH", body: { is_hidden: true } });
    expect(w!.url.searchParams.get("id")).toBe(`eq.${BADGE}`);
    expect(w!.url.searchParams.get("profile_id")).toBe(`eq.${fakeUid}`);
  });

  it("samples and signed-out people cannot", async () => {
    const { api } = await signedIn();
    await expect(api.setHidden(SAMPLE_BADGES[0]!, true)).rejects.toThrow("примерна");
    const out = createAchievementsApi(fakeClient(new FakeServer()));
    await expect(out.setHidden({ id: BADGE, isSample: false }, true)).rejects.toThrow("Влез");
  });
});

it("helpers", () => {
  expect(formatBadgeDate("2025-11-03")).toBe("Ное 2025");
  expect(formatBadgeDate("bad")).toBe("bad");
  expect(SAMPLE_BADGES.every((b) => b.isSample)).toBe(true);
  expect(badgeStats(SAMPLE_BADGES)).toEqual({ total: 6, podium: 3, orgs: 6 });
});
