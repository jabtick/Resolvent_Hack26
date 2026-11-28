import { describe, expect, it } from "vitest";

import { authError, fakeClient, FakeServer, fakeUid, json, pgError } from "@/test/fakeSupabase";

import { createAuthApi } from "./auth";

const setup = (server = new FakeServer()) => ({ server, auth: createAuthApi(fakeClient(server)) });

const organizerRow = (details: unknown) => ({
  id: fakeUid,
  account_type: "organizer",
  student_details: null,
  organizer_details: details,
});

describe("a profile counts only with its details row", () => {
  it("no profile → needsProfile", async () => {
    const { auth } = setup();
    expect(await auth.signIn("petya@example.com", "abcdefghi1")).toBe("needsProfile");
  });
  it("profile without details → needsProfile", async () => {
    const { server, auth } = setup();
    server.profileRow = organizerRow(null);
    expect(await auth.signIn("petya@example.com", "abcdefghi1")).toBe("needsProfile");
  });
  it("profile with details → signedIn", async () => {
    const { server, auth } = setup();
    server.profileRow = organizerRow({ profile_id: fakeUid });
    expect(await auth.signIn("petya@example.com", "abcdefghi1")).toBe("signedIn");
  });
});

describe("sign-up", () => {
  it("an existing address (no identities) is refused", async () => {
    const { server, auth } = setup();
    server.on("POST /auth/v1/signup", () =>
      json({ id: fakeUid, aud: "authenticated", identities: [] }),
    );
    await expect(auth.signUp("petya@example.com", "abcdefghi1")).rejects.toThrow(
      "Вече има акаунт с този имейл. Влез.",
    );
  });
  it("a wrong code is refused with a Bulgarian message", async () => {
    const { server, auth } = setup();
    server.on("POST /auth/v1/verify", () => authError("otp_expired", 403));
    await expect(auth.confirmCode("petya@example.com", "000000")).rejects.toThrow(
      "Кодът е грешен или изтекъл.",
    );
  });
  it("a failing profile check right after a good code still moves on", async () => {
    const { server, auth } = setup();
    server.on("GET /rest/v1/profiles", () => pgError("XX000"));
    expect(await auth.confirmCode("petya@example.com", "123456")).toBe("needsProfile");
  });
});

describe("creating the profile", () => {
  it("student: profiles + student_details with the birth date", async () => {
    const { server, auth } = setup();
    await auth.signIn("petya@example.com", "abcdefghi1");
    await auth.createProfile({
      type: "student",
      username: "petya",
      displayName: "Петя",
      birthDate: new Date(2008, 4, 1),
    });
    const p = server.writesTo("profiles")[0]!;
    expect(p.method).toBe("POST");
    expect(p.body).toMatchObject({ id: fakeUid, account_type: "student", username: "petya" });
    expect(server.writesTo("student_details")[0]!.body).toEqual({
      profile_id: fakeUid,
      birth_date: "2008-05-01",
    });
  });

  it("student with interests: they are saved after the profile", async () => {
    const { server, auth } = setup();
    await auth.signIn("petya@example.com", "abcdefghi1");
    await auth.createProfile({
      type: "student",
      username: "petya",
      displayName: "Петя",
      birthDate: new Date(2008, 4, 1),
      interests: [3, 7],
    });
    expect(server.writesTo("profile_interests").map((r) => r.method)).toEqual(["DELETE", "POST"]);
    expect(server.writesTo("profile_interests")[1]!.body).toEqual([
      { profile_id: fakeUid, tag_id: 3 },
      { profile_id: fakeUid, tag_id: 7 },
    ]);
  });

  it("interests failing to save does not undo the profile", async () => {
    const { server, auth } = setup();
    server.on("POST /rest/v1/profile_interests", () => pgError("42501", 403));
    await auth.signIn("petya@example.com", "abcdefghi1");
    await auth.createProfile({
      type: "student",
      username: "petya",
      displayName: "Петя",
      birthDate: new Date(2008, 4, 1),
      interests: [3],
    });
    expect(server.writesTo("student_details")).toHaveLength(1);
  });

  it("retry after a half-created profile keeps the type and updates the names", async () => {
    const { server, auth } = setup();
    server.profileRow = organizerRow(null);
    await auth.signIn("petya@example.com", "abcdefghi1");
    await auth.createProfile({
      type: "organizer",
      username: "org_2",
      displayName: "Орг",
      orgName: "Клуб",
      orgType: "ngo",
    });
    const p = server.writesTo("profiles");
    expect(p).toHaveLength(1);
    expect(p[0]!.method).toBe("PATCH");
    expect(p[0]!.body).toEqual({ username: "org_2", display_name: "Орг" });
    expect(server.writesTo("organizer_details")).toHaveLength(1);
  });

  it("switching type after the row exists is refused clearly", async () => {
    const { server, auth } = setup();
    server.profileRow = organizerRow(null);
    await auth.signIn("petya@example.com", "abcdefghi1");
    await expect(
      auth.createProfile({
        type: "student",
        username: "x_1",
        displayName: "X",
        birthDate: new Date(2008, 0, 1),
      }),
    ).rejects.toThrow("Акаунтът вече е създаден като организатор.");
    expect(server.writesTo("student_details")).toHaveLength(0);
  });

  it("missing fields are refused before calling the server", async () => {
    const { server, auth } = setup();
    await auth.signIn("petya@example.com", "abcdefghi1");
    await expect(
      auth.createProfile({ type: "student", username: "petya", displayName: "Петя" }),
    ).rejects.toThrow("Въведи дата на раждане.");
    expect(server.writesTo("profiles")).toHaveLength(0);
  });

  it("a taken username is reported", async () => {
    const { server, auth } = setup();
    server.on("POST /rest/v1/profiles", () => pgError("23505", 409));
    await auth.signIn("petya@example.com", "abcdefghi1");
    await expect(
      auth.createProfile({
        type: "student",
        username: "ivan",
        displayName: "И",
        birthDate: new Date(2008, 0, 1),
      }),
    ).rejects.toThrow("Това потребителско име е заето");
  });
});

