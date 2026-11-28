import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { endOfDay, isSameDay, isSameMonth, startOfDay, startOfMonth } from "date-fns";
import { bg as bgLocale } from "date-fns/locale";
import { Building2, CalendarDays, MapPin, Plus } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/AccountProvider";
import { inputClass, useBusy } from "@/components/forms";
import { Nav } from "@/components/Nav";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import {
  markDates,
  OPP_TYPE_LABEL,
  OPP_TYPES,
  periodOf,
  placeOf,
  type Opp,
  type OppType,
} from "@/lib/opps";
import { useFeed, useMyProfile, useSavedIds } from "@/lib/queries";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Календар — NO FUTURE?" },
      { name: "description", content: "Срокове и дати на състезания, стипендии и стажове." },
    ],
  }),
  component: CalendarPage,
});

type Entry = { opp: Opp; kind: "deadline" | "start"; at: Date };

const dayFmt = new Intl.DateTimeFormat("bg-BG", { weekday: "long", day: "numeric", month: "long" });
const dateOnly = new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "short" });
const timeOnly = new Intl.DateTimeFormat("bg-BG", { hour: "2-digit", minute: "2-digit" });
/** "11 дек." or "11 дек. 18:00" — no time for whole-day dates. */
const when = (d: Date) =>
  d.getHours() === 0 && d.getMinutes() === 0
    ? dateOnly.format(d)
    : `${dateOnly.format(d)} ${timeOnly.format(d)}`;

function CalendarPage() {
  const { status } = useAccount();
  const feed = useFeed();
  const saved = useSavedIds();
  const me = useMyProfile();
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState<"all" | "day" | "saved">("all");
  const [adding, setAdding] = useState(false);
  const isOrganizer = me.data?.type === "organizer";
  // The month the calendar shows; hovering an event in another month jumps there and back.
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [hovered, setHovered] = useState<Opp | null>(null);
  const monthBeforeHover = useRef<Date | null>(null);

  function hoverStart(o: Opp) {
    setHovered(o);
    const p = periodOf(o);
    if (p && !isSameMonth(p.from, month)) {
      monthBeforeHover.current ??= month;
      setMonth(startOfMonth(p.from));
    }
  }
  function hoverEnd() {
    setHovered(null);
    if (monthBeforeHover.current) {
      setMonth(monthBeforeHover.current);
      monthBeforeHover.current = null;
    }
  }

  // Normally one mark per event (its start, or its deadline if it has no start).
  // While an event is hovered, only that event's period is underlined.
  const hoveredPeriod = hovered ? periodOf(hovered) : null;
  const marked = useMemo(() => markDates(feed.data ?? []), [feed.data]);

  const entries = useMemo<Entry[]>(() => {
    const out: Entry[] = [];
    for (const o of feed.data ?? []) {
      if (o.deadlineAt) out.push({ opp: o, kind: "deadline", at: new Date(o.deadlineAt) });
      if (o.startsAt) out.push({ opp: o, kind: "start", at: new Date(o.startsAt) });
    }
    return out.sort((a, b) => a.at.getTime() - b.at.getTime());
  }, [feed.data]);

  const visible = entries.filter((e) =>
    view === "day"
      ? e.at >= startOfDay(date) && e.at <= endOfDay(date)
      : view === "saved"
        ? saved.data?.has(e.opp.id)
        : e.at >= startOfDay(new Date()),
  );

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-hand text-2xl text-primary">намери време за нещо хубаво</p>
            <h1 className="font-heavy text-6xl">
              ТВОЯТ <span className="ransom">КАЛЕНДАР</span>
            </h1>
          </div>
          {isOrganizer && (
            <button
              onClick={() => setAdding(true)}
              className="zine jitter flex h-12 items-center gap-2 bg-secondary px-4 font-heavy text-2xl text-secondary-foreground"
            >
              <Plus />
              ДОБАВИ ОБЯВА
            </button>
          )}
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="zine bg-card p-3">
              <Calendar
                mode="single"
                required
                locale={bgLocale}
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setView("day");
                }}
                month={month}
                onMonthChange={setMonth}
                className="w-full bg-card [--cell-size:2.5rem]"
                // No "today" marking: the calendar opens with today selected, so any today style
                // looked like a leftover selection after picking another day. Only the picked day
                // is highlighted; the list shows a "ДНЕС" badge for today's events.
                classNames={{ today: "" }}
                modifiers={
                  hovered
                    ? { marked: [], period: hoveredPeriod ? [hoveredPeriod] : [] }
                    : { marked, period: [] }
                }
                modifiersClassNames={{
                  marked: "border-b-[3px] border-primary font-bold",
                  period: "border-b-[5px] border-primary font-bold",
                }}
              />
            </div>
            <div className="border-l-[6px] border-primary pl-4">
              <p className="font-heavy text-3xl">
                {entries.filter((e) => e.kind === "deadline").length} СРОКА
              </p>
              <p className="text-sm text-muted-foreground">
                {entries.filter((e) => e.kind === "start").length} събития с начална дата
              </p>
            </div>
          </aside>

          <section className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink pb-3">
              <h2 className="font-heavy text-3xl">
                {view === "day"
                  ? dayFmt.format(date).toUpperCase()
                  : view === "saved"
                    ? "ЗАПАЗЕНИ"
                    : "ПРЕДСТОЯЩИ"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["all", "Предстоящи"],
                    ["day", "Избран ден"],
                    ...(status === "signedIn" ? ([["saved", "Запазени"]] as const) : []),
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`border-[3px] border-ink px-3 py-1 font-heavy text-lg transition-colors ${view === v ? "bg-secondary text-secondary-foreground" : "bg-card hover:bg-accent"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {feed.isPending ? (
              <p>Зареждам…</p>
            ) : feed.isError ? (
              <p role="alert">
                Календарът не се зареди.{" "}
                <button className="font-bold underline" onClick={() => void feed.refetch()}>
                  Пак
                </button>
              </p>
            ) : !visible.length ? (
              <div className="py-12 text-center">
                <CalendarDays className="mx-auto mb-4 h-10 w-10 text-primary" />
                <h3 className="font-heavy text-3xl">НИЩО ПЛАНИРАНО. ОЩЕ.</h3>
              </div>
            ) : (
              <div className="space-y-5">
                {visible.map((e, i) => (
                  <article
                    key={`${e.opp.id}-${e.kind}`}
                    className={`zine animate-in fade-in slide-in-from-bottom-2 fill-mode-both bg-card p-5 transition-colors ${hovered?.id === e.opp.id ? "outline outline-[3px] outline-primary" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    onMouseEnter={() => hoverStart(e.opp)}
                    onMouseLeave={hoverEnd}
                    onFocus={() => hoverStart(e.opp)}
                    onBlur={hoverEnd}
                  >
                    <p className="mb-2 font-heavy text-xl text-primary">
                      {when(e.at)} · {e.kind === "deadline" ? "КРАЕН СРОК" : "НАЧАЛО"} ·{" "}
                      {OPP_TYPE_LABEL[e.opp.type]}
                      {isSameDay(e.at, new Date()) && <span className="ransom ml-2">ДНЕС</span>}
                    </p>
                    <Link
                      to="/opp/$id"
                      params={{ id: e.opp.id }}
                      className="break-words font-heavy text-3xl transition-colors hover:text-primary"
                    >
                      {e.opp.title}
                    </Link>
                    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {e.opp.org}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {placeOf(e.opp)}
                      </span>
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        {adding && (
          <NewOppDialog
            verified={me.data?.organizer?.verificationStatus === "verified"}
            onClose={() => setAdding(false)}
          />
        )}
      </main>
    </div>
  );
}

