import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Bookmark, MapPin } from "lucide-react";
import type { Opp } from "@/data/opps";
export const bg = { primary: "bg-primary text-primary-foreground", secondary: "bg-secondary text-secondary-foreground", accent: "bg-accent text-accent-foreground" };
export function OppCard({ o, i }: { o: Opp; i: number }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <article className={`zine bg-card ${i % 2 ? "tilt-r" : "tilt-l"}`}>
      <div className="flex items-center gap-3 border-b-[3px] border-ink p-3">
        <div className={`grid h-11 w-11 place-items-center rounded-full border-[3px] border-ink font-heavy text-xl ${bg[o.color]}`}>{o.org[0]}</div>
        <div className="flex-1"><p className="font-bold">{o.org}</p><p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{o.location}{o.remote && " · remote ok"}</p></div>
        <span className="ransom text-lg">{o.type}</span>
      </div>
      <Link to="/opp/$id" params={{ id: String(o.id) }} className={`relative flex aspect-[4/3] flex-col justify-between overflow-hidden border-b-[3px] border-ink p-6 ${bg[o.color]}`}>
        <span className="font-hand text-xl">#{o.field.toLowerCase()}</span>
        <h3 className="font-display text-5xl leading-none">{o.title}</h3>
        <div className="flex items-end justify-between">
          <span className="border-[3px] border-ink bg-card px-3 py-1 font-heavy text-3xl text-card-foreground">{o.amount}</span>
          <span className="-rotate-6 font-hand text-lg">deadline: {o.deadline}</span>
        </div>
      </Link>
      <div className="p-3">
        <div className="flex gap-4">
          <button aria-label="Like" onClick={() => setLiked(!liked)} className="jitter"><Heart className={`h-7 w-7 ${liked ? "fill-primary text-primary" : ""}`} /></button>
          <button aria-label="Save" onClick={() => setSaved(!saved)} className="jitter ml-auto"><Bookmark className={`h-7 w-7 ${saved ? "fill-current" : ""}`} /></button>
        </div>
        <p className="mt-2 font-bold">{o.likes + (liked ? 1 : 0)} punks dig this</p>
        <p className="mt-1 text-sm"><b>{o.org}</b> {o.desc}</p>
        <Link to="/opp/$id" params={{ id: String(o.id) }} className="zine-pink jitter mt-3 block w-full bg-ink py-2 text-center font-heavy text-2xl text-paper">MORE INFO →</Link>
      </div>
    </article>
  );
}
