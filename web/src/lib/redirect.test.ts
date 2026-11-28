import { describe, expect, it } from "vitest";

import { authRedirect } from "./redirect";

describe("signed out", () => {
  it("private → login", () => expect(authRedirect("signedOut", "/profile")).toBe("/login"));
  it("saved → login", () => expect(authRedirect("signedOut", "/saved")).toBe("/login"));
  it("trailing slash", () => expect(authRedirect("signedOut", "/settings/")).toBe("/login"));
  it("public profile stays", () => expect(authRedirect("signedOut", "/u/ivan")).toBeNull());
  it("feed stays", () => expect(authRedirect("signedOut", "/")).toBeNull());
  it("an opportunity stays", () => expect(authRedirect("signedOut", "/opp/sample-1")).toBeNull());
  it("code without sign-up → join", () => expect(authRedirect("signedOut", "/code")).toBe("/join"));
  it("create-profile → login", () =>
    expect(authRedirect("signedOut", "/create-profile")).toBe("/login"));
});

describe("awaiting code", () => {
  it("anywhere → code", () => expect(authRedirect("awaitingCode", "/")).toBe("/code"));
  it("code stays", () => expect(authRedirect("awaitingCode", "/code")).toBeNull());
  it("join stays (to start over)", () => expect(authRedirect("awaitingCode", "/join")).toBeNull());
});

describe("needs profile", () => {
  it("anywhere → create-profile", () =>
    expect(authRedirect("needsProfile", "/u/ivan")).toBe("/create-profile"));
  it("create-profile stays", () =>
    expect(authRedirect("needsProfile", "/create-profile")).toBeNull());
});

describe("signed in", () => {
  for (const p of ["/login", "/join", "/code", "/create-profile", "/forgot"]) {
    it(`${p} → profile`, () => expect(authRedirect("signedIn", p)).toBe("/profile"));
  }
  it("settings stays", () => expect(authRedirect("signedIn", "/settings")).toBeNull());
});
