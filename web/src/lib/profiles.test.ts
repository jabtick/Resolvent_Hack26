import { describe, expect, it, vi } from "vitest";

import { fakeClient, FakeServer, fakeUid, json, pgError } from "@/test/fakeSupabase";

import {
  createProfilesApi,
  initialsOf,
  MAX_INTERESTS,
  publicProfileUrl,
  replaceInterests,
  validateAvatar,
} from "./profiles";

async function signedIn() {
  const server = new FakeServer();
  server.profileRow = {
    account_type: "student",
    username: "petya",
    display_name: "Петя",
    avatar_url: null,
    student_details: {
      birth_date: "2008-05-01",
      city: "Бургас",
      school: null,
      grade: 10,
      bio: null,
      is_public: false,
      consent_granted_at: null,
    },
    organizer_details: null,
  };
  const db = fakeClient(server);
  await db.auth.signInWithPassword({ email: "petya@example.com", password: "abcdefghi1" });
  return { server, api: createProfilesApi(db) };
}

describe("profile picture", () => {
  const png = () => new File([new Uint8Array([137, 80, 78, 71])], "me.png", { type: "image/png" });

  it("only small images are accepted", () => {
    expect(validateAvatar({ type: "image/png", size: 1000 })).toBeNull();
    expect(validateAvatar({ type: "application/pdf", size: 1000 })).toMatch(/JPG, PNG/);
    expect(validateAvatar({ type: "image/jpeg", size: 3 * 1024 * 1024 })).toMatch(/2 MB/);
  });

  it("uploads into the user's own folder, saves the path, deletes the old file", async () => {
    const { server, api } = await signedIn();
    server.profileRow!["avatar_url"] = `${fakeUid}/old.jpg`;
    await api.uploadAvatar(png());

    const upload = server.requests.find(
      (r) => r.method === "POST" && r.url.pathname.startsWith("/storage/v1/object/avatars/"),
    )!;
    const path = upload.url.pathname.slice("/storage/v1/object/avatars/".length);
    expect(path).toMatch(new RegExp(`^${fakeUid}/\\d+\\.png$`));
    expect(server.writesTo("profiles")[0]!.body).toEqual({ avatar_url: path });
    const removed = server.requests.find(
      (r) => r.method === "DELETE" && r.url.pathname === "/storage/v1/object/avatars",
    )!;
    expect(removed.body).toEqual({ prefixes: [`${fakeUid}/old.jpg`] });
  });

  it("a wrong file never reaches the server", async () => {
    const { server, api } = await signedIn();
    const pdf = new File(["x"], "cv.pdf", { type: "application/pdf" });
    await expect(api.uploadAvatar(pdf)).rejects.toThrow(/JPG, PNG/);
    expect(server.requests.some((r) => r.url.pathname.startsWith("/storage/"))).toBe(false);
  });

  it("missing bucket (migration not applied) gives a clear message", async () => {
    const { server, api } = await signedIn();
    const now = vi.spyOn(Date, "now").mockReturnValue(123);
    server.on(`POST /storage/v1/object/avatars/${fakeUid}/123.png`, () =>
      json({ statusCode: "404", error: "Bucket not found", message: "Bucket not found" }, 400),
    );
    await expect(api.uploadAvatar(png())).rejects.toThrow("Качването на снимки още не е включено.");
    expect(server.writesTo("profiles")).toHaveLength(0); // nothing saved when the upload fails
    now.mockRestore();
  });

  it("remove clears the column and deletes the file", async () => {
    const { server, api } = await signedIn();
    server.profileRow!["avatar_url"] = `${fakeUid}/pic.webp`;
    await api.removeAvatar();
    expect(server.writesTo("profiles")[0]!.body).toEqual({ avatar_url: null });
    expect(
      server.requests.some(
        (r) => r.method === "DELETE" && r.url.pathname === "/storage/v1/object/avatars",
      ),
    ).toBe(true);
  });

  it("the stored path becomes a public URL", async () => {
    const { server, api } = await signedIn();
    server.profileRow!["avatar_url"] = `${fakeUid}/pic.webp`;
    const me = await api.loadMine();
    expect(me.avatarUrl).toBe(
      `https://test.supabase.co/storage/v1/object/public/avatars/${fakeUid}/pic.webp`,
    );
  });
});

describe("my profile", () => {
  it("is read with only the columns the site shows", async () => {
    const { server, api } = await signedIn();
    const me = await api.loadMine();
    expect(me.username).toBe("petya");
    expect(me.student!.grade).toBe(10);
    expect(me.student!.birthDate).toEqual(new Date(2008, 4, 1));
    const select = server.readsOf("profiles")[0]!.url.searchParams.get("select")!;
    expect(select).not.toContain("*");
    expect(select).not.toContain("guardian_email");
    expect(select).not.toContain("consent_token_hash");
    expect(select).toContain("consent_granted_at");
  });

  it("updates only the given student fields", async () => {
    const { server, api } = await signedIn();
    await api.updateMine({ isPublic: true, bio: "Здрасти" });
    expect(server.writesTo("profiles")).toHaveLength(0);
    expect(server.writesTo("student_details")[0]!.body).toEqual({
      is_public: true,
      bio: "Здрасти",
    });
  });

  it("can clear the grade", async () => {
    const { server, api } = await signedIn();
    await api.updateMine({ grade: null });
    expect(server.writesTo("student_details")[0]!.body).toEqual({ grade: null });
  });

  it("a server error becomes a Bulgarian message", async () => {
    const { server, api } = await signedIn();
    server.on("PATCH /rest/v1/student_details", () => pgError("42501", 403));
    await expect(api.updateMine({ bio: "x" })).rejects.toThrow("Нямаш права за това.");
  });
});

