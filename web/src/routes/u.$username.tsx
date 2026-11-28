import { createFileRoute, Link } from "@tanstack/react-router";

import { Nav } from "@/components/Nav";
import { ProfileHeader, Section } from "@/components/ProfileHeader";
import { api } from "@/lib/api";

export const Route = createFileRoute("/u/$username")({
  // Runs on the server: shared links show the name in Messenger, LinkedIn etc.
  loader: ({ params }) => api.profiles.loadPublic(params.username),
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.displayName} (@${loaderData.username}) — NO FUTURE?` },
          {
            name: "description",
            content:
              loaderData.bio?.slice(0, 160) ?? `Профилът на ${loaderData.displayName} в NO FUTURE?`,
          },
          { property: "og:title", content: `${loaderData.displayName} — NO FUTURE?` },
          {
            property: "og:description",
            content: loaderData.bio?.slice(0, 160) ?? "Постижения, доказани от организаторите.",
          },
          { property: "og:type", content: "profile" },
        ]
      : [{ title: `@${params.username} — NO FUTURE?` }, { name: "robots", content: "noindex" }],
  }),
  errorComponent: LoadError,
  component: PublicProfile,
});

function PublicProfile() {
  const p = Route.useLoaderData();
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        {!p ? (
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
