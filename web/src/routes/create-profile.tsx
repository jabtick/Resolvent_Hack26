import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useAccount } from "@/components/AccountProvider";
import { AuthPage, Field, inputClass, SubmitButton, useBusy } from "@/components/forms";
import { ORG_TYPE_LABEL, type AccountType, type OrgType } from "@/lib/auth";
import {
  isUnder14,
  parseBgDate,
  validateDisplayName,
  validateOrgName,
  validateUsername,
} from "@/lib/validators";

export const Route = createFileRoute("/create-profile")({
  head: () => ({
    meta: [{ title: "Твоят профил — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: CreateProfile,
});

type Errors = Partial<
  Record<"username" | "displayName" | "birth" | "orgName" | "orgType", string | null>
>;

function CreateProfile() {
  const { side, createProfile } = useAccount();
  const { busy, run } = useBusy();
  const [type, setType] = useState<AccountType>(side ?? "student");
  const [birth, setBirth] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const birthDate = parseBgDate(birth);
  const under14 = birthDate != null && isUnder14(birthDate, new Date());

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const username = String(d.get("username") ?? "").trim();
    const displayName = String(d.get("displayName") ?? "");
    const orgName = String(d.get("orgName") ?? "");
    const orgType = (String(d.get("orgType") ?? "") || null) as OrgType | null;
    const next: Errors = {
      username: validateUsername(username),
      displayName: validateDisplayName(displayName),
      birth: type === "student" && !birthDate ? "Въведи дата като 01.05.2008." : null,
      orgName: type === "organizer" ? validateOrgName(orgName) : null,
      orgType: type === "organizer" && !orgType ? "Избери вид." : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    await run(() =>
      createProfile({
        type,
        username,
        displayName,
        birthDate: type === "student" ? birthDate! : undefined,
        orgName: type === "organizer" ? orgName : undefined,
        orgType: type === "organizer" ? orgType! : undefined,
      }),
    );
  }

  return (
    <AuthPage title="ТВОЯТ ПРОФИЛ">
      <div className="mb-4 flex gap-2" role="radiogroup" aria-label="Тип акаунт">
        {(["student", "organizer"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            className={`border-[3px] border-ink px-3 py-1 font-heavy text-lg transition-colors ${type === t ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
          >
            {t === "student" ? "Ученик" : "Организатор"}
          </button>
        ))}
      </div>
      <form noValidate className="space-y-4" onSubmit={(e) => void submit(e)}>
        <Field
          label="Потребителско име"
          name="username"
          autoComplete="username"
          placeholder="напр. ivan_99"
          error={errors.username}
        />
        <Field label="Име" name="displayName" autoComplete="name" error={errors.displayName} />
        {type === "student" ? (
          <>
            <Field
              label="Дата на раждане (ДД.ММ.ГГГГ)"
              name="birth"
              inputMode="numeric"
              placeholder="01.05.2008"
              value={birth}
              onChange={(e) => setBirth(e.target.value)}
              error={errors.birth}
            />
            {under14 && (
              <p className="zine animate-in fade-in bg-accent p-3 text-sm text-accent-foreground">
                Профилът ти ще е скрит, докато родител не даде съгласие.
              </p>
            )}
          </>
        ) : (
          <>
            <Field label="Име на организацията" name="orgName" error={errors.orgName} />
            <label className="block text-sm font-bold">
              Вид организация
              <select name="orgType" defaultValue="" className={inputClass}>
                <option value="" disabled>
                  избери…
                </option>
                {(Object.keys(ORG_TYPE_LABEL) as OrgType[]).map((t) => (
                  <option key={t} value={t}>
                    {ORG_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              {errors.orgType && (
                <span className="mt-1 block text-sm font-normal text-destructive">
                  {errors.orgType}
                </span>
              )}
            </label>
            <p className="text-sm text-muted-foreground">
              Организаторите публикуват, след като ги проверим.
            </p>
          </>
        )}
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--primary)]"
          />
          <span>Приемам Условията за ползване и Политиката за личните данни</span>
        </label>
        <div className={terms ? "" : "pointer-events-none opacity-50"} aria-disabled={!terms}>
          <SubmitButton busy={busy || !terms}>СЪЗДАЙ ПРОФИЛ</SubmitButton>
        </div>
      </form>
    </AuthPage>
  );
}