describe("sign-in", () => {
  it("unconfirmed email sends a fresh code and asks for it", async () => {
    const { server, auth } = setup();
    server.on("POST /auth/v1/token", () => authError("email_not_confirmed"));
    expect(await auth.signIn("Petya@Example.com", "abcdefghi1")).toBe("awaitingCode");
    expect(server.requests.some((r) => r.url.pathname === "/auth/v1/resend")).toBe(true);
  });
  it("wrong password", async () => {
    const { server, auth } = setup();
    server.on("POST /auth/v1/token", () => authError("invalid_credentials"));
    await expect(auth.signIn("petya@example.com", "x")).rejects.toThrow("Грешен имейл или парола.");
  });
});

describe("password reset", () => {
  it("same password: clear message, signed out", async () => {
    const { server, auth } = setup();
    server.on("PUT /auth/v1/user", () => authError("same_password", 422));
    await expect(auth.resetPassword("petya@example.com", "123456", "abcdefghi1")).rejects.toThrow(
      "Новата парола трябва да е различна от старата. Поискай нов код.",
    );
    expect(await auth.currentUserId()).toBeNull();
  });
  it("good code + new password signs in", async () => {
    const { server, auth } = setup();
    server.profileRow = organizerRow({ profile_id: fakeUid });
    expect(await auth.resetPassword("petya@example.com", "123456", "novaparola2")).toBe("signedIn");
  });
});

describe("never-throwing calls", () => {
  it("sign out, even when the server refuses", async () => {
    const { server, auth } = setup();
    await auth.signIn("petya@example.com", "abcdefghi1");
    server.on("POST /auth/v1/logout", () => authError("unexpected_failure"));
    await expect(auth.signOut()).resolves.toBeUndefined();
    expect(await auth.currentUserId()).toBeNull();
  });
  it("restore with a failing check falls back to signed out", async () => {
    const { server, auth } = setup();
    await auth.signIn("petya@example.com", "abcdefghi1");
    server.on("GET /rest/v1/profiles", () => pgError("XX000"));
    expect(await auth.restore()).toBe("signedOut");
  });
  it("restore without a session", async () => {
    const { auth } = setup();
    expect(await auth.restore()).toBe("signedOut");
  });
});

it("delete account calls the edge function with the confirmation", async () => {
  const { server, auth } = setup();
  await auth.signIn("petya@example.com", "abcdefghi1");
  await auth.deleteAccount();
  const call = server.requests.find((r) => r.url.pathname === "/functions/v1/delete-account")!;
  expect(call.body).toEqual({ confirm: "DELETE" });
  expect(await auth.currentUserId()).toBeNull();
});
