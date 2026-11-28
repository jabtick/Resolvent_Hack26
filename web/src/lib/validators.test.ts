import { describe, expect, it } from "vitest";

import {
  isUnder14,
  parseBgDate,
  toIsoDate,
  validateDisplayName,
  validateEmail,
  validateOrgName,
  validatePassword,
  validateUsername,
} from "./validators";

describe("validatePassword (≥10, a letter and a digit)", () => {
  it("too short", () => expect(validatePassword("short1")).not.toBeNull());
  it("no digit", () => expect(validatePassword("abcdefghij")).not.toBeNull());
  it("no letter", () => expect(validatePassword("1234567890")).not.toBeNull());
  it("ok", () => expect(validatePassword("abcdefghi1")).toBeNull());
  it("Cyrillic letters count", () => expect(validatePassword("паролапаро1")).toBeNull());
});

describe("validateUsername (DB regex)", () => {
  it("too short", () => expect(validateUsername("ab")).not.toBeNull());
  it("Cyrillic", () => expect(validateUsername("иван")).not.toBeNull());
  it("space", () => expect(validateUsername("ivan p")).not.toBeNull());
  it("31 chars", () => expect(validateUsername("a".repeat(31))).not.toBeNull());
  it("wildcards", () => {
    for (const bad of ["*", "a*b", "%", "a%"]) expect(validateUsername(bad)).not.toBeNull();
  });
  it("ok", () => expect(validateUsername("ivan_99")).toBeNull());
  it("dots and dashes", () => expect(validateUsername("i.v-an")).toBeNull());
});

describe("validateEmail", () => {
  it("empty", () => expect(validateEmail("")).not.toBeNull());
  it("no @", () => expect(validateEmail("ivan.example.com")).not.toBeNull());
  it("ok with spaces", () => expect(validateEmail("  ivan@example.com ")).toBeNull());
});

describe("length limits match the DB", () => {
  it("display name required", () => expect(validateDisplayName("  ")).not.toBeNull());
  it("display name 80 ok", () => expect(validateDisplayName("а".repeat(80))).toBeNull());
  it("display name 81", () => expect(validateDisplayName("а".repeat(81))).not.toBeNull());
  it("org name 120 ok", () => expect(validateOrgName("а".repeat(120))).toBeNull());
  it("org name 121", () => expect(validateOrgName("а".repeat(121))).not.toBeNull());
});

describe("isUnder14", () => {
  it("one day before the 14th birthday", () =>
    expect(isUnder14(new Date(2013, 10, 28), new Date(2027, 10, 27))).toBe(true));
  it("on the 14th birthday", () =>
    expect(isUnder14(new Date(2013, 10, 27), new Date(2027, 10, 27))).toBe(false));
  it("born 29 Feb, non-leap year", () =>
    expect(isUnder14(new Date(2012, 1, 29), new Date(2026, 2, 1))).toBe(false));
});

describe("parseBgDate", () => {
  const today = new Date(2026, 10, 28);
  it("DD.MM.YYYY", () => expect(parseBgDate("01.05.2008", today)).toEqual(new Date(2008, 4, 1)));
  it("D.M.YYYY", () => expect(parseBgDate("1.5.2008", today)).toEqual(new Date(2008, 4, 1)));
  it("impossible date", () => expect(parseBgDate("31.02.2008", today)).toBeNull());
  it("ISO is not accepted", () => expect(parseBgDate("2008-05-01", today)).toBeNull());
  it("before 1900", () => expect(parseBgDate("01.05.1899", today)).toBeNull());
  it("future", () => expect(parseBgDate("01.01.2030", today)).toBeNull());
  it("toIsoDate", () => expect(toIsoDate(new Date(2008, 4, 1))).toBe("2008-05-01"));
});