describe("public profiles", () => {
  it("a name that cannot exist is never looked up", async () => {
    const { server, api } = await signedIn();
    for (const bad of ["*", "a*", "%", "иван", "a b", ""]) {
      expect(await api.loadPublic(bad)).toBeNull();
    }
    expect(server.readsOf("public_profiles")).toHaveLength(0);
  });

  it("escapes _ so it is not a wildcard", async () => {
    const { server, api } = await signedIn();
    server.publicProfiles = [{ username: "i_van", display_name: "Иван", interests: ["Роботика"] }];
    const p = await api.loadPublic("i_van");
    expect(p!.interests).toEqual(["Роботика"]);
    expect(server.readsOf("public_profiles")[0]!.url.searchParams.get("username")).toBe(
      "ilike.i\\_van",
    );
  });

  it("missing → null", async () => {
    const { api } = await signedIn();
    expect(await api.loadPublic("nobody")).toBeNull();
  });
});

describe("public organizers", () => {
  it("maps the view; verified only when the status says so", async () => {
    const { server, api } = await signedIn();
    server.publicOrganizers = [
      {
        profile_id: "p1",
        username: "tech_school",
        display_name: "TS",
        org_name: "TechSchool Варна",
        org_type: "school",
        website: "https://example.org",
        verification_status: "verified",
      },
    ];
    const o = await api.loadPublicOrganizer("tech_school");
    expect(o).toMatchObject({ orgName: "TechSchool Варна", verified: true, profileId: "p1" });
    // "_" must not act as a wildcard
    expect(server.readsOf("public_organizers")[0]!.url.searchParams.get("username")).toBe(
      "ilike.tech\\_school",
    );
    server.publicOrganizers[0]!["verification_status"] = "pending";
    expect((await api.loadPublicOrganizer("tech_school"))!.verified).toBe(false);
  });

  it("bad names are never looked up; missing → null", async () => {
    const { server, api } = await signedIn();
    expect(await api.loadPublicOrganizer("a*")).toBeNull();
    expect(server.readsOf("public_organizers")).toHaveLength(0);
    expect(await api.loadPublicOrganizer("nobody")).toBeNull();
  });
});

describe("interests", () => {
  it("lists only topic tags", async () => {
    const { server, api } = await signedIn();
    server.tags = [{ id: 1, name: "Математика" }];
    expect(await api.interestTags()).toEqual([{ id: 1, name: "Математика" }]);
    expect(server.readsOf("tags")[0]!.url.searchParams.get("kind")).toBe("eq.topic");
  });

  it("reads my picked ids", async () => {
    const { server, api } = await signedIn();
    server.profileInterests = [{ tag_id: 2 }, { tag_id: 5 }];
    expect(await api.myInterestIds()).toEqual([2, 5]);
  });

  it("updateMine with interests removes the unwanted and adds the picked", async () => {
    const { server, api } = await signedIn();
    await api.updateMine({ interests: [4, 4, 9] });
    const w = server.writesTo("profile_interests");
    expect(w[0]!.method).toBe("DELETE");
    expect(w[0]!.url.searchParams.get("tag_id")).toBe("not.in.(4,9)");
    expect(w[1]!.body).toEqual([
      { profile_id: expect.any(String), tag_id: 4 },
      { profile_id: expect.any(String), tag_id: 9 },
    ]);
  });

  it("no interests picked: removes them all and adds nothing", async () => {
    const { server, api } = await signedIn();
    await api.updateMine({ interests: [] });
    const w = server.writesTo("profile_interests");
    expect(w).toHaveLength(1);
    expect(w[0]!.method).toBe("DELETE");
    expect(w[0]!.url.searchParams.get("tag_id")).toBeNull();
  });

  it("caps the number and ignores values that are not whole positive numbers", async () => {
    const server = new FakeServer();
    const ids = [...Array.from({ length: 30 }, (_, i) => i + 1), -1, 2.5, Number.NaN];
    await replaceInterests(fakeClient(server), "u1", ids);
    const rows = server.writesTo("profile_interests")[1]!.body as { tag_id: number }[];
    expect(rows).toHaveLength(MAX_INTERESTS);
    expect(rows.every((r) => Number.isInteger(r.tag_id) && r.tag_id > 0)).toBe(true);
  });
});

it("initials and link", () => {
  expect(initialsOf("Петя Иванова")).toBe("ПИ");
  expect(initialsOf("ivan")).toBe("I");
  expect(initialsOf("  ")).toBe("?");
  expect(publicProfileUrl("petya", "https://nofuture.netlify.app/")).toBe(
    "https://nofuture.netlify.app/u/petya",
  );
});
