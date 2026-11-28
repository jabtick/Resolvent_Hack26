import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Hourglass } from "lucide-react";
import { toast } from "sonner";

import { BadgeCard } from "@/components/BadgeCard";
import { Nav } from "@/components/Nav";
import { api } from "@/lib/api";
import { badgeStats } from "@/lib/achievements";
import { useMyBadges } from "@/lib/queries";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [{ title: "Значки — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: Achievements,
});

function Achievements() {
  const mine = useMyBadges();
  const cache = useQueryClient();
  const badges = mine.data ?? [];
  const stats = badgeStats(badges);

  async function setHidden(id: string, hidden: boolean) {
    try {
      await api.achievements.setHidden(id, hidden);
      await cache.invalidateQueries({ queryKey: ["badges"] });
      toast.success(hidden ? "Значката е скрита от публичния ти профил." : "Значката се вижда.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Нещо се обърка.");
    }
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-hand text-2xl text-primary">доказателства, не обещания</p>
        <h1 className="mb-6 font-heavy text-6xl">
          ТВОИТЕ <span className="ransom">ЗНАЧКИ</span>
        </h1>
        {mine.isError ? (
          <div className="zine bg-card p-6" role="alert">
            <p>Значките не се заредиха.</p>
            <button
              onClick={() => void mine.refetch()}
              className="zine-pink jitter mt-3 bg-ink px-4 py-2 font-heavy text-xl text-paper"
            >
              ПАК
            </button>
          </div>
        ) : mine.isPending ? (
          <div className="zine h-48 animate-pulse bg-muted" aria-busy="true" />
        ) : badges.length === 0 ? (
          <div className="zine bg-card p-8 text-center">
            <p className="font-display text-4xl">ОЩЕ НЯМАШ ЗНАЧКИ</p>
            <p className="font-hand text-2xl">
              участвай в състезание — значката идва, щом организаторът качи резултатите
            </p>
            <Link
              to="/"
              className="zine-pink jitter mt-4 inline-block bg-ink px-4 py-2 font-heavy text-xl text-paper"
            >
              КЪМ ФИЙДА
            </Link>
          </div>
        ) : (
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
                <BadgeCard key={b.id} b={b} i={i} onToggleHidden={(h) => void setHidden(b.id, h)} />
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
