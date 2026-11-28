import { describe, expect, it } from "vitest";

import { fakeClient, FakeServer, pgError } from "@/test/fakeSupabase";

import { createProfilesApi, initialsOf, publicProfileUrl } from "./profiles";

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

it("initials and link", () => {
  expect(initialsOf("Петя Иванова")).toBe("ПИ");
  expect(initialsOf("ivan")).toBe("I");
  expect(initialsOf("  ")).toBe("?");
  expect(publicProfileUrl("petya", "https://nofuture.netlify.app/")).toBe(
    "https://nofuture.netlify.app/u/petya",
  );
});
