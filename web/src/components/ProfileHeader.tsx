import type { ReactNode } from "react";

import { initialsOf } from "@/lib/profiles";

/** Pink cover strip with the round initials avatar overlapping it. */
export function ProfileHeader({
  displayName,
  subtitle,
  action,
  children,
}: {
  displayName: string;
  subtitle: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="zine animate-in fade-in slide-in-from-bottom-3 overflow-hidden bg-card duration-500">
      <div className="relative min-h-36 border-b-[3px] border-ink bg-primary px-6 pb-6 pt-5">
        <p className="text-right font-display text-3xl text-primary-foreground md:text-4xl">
          NO FUTURE?
        </p>
        <div className="absolute -bottom-12 left-6 grid h-24 w-24 place-items-center rounded-full border-[4px] border-ink bg-secondary font-heavy text-4xl text-secondary-foreground shadow-brutal transition-transform duration-300 hover:-rotate-6">
          {initialsOf(displayName)}
        </div>
      </div>
      <div className="px-6 pb-6 pt-16">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words font-heavy text-5xl">{displayName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Section({ title, text }: { title: string; text: string | null | undefined }) {
  const empty = !text?.trim();
  return (
    <section className="border-b-2 border-dashed border-ink pb-6">
      <h2 className="mb-4 font-heavy text-3xl">
        <span className="ransom">{title}</span>
      </h2>
      <p
        className={`whitespace-pre-wrap break-words leading-relaxed ${empty ? "text-muted-foreground" : ""}`}
      >
        {empty ? "Още няма нищо тук." : text}
      </p>
    </section>
  );
}
