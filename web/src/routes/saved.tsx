import { createFileRoute, Link } from "@tanstack/react-router";

import { Nav } from "@/components/Nav";
import { OppCard } from "@/components/OppCard";
import { useFeed, useSavedIds, useToggleSaved } from "@/lib/queries";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [{ title: "Запазени — NO FUTURE?" }, { name: "robots", content: "noindex" }],
  }),
  component: Saved,
});

function Saved() {
  const feed = useFeed();
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  const list = (feed.data ?? []).filter((o) => saved.data?.has(o.id));
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-8 font-heavy text-6xl">
          ЗАПАЗЕНИ <span className="font-hand text-4xl text-primary">за после</span>
        </h1>
        {feed.isPending || saved.isPending ? (
          <p>Зареждам…</p>
        ) : list.length ? (
          <div className="grid gap-10 md:grid-cols-2">
            {list.map((o, i) => (
              <OppCard
                key={o.id}
                o={o}
                i={i}
                saved
                onToggleSave={(n) => toggle.mutate({ opp: o, saved: n })}
              />
            ))}
          </div>
        ) : (
          <div className="zine bg-card p-8 text-center">
            <p className="font-display text-4xl">ОЩЕ НИЩО</p>
            <p className="font-hand text-2xl">натисни отметката на обява, която ти харесва</p>
            <Link
              to="/"
              className="zine-pink jitter mt-4 inline-block bg-ink px-4 py-2 font-heavy text-xl text-paper"
            >
              КЪМ ФИЙДА
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
