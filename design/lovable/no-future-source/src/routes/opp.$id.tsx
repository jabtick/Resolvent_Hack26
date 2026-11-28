import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Clock, Wallet, Globe, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Nav } from "@/components/Nav";
import { OPPS } from "@/data/opps";
import { bg } from "@/components/OppCard";

export const Route = createFileRoute("/opp/$id")({
  loader: ({ params }) => { const o = OPPS.find((x) => String(x.id) === params.id); if (!o) throw notFound(); return o; },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.title} at ${loaderData.org} — NO FUTURE?` : "Unavailable — NO FUTURE?" },
    { name: "description", content: loaderData?.desc ?? "Opportunity details" },
    { property: "og:title", content: loaderData ? `${loaderData.title} — ${loaderData.org}` : "Opportunity" },
    { property: "og:description", content: loaderData?.desc ?? "Opportunity details" },
    { property: "og:type", content: "article" },
    { name: "twitter:card", content: "summary" },
  ] }),
  notFoundComponent: () => <div className="p-10 text-center font-display text-4xl">GONE. <Link to="/" className="underline">back</Link></div>,
  component: Detail,
});

function Detail() {
  const o = Route.useLoaderData();
  const facts = [
    { i: <Wallet />, l: "Pay", v: o.amount }, { i: <Clock />, l: "Deadline", v: o.deadline },
    { i: <MapPin />, l: "Location", v: o.location }, { i: <Globe />, l: "Remote", v: o.remote ? "Yes" : "No" },
  ];
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 font-heavy text-xl hover:text-primary"><ArrowLeft />BACK TO FEED</Link>
        <div className="grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div className={`zine p-8 ${bg[o.color]}`}>
              <span className="ransom text-xl">{o.type}</span>
              <h1 className="mt-4 font-display text-5xl leading-none md:text-7xl">{o.title}</h1>
              <p className="mt-3 font-hand text-2xl">by {o.org}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {facts.map((f) => <div key={f.l} className="zine bg-card p-3"><span className="text-primary">{f.i}</span><p className="mt-1 text-xs text-muted-foreground">{f.l}</p><p className="font-heavy text-2xl">{f.v}</p></div>)}
            </div>
            <section className="zine bg-card p-6"><h2 className="mb-3 font-heavy text-3xl"><span className="ransom">THE DEAL</span></h2><p>{o.desc} We're looking for curious, stubborn people who care more about what they make than what's on their CV. You'll work with a small crew, get real responsibility from day one, and a mentor who actually answers messages.</p></section>
            <section className="zine bg-card p-6"><h2 className="mb-3 font-heavy text-3xl"><span className="ransom">WHAT YOU GET</span></h2>
              <ul className="space-y-2">{[`${o.amount} paid on time`, "Mentorship from the org's crew", "Certificate + reference letter", "Access to the NO FUTURE? community"].map((x) => <li key={x} className="flex gap-2"><CheckCircle2 className="shrink-0 text-primary" />{x}</li>)}</ul></section>
            <section className="zine bg-card p-6"><h2 className="mb-3 font-heavy text-3xl"><span className="ransom">WHO WE WANT</span></h2>
              <ul className="list-inside list-disc space-y-1"><li>Student or recent grad (any field, honestly)</li><li>Interest in {o.field.toLowerCase()}</li><li>A short note on why you — no cover letter essays</li></ul></section>
          </div>
          <aside className="space-y-4 md:sticky md:top-24 md:self-start">
            <div className="zine bg-card tape p-5">
              <p className="font-heavy text-3xl">APPLY VIA US</p>
              <p className="mt-1 text-sm text-muted-foreground">We pass your profile to {o.org} and keep you posted.</p>
              <button onClick={() => toast.success(`Application sent to ${o.org}!`)} className="zine-pink jitter mt-4 w-full bg-ink py-3 font-heavy text-2xl text-paper">APPLY NOW</button>
              <button onClick={() => toast("Saved for later")} className="jitter mt-2 w-full border-[3px] border-ink py-2 font-heavy text-xl">SAVE</button>
            </div>
            <div className="zine bg-card p-5">
              <div className="flex items-center gap-3"><div className={`grid h-12 w-12 place-items-center rounded-full border-[3px] border-ink font-heavy text-2xl ${bg[o.color]}`}>{o.org[0]}</div><div><p className="font-bold">{o.org}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3" />Verified organiser</p></div></div>
              <p className="mt-3 text-sm">{o.likes} punks follow this org · 6 open opportunities</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
