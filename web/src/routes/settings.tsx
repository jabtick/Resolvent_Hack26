import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { useAccount } from "@/components/AccountProvider";
import { useBusy } from "@/components/forms";
import { Nav } from "@/components/Nav";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ACCOUNT_TYPE_LABEL } from "@/lib/auth";
import { useMyProfile } from "@/lib/queries";
import { THEMES, useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Настройки — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [theme, setTheme] = useTheme();
  const { signOut } = useAccount();
  const me = useMyProfile();
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <h1 className="font-heavy text-6xl">НАСТРОЙКИ</h1>
        <section className="zine bg-card p-5">
          <h2 className="mb-3 font-heavy text-3xl">
            <span className="ransom">ВИЗИЯ</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`jitter border-[3px] border-ink py-4 font-heavy text-2xl transition-colors ${theme === t.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </section>
        <section className="zine bg-card p-5">
          <h2 className="mb-3 font-heavy text-3xl">
            <span className="ransom">АКАУНТ</span>
          </h2>
          <p className="text-sm">
            Тип акаунт: <b>{me.data ? ACCOUNT_TYPE_LABEL[me.data.type] : "…"}</b>
          </p>
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              onClick={() => void signOut()}
              className="zine jitter bg-card px-4 py-2 font-heavy text-xl"
            >
              ИЗХОД
            </button>
            <button
              onClick={() => setDeleting(true)}
              className="border-[3px] border-destructive px-4 py-2 font-heavy text-xl text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
            >
              ИЗТРИЙ АКАУНТА
            </button>
          </div>
        </section>
        {deleting && <DeleteDialog onClose={() => setDeleting(false)} />}
      </main>
    </div>
  );
}

/** Deleting is forever, so it asks for the word ИЗТРИЙ. */
function DeleteDialog({ onClose }: { onClose: () => void }) {
  const { deleteAccount } = useAccount();
  const navigate = useNavigate();
  const { busy, run } = useBusy();
  const [word, setWord] = useState("");
  const ok = word.trim() === "ИЗТРИЙ";
  return (
    <Dialog open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="border-[3px] border-ink bg-card">
        <DialogHeader>
          <DialogTitle className="font-heavy text-3xl">ИЗТРИВАНЕ НА АКАУНТА</DialogTitle>
          <DialogDescription>
            Профилът, постиженията и всичко, което си запазил(а), се изтриват завинаги. Това не може
            да се върне.
          </DialogDescription>
        </DialogHeader>
        <label className="block text-sm font-bold">
          Напиши ИЗТРИЙ, за да потвърдиш:
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="mt-1 w-full border-[3px] border-ink bg-background p-3 outline-none"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="border-[3px] border-ink px-4 py-2 font-heavy text-lg"
          >
            ОТКАЗ
          </button>
          <button
            disabled={!ok || busy}
            onClick={() =>
              void run(async () => {
                await deleteAccount();
                await navigate({ to: "/" });
              })
            }
            className="bg-destructive px-4 py-2 font-heavy text-lg text-destructive-foreground transition-opacity disabled:opacity-40"
          >
            {busy ? "ИЗТРИВАМ…" : "ИЗТРИЙ ЗАВИНАГИ"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
