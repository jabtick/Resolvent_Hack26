import { describe, expect, it } from "vitest";

import { AppError, mapError } from "./errors";

const msg = (e: unknown) => mapError(e).message;

describe("mapError", () => {
  it("unique violation = username taken", () =>
    expect(msg({ code: "23505", message: "dup" })).toBe("Това потребителско име е заето"));
  it("check violation", () =>
    expect(msg({ code: "23514" })).toBe("Някое поле е невалидно. Провери името и данните."));
  it("no permission", () => expect(msg({ code: "42501" })).toBe("Нямаш права за това."));
  it("expired code", () =>
    expect(msg({ code: "otp_expired", status: 403 })).toBe("Кодът е грешен или изтекъл."));
  it("email rate limit", () =>
    expect(msg({ code: "over_email_send_rate_limit", status: 429 })).toBe(
      "Изчакай минута и опитай пак.",
    ));
  it("wrong credentials", () =>
    expect(msg({ code: "invalid_credentials", status: 400 })).toBe("Грешен имейл или парола."));
  it("already registered", () =>
    expect(msg({ code: "user_already_exists" })).toBe("Вече има акаунт с този имейл. Влез."));
  it("weak password", () =>
    expect(msg({ code: "weak_password" })).toBe(
      "Паролата е твърде слаба: поне 10 знака, букви и цифри.",
    ));
  it("same password", () =>
    expect(msg({ code: "same_password" })).toBe(
      "Новата парола трябва да е различна от старата. Поискай нов код.",
    ));
  it("edge function rate limit", () =>
    expect(msg({ name: "FunctionsHttpError", status: 429 })).toBe(
      "Твърде много опити. Опитай по-късно.",
    ));
  it("AppError passes through", () => expect(msg(new AppError("Въведи име."))).toBe("Въведи име."));
  it("anything else", () => expect(msg(new Error("boom"))).toBe("Нещо се обърка. Опитай пак."));
  it("null", () => expect(msg(null)).toBe("Нещо се обърка. Опитай пак."));
});
