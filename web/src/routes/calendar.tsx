import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { endOfDay, isSameDay, isSameMonth, startOfDay, startOfMonth } from "date-fns";
import { bg as bgLocale } from "date-fns/locale";
import { Building2, CalendarDays, MapPin, Plus } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useAccount } from "@/components/AccountProvider";
import { Nav } from "@/components/Nav";
import { OppDialog } from "@/components/OppDialog";
import { Calendar } from "@/components/ui/calendar";
import {
  daysOf,
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

/**
 * One card per event, with its deadline and the days it runs together. `end` is the end of
 * the event (its start when it has no end), so a three-day event shows on all three days.
 */
type Entry = { opp: Opp; deadline: Date | null; start: Date | null; end: Date | null };
/** An entry in the list, sorted by `at`; `kind` is which of its dates put it there. */
type Row = Entry & { at: Date; kind: "deadline" | "run" };

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

  // Normally every day an event runs is marked (or its deadline if it has no start).
  // While an event is hovered, only that event's period is underlined.
  const hoveredPeriod = hovered ? periodOf(hovered) : null;
  const marked = useMemo(() => markDates(feed.data ?? []), [feed.data]);

  const entries = useMemo<Entry[]>(
    () =>
      (feed.data ?? [])
        .filter((o) => o.deadlineAt || o.startsAt)
        .map((o) => {
          const p = o.startsAt ? periodOf(o) : null;
          return {
            opp: o,
            deadline: o.deadlineAt ? new Date(o.deadlineAt) : null,
            start: p?.from ?? null,
            end: p?.to ?? null,
          };
        }),
    [feed.data],
  );

  const today = startOfDay(new Date());
  /** The dates of `e` that belong in the list from `from` to `to`, as candidate rows. */
  const hits = (e: Entry, from: Date, to: Date): Row[] => {
    const out: Row[] = [];
    if (e.deadline && e.deadline >= from && e.deadline <= to)
      out.push({ ...e, at: e.deadline, kind: "deadline" });
    // A running event counts on every day it overlaps; it sorts by its start, or by the
    // start of the range when it began earlier (an ongoing event goes to the top).
    if (e.start && e.end && e.start <= to && endOfDay(e.end) >= from)
      out.push({ ...e, at: e.start < from ? from : e.start, kind: "run" });
    return out;
  };
  const FAR = new Date(8640000000000000);
  const visible: Row[] = entries
    .flatMap((e): Row[] => {
      const rows =
        view === "day"
          ? hits(e, startOfDay(date), endOfDay(date))
          : view === "saved"
            ? saved.data?.has(e.opp.id)
              ? hits(e, today, FAR).length
                ? hits(e, today, FAR)
                : hits(e, new Date(0), FAR) // all in the past: still listed
              : []
            : hits(e, today, FAR);
      // The earliest matching date decides where the card goes.
      const first = rows.sort((a, b) => a.at.getTime() - b.at.getTime())[0];
      return first ? [first] : [];
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());

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
                {entries.filter((e) => e.deadline).length} СРОКА
              </p>
              <p className="text-sm text-muted-foreground">
                {entries.filter((e) => e.start).length} събития с начална дата
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
                    key={e.opp.id}
                    className={`zine animate-in fade-in slide-in-from-bottom-2 fill-mode-both bg-card p-5 transition-colors ${hovered?.id === e.opp.id ? "outline outline-[3px] outline-primary" : ""}`}
                    style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                    onMouseEnter={() => hoverStart(e.opp)}
                    onMouseLeave={hoverEnd}
                    onFocus={() => hoverStart(e.opp)}
                    onBlur={hoverEnd}
                  >
                    <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-heavy text-xl">
                      {(
                        [
                          ["deadline", e.deadline, e.deadline],
                          ["run", e.start, e.end],
                        ] as const
                      ).map(([kind, from, to]) => {
                        if (!from || !to) return null;
                        const multiDay = !isSameDay(from, to);
                        const text =
                          kind === "deadline"
                            ? `КРАЕН СРОК ${when(from)}`
                            : multiDay
                              ? `${when(from)} – ${when(to)}`
                              : `НАЧАЛО ${when(from)}`;
                        // "ДЕН 2 ОТ 3" when a picked day falls inside a multi-day event.
                        const days = multiDay ? daysOf({ from, to }) : [];
                        const nth = days.findIndex((d) => isSameDay(d, date)) + 1;
                        return (
                          <span
                            key={kind}
                            // The date that placed the card here stands out; past dates fade.
                            className={
                              kind === e.kind
                                ? "text-primary"
                                : to < today
                                  ? "text-muted-foreground line-through"
                                  : "text-muted-foreground"
                            }
                          >
                            {text}
                            {view === "day" && kind === e.kind && nth > 0 && (
                              <>
                                {" "}
                                · ДЕН {nth} ОТ {days.length}
                              </>
                            )}
                          </span>
                        );
                      })}
                      <span className="text-muted-foreground">· {OPP_TYPE_LABEL[e.opp.type]}</span>
                      {((e.deadline && isSameDay(e.deadline, today)) ||
                        (e.start && e.end && e.start <= endOfDay(today) && e.end >= today)) && (
                        <span className="ransom">ДНЕС</span>
                      )}
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
          <OppDialog
            verified={me.data?.organizer?.verificationStatus === "verified"}
            onClose={() => setAdding(false)}
          />
        )}
      </main>
    </div>
  );
}
