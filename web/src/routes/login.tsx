import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { useAccount } from "@/components/AccountProvider";
import { AuthPage, Field, SubmitButton, TextLink, useBusy } from "@/components/forms";
import { validateEmail } from "@/lib/validators";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Вход — NO FUTURE?" }] }),
  component: Login,
});

function Login() {
  const { signIn } = useAccount();
  const navigate = useNavigate();
  const { busy, run } = useBusy();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const email = String(d.get("email") ?? "");
    const err = validateEmail(email);
    setError(err);
    if (err) return;
    // Where to go next is decided by the account state (AuthGate).
    await run(() => signIn(email, String(d.get("password") ?? "")));
  }

  return (
    <AuthPage title="ВХОД">
      <form noValidate className="space-y-4" onSubmit={(e) => void submit(e)}>
        <Field label="Имейл" name="email" type="email" autoComplete="email" error={error} />
        <Field label="Парола" name="password" type="password" autoComplete="current-password" />
        <SubmitButton busy={busy}>ВЛИЗАМ</SubmitButton>
      </form>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <TextLink onClick={() => void navigate({ to: "/forgot" })}>Забравена парола?</TextLink>
        <TextLink onClick={() => void navigate({ to: "/join" })}>
          Нямаш акаунт? Регистрация
        </TextLink>
      </div>
    </AuthPage>
  );
}
