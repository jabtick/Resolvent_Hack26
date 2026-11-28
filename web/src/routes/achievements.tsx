import { createFileRoute } from "@tanstack/react-router";
import { Award, Eye, EyeOff, Hourglass, ShieldCheck } from "lucide-react";

import { Nav } from "@/components/Nav";
import { type Badge, PLACE_LABEL, SAMPLE_BADGES, badgeStats } from "@/lib/achievements";
import { useMyBadges, useToggleBadgeHidden } from "@/lib/queries";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [{ title: "Значки — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: Achievements,
});

const TILT = ["tilt-l", "tilt-r", "", "tilt-r", "tilt-l", ""];

const PLACE_BG: Record<number, string> = {
  1: "bg-accent",
  2: "bg-secondary",
  3: "bg-primary text-primary-foreground",
};

function Achievements() {
  const mine = useMyBadges();
  const toggle = useToggleBadgeHidden();
  // Clearly marked samples until the first real badge arrives.
  const real = mine.data ?? [];
  const isSample = !real.length;
  const badges = isSample ? SAMPLE_BADGES : real;
  const stats = badgeStats(badges);
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-hand text-2xl text-primary">доказателства, не обещания</p>
        <h1 className="mb-6 font-heavy text-6xl">
          ТВОИТЕ <span className="ransom">ЗНАЧКИ</span>
        </h1>
        {mine.isPending ? (
          <p>Зареждам…</p>
        ) : mine.isError ? (
          <p className="mb-6 font-bold text-destructive">{mine.error.message}</p>
        ) : null}
        {isSample && !mine.isPending && (
          <p className="mb-6 inline-block bg-accent px-2 font-mono text-sm font-bold">
            ПРИМЕРНИ ДАННИ — истинските значки идват от резултатите на организаторите
          </p>
        )}
        {mine.isPending ? null : (
          <>
            <div className="mb-10 flex flex-wrap gap-4">
              <Stat n={stats.total} label="значки" className="bg-accent" />
              <Stat
                n={stats.podium}
                label="места на подиума"
                className="bg-primary text-primary-foreground"
              />
              <Stat n={stats.orgs} label="организатори" className="bg-secondary" />
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              {badges.map((b, i) => (
                <BadgeCard
                  key={b.id}
                  b={b}
                  i={i}
                  onToggleHidden={
                    b.isSample ? undefined : () => toggle.mutate({ badge: b, hidden: !b.hidden })
                  }
                />
              ))}
            </div>
          </>
        )}
        <div className="zine tape mt-14 flex items-center gap-4 bg-card p-6">
          <Hourglass className="size-8 shrink-0 text-primary" />
          <div>
            <p className="font-heavy text-2xl">ЧАКАМЕ РЕЗУЛТАТИ</p>
            <p className="text-sm">
              Организаторът качва резултатите след събитието и значката ти се появява тук.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Stat({ n, label, className }: { n: number; label: string; className: string }) {
  return (
    <div className={`zine flex items-end gap-2 px-5 py-3 ${className}`}>
      <span className="font-heavy text-4xl leading-none">{n}</span>
      <span className="font-hand text-2xl leading-none">{label}</span>
    </div>
  );
}

function BadgeCard({
  b,
  i,
  onToggleHidden,
}: {
  b: Badge;
  i: number;
  onToggleHidden?: (() => void) | undefined;
}) {
  const tone = b.place ? PLACE_BG[b.place] : "bg-card";
  return (
    <article
      className={`${b.place === 1 ? "zine-pink" : "zine"} ${TILT[i % TILT.length]} ${b.hidden ? "opacity-60" : ""} animate-in fade-in slide-in-from-bottom-4 fill-mode-both bg-card transition-transform duration-200 hover:-translate-y-1`}
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className={`${tone} flex flex-col items-center gap-3 p-6`}>
        <div className="flex size-22 items-center justify-center rounded-full border-4 border-ink bg-card text-ink">
          {b.place ? (
            <span className="font-display text-5xl">{b.place}</span>
          ) : (
            <Award className="size-11" />
          )}
        </div>
        <p className="-rotate-3 font-heavy text-2xl">
          {b.place ? PLACE_LABEL[b.place] : "УЧАСТНИК"}
        </p>
      </div>
      <div className="border-t-[3px] border-ink p-4">
        <h2 className="font-heavy text-2xl leading-tight">{b.event}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {b.org} · {b.date}
        </p>
        <p className="mt-3 flex items-center gap-2 border-t border-dashed border-ink pt-3 text-sm font-bold">
          <ShieldCheck className="size-4 text-primary" />
          Потвърдено от организатора
        </p>
        {onToggleHidden && (
          <button
            type="button"
            onClick={onToggleHidden}
            aria-pressed={b.hidden}
            className="mt-3 flex items-center gap-2 text-sm underline underline-offset-2"
          >
            {b.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {b.hidden ? "Скрита от публичния профил — покажи" : "Видима публично — скрий"}
          </button>
        )}
      </div>
    </article>
  );
}
