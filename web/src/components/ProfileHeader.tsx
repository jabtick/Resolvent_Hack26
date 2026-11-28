import { Camera, X } from "lucide-react";
import { useRef, type ReactNode } from "react";

import { AVATAR_ACCEPT, initialsOf } from "@/lib/profiles";

/**
 * Pink cover strip with the round avatar overlapping it: the picture, or the initials.
 * With `onPickAvatar` (your own profile) hovering the avatar offers "СМЕНИ СНИМКА".
 */
export function ProfileHeader({
  displayName,
  subtitle,
  action,
  children,
  avatarUrl,
  onPickAvatar,
  onRemoveAvatar,
  avatarBusy = false,
}: {
  displayName: string;
  subtitle: string;
  action?: ReactNode;
  children?: ReactNode;
  avatarUrl?: string | null;
  onPickAvatar?: (file: File) => void;
  onRemoveAvatar?: () => void;
  avatarBusy?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const editable = !!onPickAvatar;

  return (
    <div className="zine animate-in fade-in slide-in-from-bottom-3 overflow-hidden bg-card duration-500">
      <div className="relative min-h-36 border-b-[3px] border-ink bg-primary px-6 pb-6 pt-5">
        <p className="text-right font-display text-3xl text-primary-foreground md:text-4xl">
          NO FUTURE?
        </p>
        <div className="group absolute -bottom-12 left-6 h-24 w-24">
          <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-full border-[4px] border-ink bg-secondary font-heavy text-4xl text-secondary-foreground shadow-brutal transition-transform duration-300 group-hover:-rotate-6">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initialsOf(displayName)
            )}
            {editable && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={avatarBusy}
                aria-label={avatarUrl ? "Смени снимката" : "Добави снимка"}
                className={`absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-full bg-ink/70 text-paper transition-opacity duration-200 focus-visible:opacity-100 ${avatarBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              >
                <Camera className="h-6 w-6" />
                <span className="font-heavy text-[0.7rem] leading-tight">
                  {avatarBusy ? "КАЧВАМ…" : avatarUrl ? "СМЕНИ СНИМКА" : "ДОБАВИ СНИМКА"}
                </span>
              </button>
            )}
          </div>
          {editable && avatarUrl && onRemoveAvatar && !avatarBusy && (
            <button
              type="button"
              onClick={onRemoveAvatar}
              aria-label="Махни снимката"
              title="Махни снимката"
              className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full border-[3px] border-ink bg-card text-card-foreground opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {editable && (
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ""; // picking the same file again still fires
                if (f) onPickAvatar?.(f);
              }}
            />
          )}
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
