// Form checks. Each returns a Bulgarian message, or null when the value is ok.
// The rules match the server: supabase/config.toml (password) and the checks
// in the profiles_feed migration (username, display name, org name).

const usernameRe = /^[A-Za-z0-9_.-]{3,30}$/;
const letterRe = /\p{L}/u;
const digitRe = /\d/;
const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validatePassword(v: string): string | null {
  if (v.length < 10) return "Паролата трябва да е поне 10 знака.";
  if (!letterRe.test(v) || !digitRe.test(v)) {
    return "Паролата трябва да има поне една буква и една цифра.";
  }
  return null;
}

export function validateUsername(v: string): string | null {
  return usernameRe.test(v) ? null : "3–30 знака: латински букви, цифри, _ . -";
}

export function validateEmail(v: string): string | null {
  return emailRe.test(v.trim()) ? null : "Въведи валиден имейл.";
}

function required(v: string, max: number): string | null {
  if (v.trim().length === 0) return "Попълни полето.";
  if (v.trim().length > max) return `До ${max} знака.`;
  return null;
}

/** profiles.display_name: 1–80 characters. */
export const validateDisplayName = (v: string) => required(v, 80);

/** organizer_details.org_name: 1–120 characters. */
export const validateOrgName = (v: string) => required(v, 120);

/** True until the day of the 14th birthday (needs parental consent, ЗЗЛД). */
export function isUnder14(birth: Date, today: Date): boolean {
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age--;
  return age < 14;
}

/** Reads "01.05.2008" or "1.5.2008". Null for impossible, pre-1900 or future dates. */
export function parseBgDate(v: string, today = new Date()): Date | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(v.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  if (y < 1900 || date > today) return null;
  return date;
}

/** Date → "YYYY-MM-DD" in local time (for a Postgres `date`). */
export function toIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
