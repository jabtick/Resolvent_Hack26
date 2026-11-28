import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck } from "lucide-react";

import { Nav } from "@/components/Nav";
import { OppCard } from "@/components/OppCard";
import { ProfileHeader, Section } from "@/components/ProfileHeader";
import { api } from "@/lib/api";
import { ORG_TYPE_LABEL } from "@/lib/auth";
import type { Opp } from "@/lib/opps";
import type { PublicOrganizer } from "@/lib/profiles";
import { useSavedIds, useToggleSaved } from "@/lib/queries";

export const Route = createFileRoute("/u/$username")({
  // Runs on the server: shared links show the name in Messenger, LinkedIn etc.
  loader: async ({ params }) => {
    const student = await api.profiles.loadPublic(params.username);
    if (student) return { kind: "student" as const, p: student };
    const o = await api.profiles.loadPublicOrganizer(params.username);
    if (!o) return null;
    return { kind: "organizer" as const, o, opps: await api.opps.listByOrganizer(o.profileId) };
  },
  head: ({ loaderData, params }) => ({
    meta:
      loaderData?.kind === "organizer"
        ? [
            { title: `${loaderData.o.orgName} — NO FUTURE?` },
            {
              name: "description",
              content: `${loaderData.o.orgName}: състезания, стипендии и стажове в NO FUTURE?`,
            },
            { property: "og:title", content: `${loaderData.o.orgName} — NO FUTURE?` },
            { property: "og:type", content: "profile" },
          ]
        : loaderData
          ? [
              { title: `${loaderData.p.displayName} (@${loaderData.p.username}) — NO FUTURE?` },
              {
                name: "description",
                content:
                  loaderData.p.bio?.slice(0, 160) ??
                  `Профилът на ${loaderData.p.displayName} в NO FUTURE?`,
              },
              { property: "og:title", content: `${loaderData.p.displayName} — NO FUTURE?` },
              {
                property: "og:description",
                content:
                  loaderData.p.bio?.slice(0, 160) ?? "Постижения, доказани от организаторите.",
              },
              { property: "og:type", content: "profile" },
            ]
          : [{ title: `@${params.username} — NO FUTURE?` }, { name: "robots", content: "noindex" }],
  }),
  errorComponent: LoadError,
  component: PublicProfile,
});

function PublicProfile() {
  const data = Route.useLoaderData();
  const p = data?.kind === "student" ? data.p : null;
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {data?.kind === "organizer" ? (
          <OrganizerPage o={data.o} opps={data.opps} />
        ) : !p ? (
          <div className="zine mx-auto max-w-md bg-card p-8 text-center">
            <p className="font-display text-4xl">НЯМА ТАКЪВ ПРОФИЛ</p>
            <p className="font-hand text-2xl">или профилът е скрит.</p>
            <Link
              to="/"
              className="zine-pink jitter mt-4 inline-block bg-ink px-4 py-2 font-heavy text-xl text-paper"
            >
              КЪМ ФИЙДА
            </Link>
          </div>
        ) : (
          <>
            <ProfileHeader displayName={p.displayName} subtitle={`@${p.username}`} />
            <Section title="ЗА МЕН" text={p.bio} />
            {p.school && <Section title="УЧИЛИЩЕ" text={p.school} />}
            {p.interests.length > 0 && (
              <section>
                <h2 className="mb-4 font-heavy text-3xl">
                  <span className="ransom">ИНТЕРЕСИ</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {p.interests.map((t, i) => (
                    <span
                      key={t}
                      className={`border-[3px] border-ink px-3 py-1 font-heavy text-xl text-secondary-foreground ${i % 2 ? "bg-secondary" : "bg-accent"}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function OrganizerPage({ o, opps }: { o: PublicOrganizer; opps: Opp[] }) {
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  return (
    <>
      <ProfileHeader
        displayName={o.orgName}
        subtitle={`@${o.username} · ${ORG_TYPE_LABEL[o.orgType]}`}
      >
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {o.verified ? (
            <span className="flex items-center gap-2 border-[3px] border-ink bg-secondary px-3 py-1 font-heavy text-lg text-secondary-foreground">
              <ShieldCheck className="h-5 w-5" />
              ПРОВЕРЕНА ОРГАНИЗАЦИЯ
            </span>
          ) : (
            <span className="border-[3px] border-ink px-3 py-1 font-heavy text-lg">
              ЧАКА ПРОВЕРКА
            </span>
          )}
          {o.website && (
            <a
              href={o.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="jitter flex items-center gap-2 border-[3px] border-ink px-3 py-1 font-heavy text-lg"
            >
              <ExternalLink className="h-4 w-4" />
              САЙТ
            </a>
          )}
        </div>
      </ProfileHeader>
      <section>
        <h2 className="mb-4 font-heavy text-3xl">
          <span className="ransom">ОБЯВИ</span>
        </h2>
        {opps.length ? (
          <div className="grid gap-10 md:grid-cols-2">
            {opps.map((x, i) => (
              <OppCard
                key={x.id}
                o={x}
                i={i}
                saved={saved.data?.has(x.id) ?? false}
                onToggleSave={(n) => toggle.mutate({ opp: x, saved: n })}
              />
            ))}
          </div>
        ) : (
          <p className="zine bg-card p-6 font-hand text-2xl">Още няма публикувани обяви.</p>
        )}
      </section>
    </>
  );
}

/** A failed lookup (network) is not the same as "no such profile". */
function LoadError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="zine bg-card p-6" role="alert">
          <p>Профилът не се зареди.</p>
          <button
            onClick={reset}
            className="zine-pink jitter mt-3 bg-ink px-4 py-2 font-heavy text-xl text-paper"
          >
            ПАК
          </button>
        </div>
      </main>
    </div>
  );
}
