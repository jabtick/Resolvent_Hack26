import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Flame, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useAccount } from "@/components/AccountProvider";
import { Nav } from "@/components/Nav";
import { OppCard } from "@/components/OppCard";
import { formatStatus, OPP_TYPE_LABEL, OPP_TYPES, type Opp, type OppType } from "@/lib/opps";
import { initialsOf } from "@/lib/profiles";
import { useFeed, useMyProfile, useSavedIds, useToggleSaved } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NO FUTURE? — състезания, стипендии и стажове" },
      {
        name: "description",
        content: "Фийд с възможности за ученици и студенти. Търси, филтрирай, запазвай.",
      },
      { property: "og:title", content: "NO FUTURE? — фийд с възможности" },
      {
        property: "og:description",
        content: "Състезания, стипендии, стажове и дни на отворени врати.",
      },
    ],
  }),
  component: Feed,
});

function matches(o: Opp, q: string, types: OppType[], tags: string[], online: boolean) {
  const text =
    `${o.title} ${o.org} ${o.description} ${o.city ?? ""} ${o.tags.join(" ")}`.toLowerCase();
  return (
    (!q || text.includes(q.toLowerCase())) &&
    (!types.length || types.includes(o.type)) &&
    (!tags.length || o.tags.some((t) => tags.includes(t))) &&
    (!online || o.online)
  );
}

