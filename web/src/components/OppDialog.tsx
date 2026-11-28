// The organizer's form for a new item (from the calendar) or for editing one of
// their own (from the dashboard on /profile). Publishing needs a verified org;
// the database enforces that too, this only hides the option.
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { inputClass, useBusy } from "@/components/forms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import {
  OPP_TYPE_LABEL,
  OPP_TYPES,
  toLocalInput,
  type EditableOpp,
  type OppType,
} from "@/lib/opps";
import { useRefreshOpps, useTags } from "@/lib/queries";

type Props = {
  verified: boolean;
  /** Edit this item; leave out for a new one. */
  editId?: string | undefined;
  onClose: () => void;
};

export function OppDialog({ verified, editId, onClose }: Props) {
  const existing = useQuery({
    queryKey: ["oppEdit", editId],
    queryFn: () => api.opps.getForEdit(editId!),
    enabled: !!editId,
  });
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-[3px] border-ink bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heavy text-4xl">
            {editId ? "ПРОМЕНИ ОБЯВАТА" : "НОВА ОБЯВА"}
          </DialogTitle>
          <DialogDescription>
            {verified
              ? "Организацията ти е проверена — можеш да публикуваш."
              : "Докато организацията не е проверена, обявите остават чернови."}
          </DialogDescription>
        </DialogHeader>
        {!editId ? (
          <OppForm verified={verified} onClose={onClose} />
        ) : existing.isPending ? (
          <div className="h-64 animate-pulse bg-muted" aria-busy="true" />
        ) : existing.isError || !existing.data ? (
          <p role="alert">Обявата не се зареди или не е твоя.</p>
        ) : (
          <OppForm verified={verified} initial={existing.data} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function OppForm({
  verified,
  initial,
  onClose,
}: {
  verified: boolean;
  initial?: EditableOpp | undefined;
  onClose: () => void;
}) {
  const refresh = useRefreshOpps();
  const tags = useTags();
  const { busy, run } = useBusy();
  const [error, setError] = useState<string | null>(null);
  const [tagIds, setTagIds] = useState<number[]>(initial?.tagIds ?? []);

  function flip(id: number) {
    setTagIds((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const iso = (k: string) => (get(k) ? new Date(get(k)).toISOString() : null);
    if (!get("title")) return setError("Въведи заглавие.");
    if (get("title").length > 200) return setError("Заглавието е до 200 знака.");
    setError(null);
    const publish = d.get("publish") === "on";
    await run(async () => {
      const p = {
        title: get("title"),
        type: get("type") as OppType,
        city: get("city") || null,
        online: d.get("online") === "on",
        startsAt: iso("startsAt"),
        deadlineAt: iso("deadlineAt"),
        description: get("description"),
        externalUrl: get("externalUrl") || null,
        publish,
        tagIds,
      };
      if (initial) await api.opps.update(initial.id, p);
      else await api.opps.create(p);
      await refresh();
      toast.success(publish ? "Публикувано" : "Запазено като чернова");
      onClose();
    });
  }

  // The database lets only verified orgs save a published item, so an org that lost
  // verification (e.g. renamed) turns it back into a draft by saving.
  const canPublish = verified;
  const willUnpublish = !verified && initial?.status === "published";
  // Keep a type the form no longer offers (open_day, …) selectable for old items.
  const types =
    initial && !OPP_TYPES.includes(initial.type) ? [...OPP_TYPES, initial.type] : OPP_TYPES;

  return (
    <form noValidate className="space-y-4" onSubmit={(e) => void submit(e)}>
      <label className="block text-sm font-bold">
        Заглавие
        <input name="title" defaultValue={initial?.title} className={inputClass} />
      </label>
      <label className="block text-sm font-bold">
        Вид
        <select name="type" defaultValue={initial?.type ?? "competition"} className={inputClass}>
          {types.map((t) => (
            <option key={t} value={t}>
              {OPP_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">
          Начало
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.startsAt ?? null)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-bold">
          Краен срок
          <input
            name="deadlineAt"
            type="datetime-local"
            defaultValue={toLocalInput(initial?.deadlineAt ?? null)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm font-bold">
        Град
        <input name="city" defaultValue={initial?.city ?? ""} className={inputClass} />
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          name="online"
          type="checkbox"
          defaultChecked={initial?.online}
          className="h-5 w-5 accent-[var(--primary)]"
        />
        Онлайн
      </label>
      <label className="block text-sm font-bold">
        Линк за кандидатстване
        <input
          name="externalUrl"
          type="url"
          placeholder="https://"
          defaultValue={initial?.externalUrl ?? ""}
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-bold">
        Описание
        <textarea
          name="description"
          rows={4}
          defaultValue={initial?.description}
          className={inputClass}
        />
      </label>
      <fieldset>
        <legend className="text-sm font-bold">
          Тагове {tagIds.length > 0 && <span className="font-normal">({tagIds.length})</span>}
        </legend>
        {tags.isPending ? (
          <div className="mt-1 h-20 animate-pulse bg-muted" aria-busy="true" />
        ) : tags.isError ? (
          <p className="mt-1 text-sm">Таговете не се заредиха.</p>
        ) : (
          <div className="mt-1 flex max-h-40 flex-wrap gap-2 overflow-y-auto border-[3px] border-ink p-2">
            {(tags.data ?? []).map((t) => {
              const on = tagIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => flip(t.id)}
                  className={`border-2 border-ink px-2 py-0.5 text-sm font-bold ${on ? "bg-ink text-paper" : "bg-card"}`}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
        )}
      </fieldset>
      {canPublish && (
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            name="publish"
            type="checkbox"
            defaultChecked={initial ? initial.publish : false}
            className="h-5 w-5 accent-[var(--primary)]"
          />
          {initial ? "Публикувана" : "Публикувай веднага"}
        </label>
      )}
      {willUnpublish && (
        <p className="bg-accent p-2 text-sm font-bold">
          Организацията ти вече не е проверена — след запазване обявата става чернова.
        </p>
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
  );
}
