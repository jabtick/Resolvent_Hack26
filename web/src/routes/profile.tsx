import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Share2, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { inputClass, useBusy } from "@/components/forms";
import { Nav } from "@/components/Nav";
import { OppDialog } from "@/components/OppDialog";
import { ProfileHeader, Section } from "@/components/ProfileHeader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { ACCOUNT_TYPE_LABEL, ORG_TYPE_LABEL } from "@/lib/auth";
import { publicProfileUrl, type MyProfile, type ProfilePatch } from "@/lib/profiles";
import type { OppStat } from "@/lib/opps";
import { useMyProfile, useMyStats, useRefreshOpps } from "@/lib/queries";
import { isUnder14, validateDisplayName, validateOrgName } from "@/lib/validators";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "Моят профил — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: Profile,
});

const VERIFICATION: Record<string, string> = {
  verified: "Проверена организация — можеш да публикуваш.",
  rejected: "Проверката е отказана. Пиши ни.",
  pending: "Чака проверка. Дотогава обявите ти са чернови.",
};

function Profile() {
  const me = useMyProfile();
  const cache = useQueryClient();
  const [editing, setEditing] = useState(false);

  async function update(p: ProfilePatch, okMsg?: string) {
    try {
      await api.profiles.updateMine(p);
      await cache.invalidateQueries({ queryKey: ["me"] });
      if (okMsg) toast.success(okMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Нещо се обърка.");
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {me.isPending ? (
          <div className="zine h-72 animate-pulse bg-muted" aria-busy="true" />
        ) : me.isError || !me.data ? (
          <div className="zine bg-card p-6" role="alert">
            <p>Профилът не се зареди.</p>
            <button
              onClick={() => void me.refetch()}
              className="zine-pink jitter mt-3 bg-ink px-4 py-2 font-heavy text-xl text-paper"
            >
              ПАК
            </button>
          </div>
        ) : (
          <Body me={me.data} onEdit={() => setEditing(true)} onUpdate={update} />
        )}
        {me.data && editing && (
          <EditDialog
            me={me.data}
            onClose={() => setEditing(false)}
            onSave={async (p) => {
              await update(p, "Профилът е запазен");
              setEditing(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

function Body({
  me,
  onEdit,
  onUpdate,
}: {
  me: MyProfile;
  onEdit: () => void;
  onUpdate: (p: ProfilePatch) => Promise<void>;
}) {
  const s = me.student;
  const o = me.organizer;
  const cache = useQueryClient();
  const [avatarBusy, setAvatarBusy] = useState(false);

  async function avatar(action: () => Promise<void>, okMsg: string) {
    setAvatarBusy(true);
    try {
      await action();
      await cache.invalidateQueries({ queryKey: ["me"] });
      toast.success(okMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Нещо се обърка.");
    } finally {
      setAvatarBusy(false);
    }
  }

  const hiddenForAge = s != null && isUnder14(s.birthDate, new Date()) && !s.consentGranted;
  const subtitle = [`@${me.username}`, ACCOUNT_TYPE_LABEL[me.type], s?.city]
    .filter(Boolean)
    .join(" · ");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicProfileUrl(me.username, window.location.origin));
      toast.success("Линкът е копиран.");
    } catch {
      toast.error("Браузърът не позволи копиране.");
    }
  }

  return (
    <>
      <ProfileHeader
        displayName={me.displayName}
        subtitle={subtitle}
        avatarUrl={me.avatarUrl}
        avatarBusy={avatarBusy}
        onPickAvatar={(f) => void avatar(() => api.profiles.uploadAvatar(f), "Снимката е сменена.")}
        onRemoveAvatar={() => void avatar(() => api.profiles.removeAvatar(), "Снимката е махната.")}
        action={
          <button
            onClick={onEdit}
            className="zine jitter flex items-center gap-2 bg-secondary px-4 py-2 font-heavy text-xl text-secondary-foreground"
          >
            <Pencil className="h-5 w-5" />
            РЕДАКТИРАЙ
          </button>
        }
      >
        <div className="mt-5 flex flex-wrap items-center gap-4">
          {s && (
            <label className="flex items-center gap-3">
              <Switch
                checked={s.isPublic}
                onCheckedChange={(v) => void onUpdate({ isPublic: v })}
              />
              <span>{s.isPublic ? "Профилът ти е публичен" : "Профилът ти е скрит"}</span>
            </label>
          )}
          <button
            onClick={() => void copyLink()}
            className="jitter flex items-center gap-2 border-[3px] border-ink px-3 py-1 font-heavy text-lg"
          >
            <Share2 className="h-4 w-4" />
            КОПИРАЙ ЛИНК
          </button>
        </div>
        {hiddenForAge && (
          <p className="zine mt-4 bg-accent p-3 text-sm text-accent-foreground">
            Под 14 г.: профилът остава скрит, докато родител не даде съгласие.
          </p>
        )}
      </ProfileHeader>
      {s && (
        <>
          <Section title="ЗА МЕН" text={s.bio} />
          <Section
            title="УЧИЛИЩЕ"
            text={[s.school, s.grade ? `${s.grade} клас` : null].filter(Boolean).join(" · ")}
          />
        </>
      )}
      {o && (
        <>
          <Section
            title="ОРГАНИЗАЦИЯ"
            text={[o.orgName, ORG_TYPE_LABEL[o.orgType], o.website].filter(Boolean).join(" · ")}
          />
          <Section title="ПРОВЕРКА" text={VERIFICATION[o.verificationStatus]} />
          <Dashboard verified={o.verificationStatus === "verified"} />
        </>
      )}
    </>
  );
}

const STATUS_LABEL = { published: "публикувана", draft: "чернова", archived: "архив" } as const;

/** Organizer dashboard: own items and how many people saved each. */
function Dashboard({ verified }: { verified: boolean }) {
  const stats = useMyStats(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<OppStat | null>(null);
  const rows = stats.data ?? [];
  const published = rows.filter((r) => r.status === "published").length;
  const drafts = rows.filter((r) => r.status === "draft").length;
  const saves = rows.reduce((n, r) => n + r.saves, 0);
  const tiles = [
    { n: published, label: "публикувани", cls: "bg-accent" },
    { n: drafts, label: "чернови", cls: "bg-card" },
    { n: saves, label: "запазвания", cls: "bg-primary text-primary-foreground" },
  ];
  return (
    <section>
      <h2 className="mb-4 font-heavy text-3xl">
        <span className="ransom">ТАБЛО</span>
      </h2>
      {stats.isPending ? (
        <div className="zine h-32 animate-pulse bg-muted" aria-busy="true" />
      ) : stats.isError ? (
        <p className="zine bg-card p-4" role="alert">
          Таблото не се зареди.{" "}
          <button onClick={() => void stats.refetch()} className="font-bold underline">
            Пак
          </button>
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-4">
            {tiles.map((t) => (
              <div key={t.label} className={`zine flex items-end gap-2 px-5 py-3 ${t.cls}`}>
                <span className="font-heavy text-4xl leading-none">{t.n}</span>
                <span className="font-hand text-2xl leading-none">{t.label}</span>
              </div>
            ))}
          </div>
          {rows.length ? (
            <ul className="zine divide-y-[3px] divide-ink bg-card">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center gap-3 p-3">
                  <span className="min-w-0 flex-1 truncate font-bold">{r.title}</span>
                  <span className="border-2 border-ink px-2 text-xs font-bold uppercase">
                    {STATUS_LABEL[r.status]}
                  </span>
                  <span className="w-24 text-right font-heavy">{r.saves} запазв.</span>
                  <button
                    type="button"
                    onClick={() => setEditing(r.id)}
                    className="jitter border-2 border-ink p-1"
                    aria-label={`Промени „${r.title}“`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(r)}
                    className="jitter border-2 border-ink p-1 text-destructive"
                    aria-label={`Изтрий „${r.title}“`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="zine bg-card p-6 font-hand text-2xl">
              Още нямаш обяви.{" "}
              <Link to="/calendar" className="underline">
                Добави от календара
              </Link>
              .
            </p>
          )}
        </>
      )}
      {editing && (
        <OppDialog verified={verified} editId={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && <DeleteDialog opp={deleting} onClose={() => setDeleting(null)} />}
    </section>
  );
}

function DeleteDialog({ opp, onClose }: { opp: OppStat; onClose: () => void }) {
  const refresh = useRefreshOpps();
  const { busy, run } = useBusy();
  async function remove() {
    await run(async () => {
      await api.opps.remove(opp.id);
      await refresh();
      toast.success("Обявата е изтрита");
      onClose();
    });
  }
  return (
    <Dialog open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="border-[3px] border-ink bg-card">
        <DialogHeader>
          <DialogTitle className="font-heavy text-3xl">ИЗТРИЙ ОБЯВАТА?</DialogTitle>
          <DialogDescription>
            „{opp.title}“ изчезва от фийда завинаги
            {opp.saves > 0 ? `, и от запазените на ${opp.saves} души` : ""}. Това не може да се
            върне.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="border-[3px] border-ink px-4 py-2 font-heavy text-lg"
          >
            ОТКАЗ
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="bg-destructive px-4 py-2 font-heavy text-lg text-destructive-foreground"
          >
            {busy ? "ТРИЯ…" : "ИЗТРИЙ"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  me,
  onClose,
  onSave,
}: {
  me: MyProfile;
  onClose: () => void;
  onSave: (p: ProfilePatch) => Promise<void>;
}) {
  const { busy, run } = useBusy();
  const [error, setError] = useState<string | null>(null);
  const s = me.student;
  const o = me.organizer;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const name = get("displayName");
    const err = validateDisplayName(name) ?? (o ? validateOrgName(get("orgName")) : null);
    const gradeText = get("grade");
    const grade = gradeText ? Number(gradeText) : null;
    if (err) return setError(err);
    if (s && grade != null && !(Number.isInteger(grade) && grade >= 1 && grade <= 12))
      return setError("Класът е от 1 до 12.");
    if (s && get("bio").length > 1000) return setError("„За мен“ е до 1000 знака.");
    setError(null);
    const p: ProfilePatch = {};
    if (name !== me.displayName) p.displayName = name;
    if (s) {
      if (get("city") !== (s.city ?? "")) p.city = get("city");
      if (get("school") !== (s.school ?? "")) p.school = get("school");
      if (grade !== s.grade) p.grade = grade; // null clears it
      if (get("bio") !== (s.bio ?? "")) p.bio = get("bio");
    }
    if (o) {
      if (get("orgName") !== o.orgName) p.orgName = get("orgName");
      if (get("website") !== (o.website ?? "")) p.website = get("website");
    }
    await run(() => onSave(p));
  }

  const field = (
    name: string,
    label: string,
    value: string | number | null | undefined,
    extra = {},
  ) => (
    <label className="block text-sm font-bold">
      {label}
      <input name={name} defaultValue={value ?? ""} className={inputClass} {...extra} />
    </label>
  );

  return (
    <Dialog open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-[3px] border-ink bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heavy text-4xl">НАПРАВИ ГО СВОЙ</DialogTitle>
          <DialogDescription>Промени каквото искаш. Празно поле маха стойността.</DialogDescription>
        </DialogHeader>
        <form noValidate className="space-y-4" onSubmit={(e) => void submit(e)}>
          {field("displayName", "Име", me.displayName)}
          {s && (
            <>
              {field("city", "Град", s.city)}
              {field("school", "Училище", s.school)}
              {field("grade", "Клас (1–12)", s.grade, { inputMode: "numeric" })}
              <label className="block text-sm font-bold">
                За мен
                <textarea name="bio" rows={4} defaultValue={s.bio ?? ""} className={inputClass} />
              </label>
            </>
          )}
          {o && (
            <>
              {field("orgName", "Име на организацията", o.orgName)}
              {o.verificationStatus === "verified" && (
                <p className="text-sm text-muted-foreground">
                  Смяна на името пуска организацията на нова проверка.
                </p>
              )}
              {field("website", "Уебсайт", o.website)}
            </>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="border-[3px] border-ink px-4 py-2 font-heavy text-lg"
            >
              ОТКАЗ
            </button>
            <button
              type="submit"
              disabled={busy}
              className="zine-pink jitter bg-ink px-4 py-2 font-heavy text-lg text-paper"
            >
              {busy ? "ЗАПАЗВАМ…" : "ЗАПАЗИ"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
