import { describe, expect, it } from "vitest";

import { SAMPLE_OPPS } from "@/data/sampleOpps";
import { fakeClient, FakeServer, fakeUid, pgError } from "@/test/fakeSupabase";

import { colorFor, createOppsApi, formatDeadline, hostOf, placeOf } from "./opps";

const ORG = "22222222-2222-2222-2222-222222222222";
const OPP = "33333333-3333-3333-3333-333333333333";

function setup() {
  const server = new FakeServer();
  return { server, db: fakeClient(server), api: createOppsApi(fakeClient(server)) };
}

describe("feed", () => {
  it("maps rows, names organizers, labels scraped items by their site", async () => {
    const { server, api } = setup();
    server.opportunities = [
      {
        id: OPP,
        title: "Стаж",
        type: "internship",
        city: "Бургас",
        is_online: false,
        deadline_at: "2026-12-20T00:00:00Z",
        starts_at: null,
        description: null,
        external_url: null,
        source_url: null,
        organizer_id: ORG,
        opportunity_tags: [{ tags: { name: "Програмиране" } }],
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        title: "Олимпиада",
        type: "competition",
        city: null,
        is_online: true,
        deadline_at: null,
        starts_at: null,
        description: "x",
        external_url: null,
        source_url: "https://www.infos.bg/olimpiada",
        organizer_id: null,
        opportunity_tags: [],
      },
    ];
    server.organizers = [{ profile_id: ORG, org_name: "Код Академия" }];
    const feed = await api.listFeed();
    expect(feed).toHaveLength(2);
    expect(feed[0]).toMatchObject({ org: "Код Академия", tags: ["Програмиране"], isSample: false });
    expect(feed[1]).toMatchObject({
      org: "infos.bg",
      externalUrl: "https://www.infos.bg/olimpiada",
    });
    const q = server.readsOf("opportunities")[0]!.url.searchParams;
    expect(q.get("status")).toBe("eq.published");
  });

  it("shows samples while the table is empty", async () => {
    const { api } = setup();
    const feed = await api.listFeed();
    expect(feed).toBe(SAMPLE_OPPS);
    expect(feed.every((o) => o.isSample)).toBe(true);
  });

  it("a failing load is an error, not samples", async () => {
    const { server, api } = setup();
    server.on("GET /rest/v1/opportunities", () => pgError("XX000"));
    await expect(api.listFeed()).rejects.toThrow("Нещо се обърка. Опитай пак.");
  });

  it("get: samples by id, bad ids are null without a request", async () => {
    const { server, api } = setup();
    expect(await api.get("sample-1")).toBe(SAMPLE_OPPS[0]);
    expect(await api.get("not-a-uuid")).toBeNull();
    expect(server.readsOf("opportunities")).toHaveLength(0);
  });
});

describe("saved", () => {
  it("signed out: nothing saved, saving asks to sign in", async () => {
    const { api } = setup();
    expect((await api.savedIds()).size).toBe(0);
    await expect(api.setSaved({ id: OPP, isSample: false }, true)).rejects.toThrow(
      "Влез, за да запазваш обяви.",
    );
  });

  it("save and unsave write the right rows", async () => {
    const server = new FakeServer();
    const db = fakeClient(server);
    await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
    const api = createOppsApi(db);
    await api.setSaved({ id: OPP, isSample: false }, true);
    await api.setSaved({ id: OPP, isSample: false }, false);
    const w = server.writesTo("saved_opportunities");
    expect(w[0]).toMatchObject({
      method: "POST",
      body: { profile_id: fakeUid, opportunity_id: OPP },
    });
    expect(w[1]!.method).toBe("DELETE");
    expect(w[1]!.url.searchParams.get("opportunity_id")).toBe(`eq.${OPP}`);
  });

  it("samples cannot be saved", async () => {
    const server = new FakeServer();
    const db = fakeClient(server);
    await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
    await expect(createOppsApi(db).setSaved(SAMPLE_OPPS[0]!, true)).rejects.toThrow(
      "Това е примерна обява — не може да се запази.",
    );
  });
});

it("formatting helpers", () => {
  const now = new Date("2026-12-01T00:00:00Z");
  expect(formatDeadline(null, now)).toBe("без срок");
  expect(formatDeadline("2026-11-01T00:00:00Z", now)).toBe("изтекъл");
  expect(formatDeadline("2026-12-20T12:00:00Z", now)).toBe("до 20 дек");
  expect(placeOf({ city: "Бургас", online: true })).toBe("Бургас · онлайн");
  expect(placeOf({ city: null, online: true })).toBe("Онлайн");
  expect(hostOf("https://www.infos.bg/x")).toBe("infos.bg");
  expect(hostOf(null)).toBe("Изскрейпено");
  expect(colorFor("abc")).toBe(colorFor("abc"));
});

describe("organizer posts", () => {
  it("creates an opportunity with only the granted columns", async () => {
    const server = new FakeServer();
    const db = fakeClient(server);
    await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
    await createOppsApi(db).create({
      title: "Хакатон",
      type: "competition",
      city: "Бургас",
      online: false,
      startsAt: "2026-12-10T09:00:00.000Z",
      deadlineAt: "2026-12-05T21:00:00.000Z",
      description: "48 часа",
      externalUrl: "https://example.com",
      publish: false,
    });
    const body = server.writesTo("opportunities")[0]!.body as Record<string, unknown>;
    expect(body).toEqual({
      title: "Хакатон",
      type: "competition",
      city: "Бургас",
      is_online: false,
      starts_at: "2026-12-10T09:00:00.000Z",
      deadline_at: "2026-12-05T21:00:00.000Z",
      description: "48 часа",
      external_url: "https://example.com",
      status: "draft",
    });
    expect(body).not.toHaveProperty("organizer_id");
    expect(body).not.toHaveProperty("source");
  });

  it("an unverified organizer cannot publish (RLS) and is told why", async () => {
    const server = new FakeServer();
    server.on("POST /rest/v1/opportunities", () => pgError("42501", 403));
    const db = fakeClient(server);
    await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
    await expect(
      createOppsApi(db).create({
        title: "X",
        type: "competition",
        city: null,
        online: true,
        startsAt: null,
        deadlineAt: null,
        description: "",
        externalUrl: null,
        publish: true,
      }),
    ).rejects.toThrow("Публикуването е само за проверени организатори. Запази като чернова.");
  });
});
