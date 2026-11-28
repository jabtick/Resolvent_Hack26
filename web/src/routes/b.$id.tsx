// The public page a shared badge link points at. It is rendered on the server
// so Messenger, Facebook, LinkedIn and Viber can read the Open Graph tags and
// show a name and a description instead of a bare URL.
//
// Only public badges load: the public_badges view leaves out private profiles,
// under-14s without parental consent and hidden badges, so a minor's badge never
// leaks through a link.
//
// TODO(Bogi): add og:image. It has to be drawn on the server (lib/badge-image.ts
// is canvas, so browser-only) - a Netlify function or a Supabase Edge Function
// rendering the same layout.
import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, ShieldCheck } from "lucide-react";

import { Nav } from "@/components/Nav";
import { ShareBadge } from "@/components/ShareBadge";
import { PLACE_LABEL, type Badge } from "@/lib/achievements";
import { api } from "@/lib/api";
import { badgeShareTitle } from "@/lib/share";

export const Route = createFileRoute("/b/$id")({
  loader: async ({ params }) => (await api.achievements.getPublic(params.id))?.badge ?? null,
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Значката я няма — NO FUTURE?" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${badgeShareTitle(loaderData)} — NO FUTURE?`;
    const description = `${loaderData.org} · ${loaderData.date}. Потвърдено от организатора.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: PublicBadge,
});

const PLACE_BG: Record<number, string> = {
  1: "bg-accent",
  2: "bg-secondary",
  3: "bg-primary text-primary-foreground",
};

function PublicBadge() {
  const b = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-xl px-4 py-10">
        {!b ? (
          <div className="zine bg-card p-8 text-center">
            <p className="font-display text-4xl">ЗНАЧКАТА Я НЯМА</p>
            <p className="font-hand text-2xl">линкът е стар или значката е скрита.</p>
            <Link
              to="/"
              className="zine-pink jitter mt-4 inline-block bg-ink px-4 py-2 font-heavy text-xl text-paper"
            >
              КЪМ ФИЙДА
            </Link>
          </div>
        ) : (
          <>
            <BadgeHero b={b} />
            <p className="mt-8 text-center font-hand text-2xl">
              Значките в NO FUTURE? се раздават само от организатора на събитието.
            </p>
            <p className="mt-4 text-center">
              <Link
                to="/"
                className="zine-pink jitter inline-block bg-ink px-6 py-3 font-heavy text-2xl text-paper"
              >
                ВИЖ ВЪЗМОЖНОСТИТЕ
              </Link>
            </p>
          </>
        )}
      </main>
    </div>
  );
}

function BadgeHero({ b }: { b: Badge }) {
  const tone = b.place ? PLACE_BG[b.place] : "bg-card";
  return (
    <article className={b.place === 1 ? "zine-pink" : "zine"}>
      <div className={`${tone} flex flex-col items-center gap-4 p-10`}>
        <div className="flex size-32 items-center justify-center rounded-full border-4 border-ink bg-card text-ink">
          {b.place ? (
            <span className="font-display text-7xl">{b.place}</span>
          ) : (
            <Award className="size-16" />
          )}
        </div>
        <p className="-rotate-3 font-heavy text-4xl">
          {b.place ? PLACE_LABEL[b.place] : "УЧАСТНИК"}
        </p>
      </div>
      <div className="border-t-[3px] border-ink bg-card p-6">
        <h1 className="font-heavy text-4xl leading-tight">{b.event}</h1>
        <p className="mt-2 text-muted-foreground">
          {b.org} · {b.date}
        </p>
        <p className="mt-4 flex items-center gap-2 border-t border-dashed border-ink pt-4 font-bold">
          <ShieldCheck className="size-5 text-primary" />
          Потвърдено от организатора
        </p>
      </div>
      <ShareBadge b={b} />
    </article>
  );
}
