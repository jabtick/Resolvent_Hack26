import { describe, expect, it } from "vitest";

import { SAMPLE_OPPS } from "@/data/sampleOpps";
import { fakeClient, FakeServer, fakeUid, pgError } from "@/test/fakeSupabase";

import {
  colorFor,
  createOppsApi,
  formatDeadline,
  formatStatus,
  hostOf,
  isOngoing,
  markDates,
  periodOf,
  placeOf,
  titleFontSize,
  whyText,
} from "./opps";

it("calendar: one mark per event, the full period on hover", () => {
  const hack = {
    deadlineAt: "2026-11-20T21:59:00Z",
    startsAt: "2026-11-27T14:00:00Z",
    endsAt: "2026-11-29T16:30:00Z",
  };
  const scholarship = { deadlineAt: "2026-12-06T21:59:00Z", startsAt: null, endsAt: null };
  const noDates = { deadlineAt: null, startsAt: null, endsAt: null };
  // only the start is marked, not the deadline; a scholarship is marked on its deadline
  expect(markDates([hack, scholarship, noDates]).map((d) => d.toISOString())).toEqual([
    "2026-11-27T14:00:00.000Z",
    "2026-12-06T21:59:00.000Z",
  ]);
  expect(periodOf(hack)).toEqual({
    from: new Date("2026-11-27T14:00:00Z"),
    to: new Date("2026-11-29T16:30:00Z"),
  });
  expect(periodOf(noDates)).toBeNull();
});

it("card titles shrink to fit the card; the card size never changes", () => {
  const cqw = (t: string) => Number(/min\(([\d.]+)cqw/.exec(titleFontSize(t))![1]);
  expect(titleFontSize("LiberHack")).toBe("min(11cqw, 3rem)"); // short: the old size
  // a 19-letter word must fit on one line without breaking: 19 × 0.8em ≤ 84cqw
  const ceoi = cqw("Централноевропейска олимпиада по информатика CEOI");
  expect(ceoi).toBeLessThanOrEqual(84 / (19 * 0.8));
  const long =
    "Пролетни състезания по информатика, съвместно с Международен турнир по информатика за напреднали";
  expect(cqw(long)).toBeLessThan(cqw("Национална олимпиада по математика"));
  expect(cqw(long)).toBeGreaterThanOrEqual(3);
});

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

it("ongoing events say 'тече сега' even after the registration deadline", () => {
  // LiberHack Edition 2: registration closed 20 Nov, event 27 Nov 16:00 – 29 Nov 18:30 (Sofia time).
  const hack = {
    deadlineAt: "2026-11-20T21:59:00Z",
    startsAt: "2026-11-27T14:00:00Z",
    endsAt: "2026-11-29T16:30:00Z",
  };
  expect(formatStatus(hack, new Date("2026-11-28T10:00:00Z"))).toBe("тече сега");
  expect(isOngoing(hack, new Date("2026-11-27T13:00:00Z"))).toBe(false); // before the start
  expect(formatStatus(hack, new Date("2026-11-27T13:00:00Z"))).toBe("изтекъл");
  expect(formatStatus(hack, new Date("2026-11-30T10:00:00Z"))).toBe("изтекъл"); // over
  // No end date: ongoing only on the start day.
  const oneDay = { deadlineAt: null, startsAt: "2026-12-05T08:00:00Z", endsAt: null };
  expect(formatStatus(oneDay, new Date("2026-12-05T12:00:00Z"))).toBe("тече сега");
  expect(formatStatus(oneDay, new Date("2026-12-07T12:00:00Z"))).toBe("без срок");
});

it("the feed reads ends_at", async () => {
  const { server, api } = setup();
  server.opportunities = [
    {
      id: OPP,
      title: "LiberHack",
      type: "competition",
      city: "Бургас",
      is_online: false,
      deadline_at: "2026-11-20T21:59:00Z",
      starts_at: "2026-11-27T14:00:00Z",
      ends_at: "2026-11-29T16:30:00Z",
      description: null,
      external_url: "https://liberhack.org/",
      source_url: "https://liberhack.org/",
      organizer_id: null,
      opportunity_tags: [],
    },
  ];
  const [o] = await api.listFeed();
  expect(o).toMatchObject({ endsAt: "2026-11-29T16:30:00Z" });
  const q = server.readsOf("opportunities")[0]!.url.searchParams;
  expect(q.get("select")).toContain("ends_at");
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

describe("organizer pages and dashboard", () => {
  it("lists only that organizer's published items", async () => {
    const { server, api } = setup();
    server.opportunities = [
      { id: OPP, title: "Купа", type: "competition", is_online: false, organizer_id: ORG },
    ];
    server.organizers = [{ profile_id: ORG, org_name: "TechSchool" }];
    const list = await api.listByOrganizer(ORG);
    expect(list.map((o) => o.org)).toEqual(["TechSchool"]);
    const q = server.readsOf("opportunities")[0]!.url.searchParams;
    expect(q.get("organizer_id")).toBe(`eq.${ORG}`);
    expect(q.get("status")).toBe("eq.published");
  });

  it("dashboard stats: numbers come back as numbers", async () => {
    const { server, api } = setup();
    server.stats = [{ opportunity_id: OPP, title: "Купа", status: "draft", saves: "3" }];
    expect(await api.myStats()).toEqual([{ id: OPP, title: "Купа", status: "draft", saves: 3 }]);
  });
});

describe("recommended (for you)", () => {
  const OPP2 = "44444444-4444-4444-4444-444444444444";
  const row = (id: string, title: string) => ({
    id,
    title,
    type: "competition",
    is_online: true,
    organizer_id: null,
    source_url: "https://example.org/x",
  });

  it("keeps the database order (best first) and attaches the rating and reasons", async () => {
    const { server, api } = setup();
    // The database says OPP2 is better, but the opportunities query returns OPP first.
    server.recommended = [
      { opportunity_id: OPP2, rating: "0.9", interest: 0.9, history: 0, location: 1, urgency: 0.1 },
      { opportunity_id: OPP, rating: 0.6, interest: 0.2, history: 0, location: 0, urgency: 0.7 },
    ];
    server.opportunities = [row(OPP, "Първа"), row(OPP2, "Втора")];
    const list = await api.recommended();
    expect(list.map((r) => r.opp.title)).toEqual(["Втора", "Първа"]);
    expect(list[0]).toMatchObject({
      rating: 0.9,
      why: ["съвпада с интересите ти", "в твоя град или онлайн"],
    });
    expect(list[1]!.why).toEqual(["срокът наближава"]);
  });

  it("nothing rated → empty, and no second request", async () => {
    const { server, api } = setup();
    expect(await api.recommended()).toEqual([]);
    expect(server.readsOf("opportunities")).toHaveLength(0);
  });

  it("an item that vanished between the two requests is dropped", async () => {
    const { server, api } = setup();
    server.recommended = [
      { opportunity_id: OPP, rating: 0.8, interest: 1, history: 0, location: 0, urgency: 0 },
    ];
    server.opportunities = [];
    expect(await api.recommended()).toEqual([]);
  });

  it("whyText gives at most two reasons, none for a weak match", () => {
    expect(whyText({ interest: 0.1, history: 0.1, location: 0.5, urgency: 0.1 })).toEqual([]);
    expect(whyText({ interest: 1, history: 1, location: 1, urgency: 1 })).toHaveLength(2);
  });
});
