// The share sheet for one badge, built the way Strava's is:
//
//   • one big "СПОДЕЛИ" button that opens the phone's own share sheet, with the
//     picture attached — that sheet is where Instagram, Facebook, Messenger and
//     Viber actually live, so we don't pretend to be them;
//   • a picture to save, because Instagram takes no links from the web at all;
//   • plain network links underneath, for a desktop browser with no sheet.
import { Check, Copy, Download, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Badge } from "@/lib/achievements";
import { blobToFile, FORMAT_LABEL, renderBadgeImage, type ImageFormat } from "@/lib/badge-image";
import {
  badgePublicUrl,
  badgeShareText,
  badgeShareTitle,
  canShareFile,
  copyLink,
  imageFileName,
  NETWORKS,
  networkShareUrl,
  shareBadge,
  type ShareNetwork,
} from "@/lib/share";

const FORMATS: ImageFormat[] = ["square", "story"];

/** Networks that take a link. Instagram is deliberately not one of them. */
const LINK_NETWORKS: ShareNetwork[] = [
  "facebook",
  "x",
  "linkedin",
  "whatsapp",
  "viber",
  "telegram",
];

type Props = {
  b: Badge;
  /** Rendered as the trigger; defaults to a zine-style button. */
  className?: string;
};

export function ShareBadge({ b, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Сподели: ${b.event}`}
        className={
          className ??
          "jitter flex w-full items-center justify-center gap-2 border-t-[3px] border-ink bg-secondary px-4 py-3 font-heavy text-xl text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
        }
      >
        <Share2 className="size-5" />
        СПОДЕЛИ
      </button>
      {open && <ShareDialog b={b} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareDialog({ b, onClose }: { b: Badge; onClose: () => void }) {
  const [format, setFormat] = useState<ImageFormat>("square");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  // The rendered picture, kept so a share doesn't redraw it.
  const fileRef = useRef<File | null>(null);

  // The origin is only known in the browser; the dialog never renders on the
  // server, so reading it here is safe.
  const url = badgePublicUrl(b.id, typeof window === "undefined" ? "" : window.location.origin);
  const text = badgeShareText(b);
  const title = badgeShareTitle(b);

  // Draw the picture when the dialog opens, and again on a format change.
  useEffect(() => {
    let alive = true;
    let objectUrl: string | null = null;
    setBusy(true);
    setFailed(false);
    fileRef.current = null;

    void (async () => {
      try {
        const blob = await renderBadgeImage(b, { format, url });
        if (!alive) return;
        fileRef.current = blobToFile(blob, imageFileName(b));
        objectUrl = URL.createObjectURL(blob);
        setPreview(objectUrl);
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setBusy(false);
      }
    })();

    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [b, format, url]);

  const onShare = useCallback(async () => {
    const file = fileRef.current ?? undefined;
    const outcome = await shareBadge({ title, text, url, file });
    if (outcome === "shared") onClose();
    else if (outcome === "copied") toast.success("Няма меню за споделяне — копирахме линка.");
    else if (outcome === "failed") toast.error("Споделянето не стана. Копирай линка.");
    else if (outcome === "unsupported") toast.error("Браузърът не поддържа споделяне.");
    // "cancelled": the person closed the sheet, so say nothing.
  }, [title, text, url, onClose]);

  function onDownload() {
    const file = fileRef.current;
    if (!file) return;
    const href = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(href);
    toast.success("Картинката е запазена. Качи я в Instagram.");
  }

  async function onCopy() {
    if (await copyLink(url)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Линкът е копиран.");
    } else {
      toast.error("Браузърът не позволи копиране.");
    }
  }

  const canAttachPicture = fileRef.current != null && canShareFile(fileRef.current);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="zine max-h-[90dvh] overflow-y-auto border-[3px] border-ink bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heavy text-3xl">
            СПОДЕЛИ <span className="ransom">ЗНАЧКАТА</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            {canAttachPicture
              ? "Картинката тръгва заедно със споделянето — избери Instagram, Facebook или друго."
              : "Instagram приема само картинки, затова я запази и я качи там."}
          </DialogDescription>
        </DialogHeader>

        {/* Format picker */}
        <div className="flex gap-2" role="radiogroup" aria-label="Размер на картинката">
          {FORMATS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={format === f}
              onClick={() => setFormat(f)}
              className={`border-[3px] border-ink px-3 py-1 font-heavy text-base transition-colors ${
                format === f ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"
              }`}
            >
              {FORMAT_LABEL[f]}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex min-h-40 items-center justify-center border-[3px] border-ink bg-background p-3">
          {busy ? (
            <Loader2 className="size-8 animate-spin text-primary" aria-label="Готвим картинката" />
          ) : failed ? (
            <p className="p-4 text-center text-sm">
              Картинката не се получи, но линкът работи — сподели или го копирай.
            </p>
          ) : (
            preview && (
              <img
                src={preview}
                alt={`Значка: ${title}`}
                className={format === "story" ? "max-h-72 w-auto" : "max-h-60 w-auto"}
              />
            )
          )}
        </div>

        {/* Primary action */}
        <button
          type="button"
          onClick={() => void onShare()}
          disabled={busy}
          className="zine-pink jitter flex w-full items-center justify-center gap-2 bg-ink px-4 py-3 font-heavy text-2xl text-paper disabled:opacity-50"
        >
          <Share2 className="size-6" />
          СПОДЕЛИ
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onDownload}
            disabled={busy || failed}
            className="jitter flex items-center justify-center gap-2 border-[3px] border-ink bg-accent px-3 py-2 font-heavy text-lg text-accent-foreground disabled:opacity-50"
          >
            <Download className="size-5" />
            ЗАПАЗИ
          </button>
          <button
            type="button"
            onClick={() => void onCopy()}
            className="jitter flex items-center justify-center gap-2 border-[3px] border-ink bg-card px-3 py-2 font-heavy text-lg"
          >
            {copied ? <Check className="size-5 text-primary" /> : <Copy className="size-5" />}
            ЛИНК
          </button>
        </div>

        {/* Instagram needs the picture, so it gets its own hint, not a link. */}
        <p className="flex items-start gap-2 border-t-[3px] border-dashed border-ink pt-3 text-xs text-muted-foreground">
          <ImageIcon className="mt-0.5 size-4 shrink-0" />
          <span>
            Instagram не приема линкове отвън. На телефон избери <b>СПОДЕЛИ</b> и после Instagram;
            на компютър — <b>ЗАПАЗИ</b> и качи картинката.
          </span>
        </p>

        {/* Desktop fallback: the networks that do take a link. */}
        <div>
          <p className="mb-2 font-mono text-xs font-bold">ИЛИ ДИРЕКТНО:</p>
          <div className="flex flex-wrap gap-2">
            {LINK_NETWORKS.map((n) => (
              <a
                key={n}
                href={networkShareUrl(n, url, text)}
                target="_blank"
                rel="noopener noreferrer"
                className="jitter border-[3px] border-ink px-3 py-1 font-heavy text-base transition-colors hover:bg-secondary"
              >
                {NETWORKS[n].label}
              </a>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
