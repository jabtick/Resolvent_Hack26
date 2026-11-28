// Everything the server can throw becomes one Bulgarian message for the screen.

/** Something the person should be told; `message` is shown as is. */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

const GENERIC = "Нещо се обърка. Опитай пак.";

type MaybeError = { code?: unknown; status?: unknown; message?: unknown; name?: unknown };

export function mapError(e: unknown): AppError {
  if (e instanceof AppError) return e;
  const err = (e ?? {}) as MaybeError;
  const code = typeof err.code === "string" ? err.code : "";
  const status = typeof err.status === "number" ? err.status : 0;
  const message = typeof err.message === "string" ? err.message : "";

  // PostgREST / Postgres
  switch (code) {
    case "23505":
      return new AppError("Това потребителско име е заето");
    case "23514":
    case "22001":
    case "23502":
      return new AppError("Някое поле е невалидно. Провери името и данните.");
    case "42501":
      return new AppError("Нямаш права за това.");
  }

  // Supabase Auth
  if (code === "otp_expired" || message.includes("expired or is invalid")) {
    return new AppError("Кодът е грешен или изтекъл.");
  }
  if (code.startsWith("over_") || (status === 429 && err.name !== "FunctionsHttpError")) {
    return new AppError("Изчакай минута и опитай пак.");
  }
  switch (code) {
    case "invalid_credentials":
      return new AppError("Грешен имейл или парола.");
    case "email_not_confirmed":
      return new AppError("Имейлът още не е потвърден. Въведи кода от писмото.");
    case "user_already_exists":
    case "email_exists":
      return new AppError("Вече има акаунт с този имейл. Влез.");
    case "weak_password":
      return new AppError("Паролата е твърде слаба: поне 10 знака, букви и цифри.");
    case "same_password":
      return new AppError("Новата парола трябва да е различна от старата. Поискай нов код.");
    case "reauthentication_needed":
      return new AppError("Влез отново и опитай пак.");
  }

  // Edge Functions
  if (err.name === "FunctionsHttpError" && status === 429) {
    return new AppError("Твърде много опити. Опитай по-късно.");
  }
  return new AppError(GENERIC);
}
