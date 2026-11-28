import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { OppCard } from "@/components/OppCard";
import { OPPS } from "@/data/opps";

export const Route = createFileRoute("/saved")({
  head: () => ({ meta: [
    { title: "Saved Opportunities — NO FUTURE?" }, { name: "description", content: "Opportunities you saved for later." },
    { property: "og:title", content: "Saved — NO FUTURE?" }, { property: "og:description", content: "Opportunities you saved for later." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <div className="min-h-screen"><Nav />
      <main className="mx-auto max-w-5xl px-4 py-8"><h1 className="mb-8 font-heavy text-6xl">SAVED <span className="font-hand text-3xl text-primary">for later, punk</span></h1>
        <div className="grid gap-10 md:grid-cols-2">{OPPS.filter((o) => o.id % 3 === 0).map((o, i) => <OppCard key={o.id} o={o} i={i} />)}</div></main>
    </div>
  ),
});