function Feed() {
  const { status } = useAccount();
  const navigate = useNavigate();
  const feed = useFeed();
  const saved = useSavedIds();
  const toggle = useToggleSaved();
  const me = useMyProfile();

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<OppType[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [online, setOnline] = useState(false);

  const all = feed.data ?? [];
  const allTags = useMemo(
    () => [...new Set(all.flatMap((o) => o.tags))].sort((a, b) => a.localeCompare(b, "bg")),
    [all],
  );
  const list = useMemo(
    () => all.filter((o) => matches(o, q, types, tags, online)),
    [all, q, types, tags, online],
  );
  const soon = useMemo(
    () => all.filter((o) => o.deadlineAt && new Date(o.deadlineAt) > new Date()).slice(0, 4),
    [all],
  );
  const active = types.length + tags.length + (online ? 1 : 0);
  const flip = <T,>(arr: T[], set: (v: T[]) => void, v: T) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const chip = (on: boolean) =>
    `jitter border-[3px] border-ink px-3 py-1 font-heavy text-lg transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`;

  function onToggleSave(o: Opp, next: boolean) {
    if (status !== "signedIn") {
      void navigate({ to: "/join" });
      return;
    }
    toggle.mutate({ opp: o, saved: next });
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-8 lg:grid-cols-[220px_1fr_260px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {status === "signedIn" && me.data ? (
              <div className="zine bg-card p-4 text-center">
                <div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-secondary font-heavy text-2xl text-secondary-foreground">
                  {initialsOf(me.data.displayName)}
                </div>
                <p className="font-heavy text-2xl">{me.data.displayName}</p>
                <p className="text-xs text-muted-foreground">@{me.data.username}</p>
                <Link
                  to="/profile"
                  className="jitter mt-3 block border-[3px] border-ink py-1 font-heavy text-lg"
                >
                  ПРОФИЛ
                </Link>
              </div>
            ) : (
              <div className="zine bg-accent p-4 text-accent-foreground">
                <p className="font-heavy text-2xl leading-tight">ПОСТИЖЕНИЯТА ТИ, ДОКАЗАНИ.</p>
                <p className="mt-2 text-sm">Направи профил и събирай значки от състезанията.</p>
                <Link
                  to="/join"
                  className="zine-pink jitter mt-3 block bg-ink py-1 text-center font-heavy text-lg text-paper"
                >
                  ВЛЕЗ
                </Link>
              </div>
            )}
            <div className="zine space-y-2 bg-card p-4 text-sm">
              <p className="font-hand text-2xl">във фийда</p>
              {OPP_TYPES.map((t) => (
                <p key={t} className="flex justify-between">
                  <span>{OPP_TYPE_LABEL[t]}</span>
                  <b>{all.filter((o) => o.type === t).length}</b>
                </p>
              ))}
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <h1 className="mb-6 font-heavy text-5xl leading-none md:text-6xl">
            НАМЕРИ СВОЯ <span className="ransom bg-primary">ШАНС</span>
            <br />
            ПРЕДИ <span className="font-hand text-primary">всички други</span>
          </h1>

          <div className="sticky top-[70px] z-20 space-y-3 bg-background/95 py-3 backdrop-blur-sm">
            <div className="flex gap-2">
              <label className="zine flex flex-1 items-center gap-2 bg-card px-3 transition-shadow focus-within:shadow-brutal-pink">
                <Search className="h-5 w-5" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="търси обяви, организации, градове…"
                  className="w-full bg-transparent py-3 outline-none placeholder:text-muted-foreground"
                />
                {q && (
                  <button onClick={() => setQ("")} aria-label="Изчисти">
                    <X className="h-5 w-5" />
                  </button>
                )}
              </label>
              <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="zine jitter flex items-center gap-2 bg-secondary px-4 font-heavy text-xl text-secondary-foreground"
              >
                <SlidersHorizontal className="h-5 w-5" />
                ФИЛТЪР
                {active > 0 && <span className="ransom">{active}</span>}
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                />
              </button>
            </div>
            {open && (
              <div className="zine tape animate-in fade-in slide-in-from-top-2 space-y-4 bg-card p-4 duration-300">
                <div>
                  <p className="mb-2 font-hand text-2xl">какво търсиш?</p>
                  <div className="flex flex-wrap gap-2">
                    {OPP_TYPES.map((t) => (
                      <button
                        key={t}
                        onClick={() => flip(types, setTypes, t)}
                        className={chip(types.includes(t))}
                      >
                        {OPP_TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
                {allTags.length > 0 && (
                  <div>
                    <p className="mb-2 font-hand text-2xl">избери тема</p>
                    <div className="flex flex-wrap gap-2">
                      {allTags.map((t) => (
                        <button
                          key={t}
                          onClick={() => flip(tags, setTags, t)}
                          className={chip(tags.includes(t))}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <button onClick={() => setOnline(!online)} className={chip(online)}>
                    САМО ОНЛАЙН
                  </button>
                  <button
                    onClick={() => {
                      setTypes([]);
                      setTags([]);
                      setOnline(false);
                    }}
                    className="font-bold underline"
                  >
                    изчисти всичко
                  </button>
                </div>
              </div>
            )}
          </div>

          {feed.isPending ? (
            <div className="mt-6 space-y-10" aria-busy="true">
              {[0, 1].map((i) => (
                <div key={i} className="zine aspect-[4/3] animate-pulse bg-muted" />
              ))}
            </div>
          ) : feed.isError ? (
            <div className="zine mt-6 bg-card p-6" role="alert">
              <p className="font-heavy text-3xl">ФИЙДЪТ НЕ СЕ ЗАРЕДИ</p>
              <p className="mt-1 text-sm">{feed.error.message}</p>
              <button
                onClick={() => void feed.refetch()}
                className="zine-pink jitter mt-4 bg-ink px-4 py-2 font-heavy text-xl text-paper"
              >
                ПАК
              </button>
            </div>
          ) : (
            <>
              <p className="my-4 font-hand text-2xl">
                {list.length} {list.length === 1 ? "обява" : "обяви"}.{" "}
                {all[0]?.isSample && (
                  <span className="text-primary">засега примерни — базата още е празна.</span>
                )}
              </p>
              <div className="space-y-10">
                {list.map((o, i) => (
                  <OppCard
                    key={o.id}
                    o={o}
                    i={i}
                    saved={saved.data?.has(o.id) ?? false}
                    onToggleSave={(n) => onToggleSave(o, n)}
                  />
                ))}
                {!list.length && (
                  <div className="zine bg-card p-8 text-center">
                    <p className="font-display text-4xl">НИЩО ТУК</p>
                    <p className="font-hand text-2xl">разхлаби малко филтрите</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="zine bg-card p-4">
              <p className="mb-3 flex items-center gap-2 font-heavy text-2xl">
                <Flame className="text-primary" />
                СКОРО ИЗТИЧАТ
              </p>
              {soon.length ? (
                soon.map((o) => (
                  <Link
                    key={o.id}
                    to="/opp/$id"
                    params={{ id: o.id }}
                    className="block border-b-2 border-dashed border-ink py-2 transition-colors last:border-0 hover:text-primary"
                  >
                    <p className="font-bold leading-tight">{o.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.org} · {formatStatus(o)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Няма срокове скоро.</p>
              )}
            </div>
            <Link to="/join" className="zine-pink jitter block bg-ink p-4 text-paper">
              <p className="font-heavy text-2xl">ИМАШ ВЪЗМОЖНОСТ ЗА ДРУГИТЕ?</p>
              <p className="text-sm">Публикувай я като организатор →</p>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
