import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useAccount } from "@/components/AccountProvider";
import { AuthPage, Field, SubmitButton, TextLink, useBusy } from "@/components/forms";
import { validateEmail, validatePassword } from "@/lib/validators";

export const Route = createFileRoute("/forgot")({
  head: () => ({ meta: [{ title: "Нова парола — NO FUTURE?" }] }),
  component: Forgot,
});

function Forgot() {
  const { sendPasswordReset, resetPassword } = useAccount();
  const navigate = useNavigate();
  const { busy, run } = useBusy();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string | null;
    code?: string | null;
    password?: string | null;
  }>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    if (!sent) {
      const err = validateEmail(email);
      setErrors({ email: err });
      if (err) return;
      await run(async () => {
        await sendPasswordReset(email);
        setSent(true);
      });
      return;
    }
    const code = String(d.get("code") ?? "").trim();
    const password = String(d.get("password") ?? "");
    const next = {
      code: /^\d{6,8}$/.test(code) ? null : "Кодът е от 6 до 8 цифри.",
      password: validatePassword(password),
    };
    setErrors(next);
    if (next.code || next.password) return;
    await run(() => resetPassword(email, code, password));
  }

  return (
    <AuthPage title="НОВА ПАРОЛА">
      <form noValidate className="space-y-4" onSubmit={(e) => void submit(e)}>
        <Field
          label="Имейл"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          readOnly={sent}
          error={errors.email}
        />
        {sent && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
            <p className="text-sm">Ако има акаунт с този имейл, пратихме код.</p>
            <Field
              label="Код"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              error={errors.code}
            />
            <Field
              label="Нова парола"
              name="password"
              type="password"
              autoComplete="new-password"
              error={errors.password}
            />
          </div>
        )}
        <SubmitButton busy={busy}>{sent ? "СМЕНИ ПАРОЛАТА" : "ПРАТИ КОД"}</SubmitButton>
      </form>
      <p className="mt-4 text-sm">
        <TextLink onClick={() => void navigate({ to: "/login" })}>Обратно към вход</TextLink>
      </p>
    </AuthPage>
  );
}
