import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  CalendarDays,
  Clock,
  ExternalLink,
  Globe,
  MapPin,
  Radio,
  ShieldCheck,
} from "lucide-react";

import { useAccount } from "@/components/AccountProvider";
import { Nav } from "@/components/Nav";
import { bg } from "@/components/OppCard";
import { api } from "@/lib/api";
import { formatDeadline, isOngoing, OPP_TYPE_LABEL, placeOf } from "@/lib/opps";
import { useSavedIds, useToggleSaved } from "@/lib/queries";

export const Route = createFileRoute("/opp/$id")({
  // Runs on the server too, so shared links get the right title and preview.
  loader: async ({ params }) => {
    const o = await api.opps.get(params.id);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — NO FUTURE?` },
          { name: "description", content: loaderData.description.slice(0, 160) },
          { property: "og:title", content: `${loaderData.title} · ${loaderData.org}` },
          { property: "og:description", content: loaderData.description.slice(0, 160) },
        ]
      : [],
  }),
  component: Detail,
});

const dateFmt = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function Detail() {
  const o = Route.useLoaderData();
  const { status } = useAccount();
  const navigate = useNavigate();
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  const isSaved = saved.data?.has(o.id) ?? false;

  const facts = [
    ...(isOngoing(o) ? [{ i: <Radio />, l: "Статус", v: "Тече сега" }] : []),
    { i: <Clock />, l: "Срок", v: formatDeadline(o.deadlineAt) },
    {
      i: <CalendarDays />,
      l: "Начало",
      v: o.startsAt ? dateFmt.format(new Date(o.startsAt)) : "—",
    },
    { i: <MapPin />, l: "Къде", v: placeOf(o) },
    { i: <Globe />, l: "Онлайн", v: o.online ? "Да" : "Не" },
  ];

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 font-heavy text-xl transition-colors hover:text-primary"
        >
          <ArrowLeft />
          КЪМ ФИЙДА
        </Link>
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className={`zine animate-in fade-in zoom-in-95 p-8 duration-500 ${bg[o.color]}`}>
              <span className="ransom text-xl">{OPP_TYPE_LABEL[o.type]}</span>
              {o.isSample && (
                <span className="ml-2 border-[3px] border-ink bg-card px-2 font-heavy text-lg text-card-foreground">
                  ПРИМЕРНА
                </span>
              )}
              <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">{o.title}</h1>
              <p className="mt-3 font-hand text-3xl">от {o.org}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {facts.map((f, i) => (
                <div
                  key={f.l}
                  className="zine animate-in fade-in slide-in-from-bottom-2 fill-mode-both bg-card p-3"
                  style={{ animationDelay: `${150 + i * 70}ms` }}
                >
                  <span className="text-primary">{f.i}</span>
                  <p className="mt-1 text-xs text-muted-foreground">{f.l}</p>
                  <p className="font-heavy text-xl">{f.v}</p>
                </div>
              ))}
            </div>
            <section className="zine bg-card p-6">
              <h2 className="mb-3 font-heavy text-3xl">
                <span className="ransom">ЗА КАКВО Е</span>
              </h2>
              <p className="whitespace-pre-wrap">
                {o.description || "Организаторът още не е добавил описание."}
              </p>
            </section>
            {o.tags.length > 0 && (
              <section className="flex flex-wrap gap-2">
                {o.tags.map((t, i) => (
                  <span
                    key={t}
                    className={`border-[3px] border-ink px-3 py-1 font-heavy text-xl ${i % 2 ? "bg-secondary" : "bg-accent"} text-secondary-foreground`}
                  >
                    {t}
                  </span>
                ))}
              </section>
            )}
          </div>
          <aside className="space-y-4 md:sticky md:top-24 md:self-start">
            <div className="zine tape bg-card p-5">
              <p className="font-heavy text-3xl">КАНДИДАТСТВАЙ</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {o.externalUrl
                  ? `Кандидатстваш директно при ${o.org}.`
                  : "Организаторът още не е дал линк за кандидатстване."}
              </p>
              {o.externalUrl ? (
                <a
                  href={o.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zine-pink jitter mt-4 flex w-full items-center justify-center gap-2 bg-ink py-3 font-heavy text-2xl text-paper"
                >
                  КЪМ ОБЯВАТА <ExternalLink className="h-5 w-5" />
                </a>
              ) : null}
              <button
                onClick={() =>
                  status === "signedIn"
                    ? toggle.mutate({ opp: o, saved: !isSaved })
                    : void navigate({ to: "/join" })
                }
                aria-pressed={isSaved}
                className={`jitter mt-2 flex w-full items-center justify-center gap-2 border-[3px] border-ink py-2 font-heavy text-xl transition-colors ${isSaved ? "bg-primary text-primary-foreground" : ""}`}
              >
                <Bookmark className={isSaved ? "fill-current" : ""} />
                {isSaved ? "ЗАПАЗЕНА" : "ЗАПАЗИ"}
              </button>
            </div>
            <div className="zine bg-card p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink font-heavy text-2xl ${bg[o.color]}`}
                >
                  {Array.from(o.org)[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold">{o.org}</p>
                  {!o.isSample && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheck className="h-3 w-3" />
                      публикувано от проверен организатор
                    </p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
