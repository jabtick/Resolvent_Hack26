// Shared bits for the auth and profile forms.
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";

import { Nav } from "@/components/Nav";

/** Narrow form card used by every auth page. */
export function AuthPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="zine animate-in fade-in slide-in-from-bottom-3 bg-card p-6 duration-500">
          <span className="ransom text-2xl">{title}</span>
          <div className="mt-5">{children}</div>
        </div>
      </main>
    </div>
  );
}

export const inputClass =
  "mt-1 w-full border-[3px] border-ink bg-background p-3 outline-none transition-shadow focus:shadow-brutal-pink";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | null | undefined;
};

/** Labelled input with an inline error under it. */
export function Field({ label, error, id, ...rest }: FieldProps) {
  const fid = id ?? `f-${label.replace(/\s+/g, "-")}`;
  return (
    <label htmlFor={fid} className="block text-sm font-bold">
      {label}
      <input
        id={fid}
        aria-invalid={!!error}
        aria-describedby={error ? `${fid}-err` : undefined}
        className={inputClass}
        {...rest}
      />
      {error && (
        <span id={`${fid}-err`} className="mt-1 block text-sm font-normal text-destructive">
          {error}
        </span>
      )}
    </label>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="zine-pink jitter h-12 w-full bg-ink font-heavy text-2xl text-paper transition-opacity disabled:opacity-60"
    >
      {busy ? "ЧАКАЙ…" : children}
    </button>
  );
}

export function TextLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-bold underline underline-offset-4 transition-colors hover:text-primary"
    >
      {children}
    </button>
  );
}

/** Runs a server action with a busy flag; errors become a toast. */
export function useBusy() {
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Нещо се обърка. Опитай пак.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}
