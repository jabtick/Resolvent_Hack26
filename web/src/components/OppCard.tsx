import { Link } from "@tanstack/react-router";
import { Bookmark, MapPin } from "lucide-react";

import { formatStatus, OPP_TYPE_LABEL, placeOf, type Opp, type OppColor } from "@/lib/opps";

export const bg: Record<OppColor, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
};

export function OppCard({
  o,
  i,
  saved,
  onToggleSave,
}: {
  o: Opp;
  i: number;
  saved: boolean;
  onToggleSave: (next: boolean) => void;
}) {
  return (
    <article
      className={`zine group bg-card transition-transform duration-300 ease-out hover:-translate-y-1 hover:rotate-0 ${i % 2 ? "tilt-r" : "tilt-l"} animate-in fade-in slide-in-from-bottom-4 fill-mode-both`}
      style={{ animationDelay: `${Math.min(i, 8) * 60}ms`, animationDuration: "500ms" }}
    >
      <div className="flex items-center gap-3 border-b-[3px] border-ink p-3">
        <div
          className={`grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink font-heavy text-xl ${bg[o.color]}`}
        >
          {Array.from(o.org)[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{o.org}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {placeOf(o)}
          </p>
        </div>
        <span className="ransom text-lg">{OPP_TYPE_LABEL[o.type]}</span>
      </div>
      <Link
        to="/opp/$id"
        params={{ id: o.id }}
        className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden border-b-[3px] border-ink p-6 ${bg[o.color]}`}
      >
        <span className="font-hand text-2xl">
          {o.tags[0] ? `#${o.tags[0].toLowerCase()}` : " "}
        </span>
        <h3 className="font-display text-4xl leading-none transition-transform duration-300 group-hover:scale-[1.02] md:text-5xl">
          {o.title}
        </h3>
        <div className="flex items-end justify-between gap-3">
          {o.isSample && (
            <span className="border-[3px] border-ink bg-card px-2 py-0.5 font-heavy text-lg text-card-foreground">
              ПРИМЕРНА
            </span>
          )}
          <span className="ml-auto -rotate-6 font-hand text-2xl">{formatStatus(o)}</span>
        </div>
      </Link>
      <div className="p-3">
        <div className="flex items-start gap-4">
          <p className="line-clamp-2 flex-1 text-sm">
            <b>{o.org}</b> {o.description}
          </p>
          <button
            aria-label={saved ? "Махни от запазени" : "Запази"}
            aria-pressed={saved}
            onClick={() => onToggleSave(!saved)}
            className="jitter shrink-0 transition-transform active:scale-90"
          >
            <Bookmark
              className={`h-7 w-7 transition-colors ${saved ? "fill-primary text-primary" : ""}`}
            />
          </button>
        </div>
        <Link
          to="/opp/$id"
          params={{ id: o.id }}
          className="zine-pink jitter mt-3 block w-full bg-ink py-2 text-center font-heavy text-2xl text-paper"
        >
          ВИЖ ПОВЕЧЕ →
        </Link>
      </div>
    </article>
  );
}
