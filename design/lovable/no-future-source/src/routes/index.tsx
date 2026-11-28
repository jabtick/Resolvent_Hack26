import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { OppCard } from "@/components/OppCard";
import { Flame, Users, Building2, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { OPPS, TYPES, FIELDS } from "@/data/opps";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "NO FUTURE? — Find Stipends, Internships & Grants" },
    { name: "description", content: "Punk feed of stipends, internships, grants and fellowships. Search, filter, scroll." },
    { property: "og:title", content: "NO FUTURE? — Opportunity Feed" },
    { property: "og:description", content: "Search and filter punk-approved opportunities." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Feed,
});

function Feed() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [types, setTypes] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [remote, setRemote] = useState(false);
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const list = useMemo(() => OPPS.filter((o) =>
    (!q || `${o.title} ${o.org} ${o.desc} ${o.location}`.toLowerCase().includes(q.toLowerCase())) &&
    (!types.length || types.includes(o.type)) && (!fields.length || fields.includes(o.field)) && (!remote || o.remote)), [q, types, fields, remote]);
  const active = types.length + fields.length + (remote ? 1 : 0);
  const chip = (on: boolean) => `border-[3px] border-ink px-3 py-1 font-heavy text-lg jitter ${on ? "bg-primary text-primary-foreground" : "bg-card"}`;

  return (
    <div className="min-h-screen">
      <Nav />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-20 pt-8 lg:grid-cols-[220px_1fr_260px]">
        <aside className="hidden lg:block"><div className="sticky top-24 space-y-4">
          <div className="zine bg-card p-4"><div className="mx-auto mb-2 grid h-16 w-16 place-items-center rounded-full border-[3px] border-ink bg-secondary font-display text-2xl">HK</div><p className="text-center font-heavy text-2xl">Hristo K.</p><p className="text-center text-xs text-muted-foreground">Candidate · Sofia</p><Link to="/profile" className="mt-3 block border-[3px] border-ink py-1 text-center font-heavy text-lg jitter">VIEW PROFILE</Link></div>
          <div className="zine bg-card space-y-2 p-4 text-sm"><p className="font-hand text-lg">your stats</p><p className="flex justify-between"><span>Applied</span><b>4</b></p><p className="flex justify-between"><span>Saved</span><b>9</b></p><p className="flex justify-between"><span>Profile views</span><b>57</b></p></div>
        </div></aside>
        <main className="min-w-0">
        <h1 className="mb-6 font-heavy text-6xl leading-none">FIND YOUR <span className="ransom bg-primary">ESCAPE</span><br />FROM THE <span className="font-hand text-primary">9–5</span></h1>
        <div className="sticky top-[70px] z-20 space-y-3 bg-background py-3">
          <div className="flex gap-2">
            <label className="zine bg-card flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search orgs, gigs, cities..." className="w-full bg-transparent py-3 outline-none placeholder:text-muted-foreground" />
              {q && <button onClick={() => setQ("")} aria-label="Clear"><X className="h-5 w-5" /></button>}
            </label>
            <button onClick={() => setOpen(!open)} className="zine flex items-center gap-2 bg-secondary px-4 font-heavy text-xl jitter">
              <SlidersHorizontal className="h-5 w-5" />FILTER{active > 0 && <span className="ransom">{active}</span>}<ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
          {open && (
            <div className="zine bg-card tape space-y-4 p-4">
              <div><p className="mb-2 font-hand text-lg">what kinda deal?</p><div className="flex flex-wrap gap-2">{TYPES.map((t) => <button key={t} onClick={() => toggle(types, setTypes, t)} className={chip(types.includes(t))}>{t}</button>)}</div></div>
              <div><p className="mb-2 font-hand text-lg">your scene</p><div className="flex flex-wrap gap-2">{FIELDS.map((t) => <button key={t} onClick={() => toggle(fields, setFields, t)} className={chip(fields.includes(t))}>{t}</button>)}</div></div>
              <div className="flex items-center justify-between">
                <button onClick={() => setRemote(!remote)} className={chip(remote)}>REMOTE ONLY</button>
                <button onClick={() => { setTypes([]); setFields([]); setRemote(false); }} className="font-bold underline">wipe it all</button>
              </div>
            </div>
          )}
        </div>
        <p className="my-4 font-hand text-xl">{list.length} results. <span className="text-primary">no gods, no masters.</span></p>
        <div className="space-y-10">
          {list.map((o, i) => <OppCard key={o.id} o={o} i={i} />)}
          {!list.length && <div className="zine bg-card p-8 text-center"><p className="font-display text-4xl">NOTHING HERE</p><p className="font-hand">loosen up the filters, punk</p></div>}
        </div>
      </main>
        <aside className="hidden lg:block"><div className="sticky top-24 space-y-4">
          <div className="zine bg-card p-4"><p className="mb-3 flex items-center gap-2 font-heavy text-2xl"><Flame className="text-primary" />HOT RIGHT NOW</p>
            {OPPS.slice(0, 4).map((o) => <Link key={o.id} to="/opp/$id" params={{ id: String(o.id) }} className="block border-b-2 border-dashed border-ink py-2 last:border-0 hover:text-primary"><p className="font-bold leading-tight">{o.title}</p><p className="text-xs text-muted-foreground">{o.org} · {o.deadline}</p></Link>)}
          </div>
          <div className="zine grid grid-cols-3 gap-2 bg-accent p-4 text-center text-accent-foreground">
            <div><Building2 className="mx-auto" /><b className="font-heavy text-2xl">120</b><p className="text-xs">orgs</p></div>
            <div><Users className="mx-auto" /><b className="font-heavy text-2xl">3.4k</b><p className="text-xs">punks</p></div>
            <div><Zap className="mx-auto" /><b className="font-heavy text-2xl">48</b><p className="text-xs">new</p></div>
          </div>
          <Link to="/join" className="zine-pink jitter block bg-ink p-4 text-paper"><p className="font-heavy text-2xl">GOT AN OPPORTUNITY?</p><p className="text-sm">Post it as an organiser →</p></Link>
        </div></aside>
      </div>
    </div>
  );
}
