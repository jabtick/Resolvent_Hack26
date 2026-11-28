import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Megaphone, Rocket } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useAccount } from "@/components/AccountProvider";
import { Field, SubmitButton, TextLink, useBusy } from "@/components/forms";
import { Nav } from "@/components/Nav";
import type { AccountType } from "@/lib/auth";
import { validateEmail, validatePassword } from "@/lib/validators";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Регистрация — NO FUTURE?" },
      { name: "description", content: "Ученик или организатор — избери страна и направи профил." },
    ],
  }),
  component: Join,
});

const SIDES = [
  {
    id: "student",
    title: "УЧЕНИК",
    sub: "Намери възможности. Изгради си бъдещето.",
    icon: Rocket,
    cls: "bg-secondary text-secondary-foreground tilt-l",
  },
  {
    id: "organizer",
    title: "ОРГАНИЗАТОР",
    sub: "Публикувай събития. Намери следващия си екип.",
    icon: Megaphone,
    cls: "bg-primary text-primary-foreground tilt-r",
  },
] as const;

function Join() {
  const { side, setSide, signUp } = useAccount();
  const navigate = useNavigate();
  const { busy, run } = useBusy();
  const [picked, setPicked] = useState<AccountType | null>(side);
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const email = String(d.get("email") ?? "");
    const password = String(d.get("password") ?? "");
    const next = { email: validateEmail(email), password: validatePassword(password) };
    setErrors(next);
    if (next.email || next.password) return;
    await run(async () => {
      setSide(picked);
      await signUp(email, password);
      await navigate({ to: "/code" });
    });
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        {!picked ? (
          <>
            <h1 className="text-center font-heavy text-5xl md:text-6xl">
              НА КОЯ СТРАНА <span className="ransom">СИ?</span>
            </h1>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {SIDES.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setPicked(s.id)}
                  className={`zine jitter animate-in fade-in slide-in-from-bottom-4 fill-mode-both flex flex-col items-start p-8 text-left duration-500 hover:-translate-y-1 ${s.cls}`}
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <s.icon className="size-12" />
                  <span className="mt-3 font-display text-4xl">{s.title}</span>
                  <span className="mt-1">{s.sub}</span>
                </button>
              ))}
            </div>
            <p className="mt-8 text-center">
              <TextLink onClick={() => void navigate({ to: "/login" })}>Имаш акаунт? Влез</TextLink>
            </p>
          </>
        ) : (
          <div className="mx-auto max-w-md">
            <button
              onClick={() => setPicked(null)}
              className="mb-4 inline-flex items-center gap-2 font-bold transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Смени страната
            </button>
            <div className="zine animate-in fade-in zoom-in-95 bg-card p-6 duration-300">
              <span className="ransom text-xl">
                {picked === "student" ? "УЧЕНИК" : "ОРГАНИЗАТОР"}
              </span>
              <form noValidate className="mt-5 space-y-4" onSubmit={(e) => void submit(e)}>
                <Field
                  label="Имейл"
                  name="email"
                  type="email"
                  autoComplete="email"
                  error={errors.email}
                />
                <Field
                  label="Парола"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  error={errors.password}
                />
                <p className="text-xs text-muted-foreground">Поне 10 знака, с букви и цифри.</p>
                <SubmitButton busy={busy}>ДАВАЙ</SubmitButton>
              </form>
              <p className="mt-4 text-center text-sm">
                <TextLink onClick={() => void navigate({ to: "/login" })}>
                  Имаш акаунт? Влез
                </TextLink>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