function NewOppDialog({ verified, onClose }: { verified: boolean; onClose: () => void }) {
  const cache = useQueryClient();
  const { busy, run } = useBusy();
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const get = (k: string) => String(d.get(k) ?? "").trim();
    const iso = (k: string) => (get(k) ? new Date(get(k)).toISOString() : null);
    if (!get("title")) return setError("Въведи заглавие.");
    if (get("title").length > 200) return setError("Заглавието е до 200 знака.");
    setError(null);
    await run(async () => {
      await api.opps.create({
        title: get("title"),
        type: get("type") as OppType,
        city: get("city") || null,
        online: d.get("online") === "on",
        startsAt: iso("startsAt"),
        deadlineAt: iso("deadlineAt"),
        description: get("description"),
        externalUrl: get("externalUrl") || null,
        publish: d.get("publish") === "on",
      });
      await cache.invalidateQueries({ queryKey: ["feed"] });
      toast.success(d.get("publish") === "on" ? "Публикувано" : "Запазено като чернова");
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto border-[3px] border-ink bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-heavy text-4xl">НОВА ОБЯВА</DialogTitle>
          <DialogDescription>
            {verified
              ? "Организацията ти е проверена — можеш да публикуваш."
              : "Докато организацията не е проверена, обявите остават чернови."}
          </DialogDescription>
        </DialogHeader>
        <form noValidate className="space-y-4" onSubmit={(e) => void submit(e)}>
          <label className="block text-sm font-bold">
            Заглавие
            <input name="title" className={inputClass} />
          </label>
          <label className="block text-sm font-bold">
            Вид
            <select name="type" defaultValue="competition" className={inputClass}>
              {OPP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OPP_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-bold">
              Начало
              <input name="startsAt" type="datetime-local" className={inputClass} />
            </label>
            <label className="block text-sm font-bold">
              Краен срок
              <input name="deadlineAt" type="datetime-local" className={inputClass} />
            </label>
          </div>
          <label className="block text-sm font-bold">
            Град
            <input name="city" className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input name="online" type="checkbox" className="h-5 w-5 accent-[var(--primary)]" />
            Онлайн
          </label>
          <label className="block text-sm font-bold">
            Линк за кандидатстване
            <input name="externalUrl" type="url" placeholder="https://" className={inputClass} />
          </label>
          <label className="block text-sm font-bold">
            Описание
            <textarea name="description" rows={4} className={inputClass} />
          </label>
          {verified && (
            <label className="flex items-center gap-2 text-sm font-bold">
              <input name="publish" type="checkbox" className="h-5 w-5 accent-[var(--primary)]" />
              Публикувай веднага
            </label>
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
