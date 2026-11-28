import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/AccountProvider";
import { AuthPage, Field, SubmitButton, TextLink, useBusy } from "@/components/forms";

export const Route = createFileRoute("/code")({
  head: () => ({
    meta: [{ title: "Код от имейла — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: Code,
});

function Code() {
  const { pendingEmail, confirmCode, resendCode, startOver } = useAccount();
  const { busy, run } = useBusy();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    const err = /^\d{6,8}$/.test(code) ? null : "Кодът е от 6 до 8 цифри.";
    setError(err);
    if (err) return;
    await run(() => confirmCode(code));
  }

  return (
    <AuthPage title="ПРОВЕРИ ПОЩАТА">
      <p>
        Пратихме код на <b>{pendingEmail ?? "имейла ти"}</b>. Въведи го тук.
      </p>
      <form noValidate className="mt-4 space-y-4" onSubmit={(e) => void submit(e)}>
        <Field
          label="Код"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          className="mt-1 w-full border-[3px] border-ink bg-background p-3 text-center font-heavy text-4xl tracking-[0.5em] outline-none transition-shadow focus:shadow-brutal-pink"
          error={error}
        />
        <SubmitButton busy={busy}>ПОТВЪРДИ</SubmitButton>
      </form>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        <TextLink
          onClick={() =>
            void run(async () => {
              await resendCode();
              toast.success("Пратихме нов код.");
            })
          }
        >
          Прати нов код
        </TextLink>
        <TextLink onClick={() => void startOver()}>Започни отначало</TextLink>
      </div>
    </AuthPage>
  );
}
