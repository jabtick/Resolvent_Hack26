import { Award, Eye, EyeOff, ShieldCheck } from "lucide-react";

import { type Badge, PLACE_LABEL } from "@/lib/achievements";

const TILT = ["tilt-l", "tilt-r", "", "tilt-r", "tilt-l", ""];

const PLACE_BG: Record<number, string> = {
  1: "bg-accent",
  2: "bg-secondary",
  3: "bg-primary text-primary-foreground",
};

/** One badge. `onToggleHidden` is passed only on the owner's own page. */
export function BadgeCard({
  b,
  i,
  onToggleHidden,
}: {
  b: Badge;
  i: number;
  onToggleHidden?: ((hidden: boolean) => void) | undefined;
}) {
  const tone = b.place ? PLACE_BG[b.place] : "bg-card";
  return (
    <article
      className={`${b.place === 1 ? "zine-pink" : "zine"} ${TILT[i % TILT.length]} animate-in fade-in slide-in-from-bottom-4 fill-mode-both bg-card transition-transform duration-200 hover:-translate-y-1 ${b.isHidden ? "opacity-60" : ""}`}
      style={{ animationDelay: `${i * 60}ms` }}
    >
      <div className={`${tone} flex flex-col items-center gap-3 p-6`}>
        <div className="flex size-22 items-center justify-center rounded-full border-4 border-ink bg-card text-ink">
          {b.place ? (
            <span className="font-display text-5xl">{b.place}</span>
          ) : (
            <Award className="size-11" />
          )}
        </div>
        <p className="-rotate-3 font-heavy text-2xl">
          {b.place ? PLACE_LABEL[b.place] : "УЧАСТНИК"}
        </p>
      </div>
      <div className="border-t-[3px] border-ink p-4">
        <h2 className="font-heavy text-2xl leading-tight">{b.event}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {b.org} · {b.date}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-dashed border-ink pt-3 text-sm font-bold">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Потвърдено от организатора
          </span>
          {onToggleHidden && (
            <button
              type="button"
              onClick={() => onToggleHidden(!b.isHidden)}
              className="jitter flex items-center gap-1 border-2 border-ink px-2 py-0.5"
              aria-label={b.isHidden ? "Покажи в публичния профил" : "Скрий от публичния профил"}
            >
              {b.isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {b.isHidden ? "СКРИТА" : "ВИДИМА"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
