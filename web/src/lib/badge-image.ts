// Draws the badge as a picture, so it can be shared where links don't work:
// Instagram, and the Stories of Facebook, Messenger and WhatsApp. Strava does
// the same thing — the post is a picture, the link only rides along in the
// caption.
//
// The colours are the light "zine" palette from styles.css, written out as hex
// on purpose: a shared picture should look the same for everybody, not follow
// the dark or acid theme the person happens to be using.
import type { Badge } from "./achievements";
import { BRAND, placeText } from "./share";

const INK = "#070707";
const PAPER = "#f9f5e6";
const CARD = "#fefcf4";
const PINK = "#f40091";
const LIME = "#d4f73e";
const YELLOW = "#fcee28";
const MUTED = "#3a3a3a";

const MONO = "'IBM Plex Mono', monospace";
const HEAVY = "Oswald, system-ui";

/** Square for a feed post, story for the 9:16 full-screen slots. */
export type ImageFormat = "square" | "story";

export const FORMAT_SIZE: Record<ImageFormat, { w: number; h: number }> = {
  square: { w: 1080, h: 1080 },
  story: { w: 1080, h: 1920 },
};

export const FORMAT_LABEL: Record<ImageFormat, string> = {
  square: "Пост (1:1)",
  story: "Stories (9:16)",
};

/** The disc colour per place, matching PLACE_BG on the badge card. */
function placeTone(place: Badge["place"]): string {
  if (place === 1) return YELLOW;
  if (place === 2) return LIME;
  if (place === 3) return PINK;
  return CARD;
}

/** Fonts are bundled with the site; canvas needs them loaded before drawing. */
async function waitForFonts(): Promise<void> {
  const f = (document as Document & { fonts?: FontFaceSet }).fonts;
  if (!f) return;
  try {
    await Promise.all([f.load("700 100px Oswald"), f.load("400 100px 'IBM Plex Mono'")]);
    await f.ready;
  } catch {
    // A missing font falls back to system-ui; the picture is still fine.
  }
}

/** Breaks `text` into lines that fit `maxWidth` at the current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Shrinks the font until the title fits in `maxLines`, so a long event name
 * can't push the rest of the card off the picture.
 */
function fitTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  startPx: number,
): { lines: string[]; px: number } {
  let px = startPx;
  const floor = Math.round(startPx * 0.5);
  for (;;) {
    ctx.font = `700 ${px}px ${HEAVY}`;
    const lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines || px <= floor) {
      return { lines: lines.slice(0, maxLines), px };
    }
    px -= Math.max(2, Math.round(startPx * 0.04));
  }
}

/** A strip of "tape", like the `tape` class in the design. */
function tape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  deg: number,
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = YELLOW;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Five-pointed star, for participation badges. */
function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, outer: number, inner: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = INK;
  ctx.fill();
}

/** A tick, drawn rather than loaded as an icon font. */
function check(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.save();
  ctx.strokeStyle = PINK;
  ctx.lineWidth = Math.max(3, size * 0.32);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x - size * 0.25, y + size * 0.62);
  ctx.lineTo(x + size, y - size * 0.72);
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the badge and hands back a PNG. Call it from a click handler: it
 * needs the document (fonts, canvas), so it does not run on the server.
 */
export async function renderBadgeImage(
  b: Badge,
  opts: { format?: ImageFormat; url?: string } = {},
): Promise<Blob> {
  if (typeof document === "undefined") {
    throw new Error("renderBadgeImage needs a browser");
  }
  const format = opts.format ?? "square";
  const { w, h } = FORMAT_SIZE[format];

  await waitForFonts();

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // Paper
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);

  // The card sits in the middle, with room above and below on a story.
  const pad = Math.round(w * 0.07);
  const cardW = w - pad * 2;
  const cardH = format === "story" ? Math.round(h * 0.62) : h - pad * 2;
  const cardX = pad;
  const cardY = Math.round((h - cardH) / 2);

  // Brutalist offset shadow, then the card itself.
  const off = Math.round(w * 0.016);
  ctx.fillStyle = PINK;
  ctx.fillRect(cardX + off, cardY + off, cardW, cardH);
  ctx.fillStyle = CARD;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(6, Math.round(w * 0.008));
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Coloured head of the card, with the place disc.
  const headH = Math.round(cardH * 0.46);
  ctx.fillStyle = placeTone(b.place);
  ctx.fillRect(cardX, cardY, cardW, headH);
  ctx.beginPath();
  ctx.moveTo(cardX, cardY + headH);
  ctx.lineTo(cardX + cardW, cardY + headH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(4, Math.round(w * 0.005));
  ctx.stroke();

  // Disc
  const r = Math.round(Math.min(cardW, headH) * 0.26);
  const cx = cardX + cardW / 2;
  const cy = cardY + Math.round(headH * 0.44);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = CARD;
  ctx.fill();
  ctx.lineWidth = Math.max(6, Math.round(w * 0.009));
  ctx.strokeStyle = INK;
  ctx.stroke();

  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (b.place) {
    ctx.font = `700 ${Math.round(r * 1.5)}px ${HEAVY}`;
    ctx.fillText(String(b.place), cx, cy + r * 0.04);
  } else {
    // A star, for a participation badge (the card uses an award icon).
    star(ctx, cx, cy, r * 0.62, r * 0.26);
  }

  // Place label, tilted like the card's -rotate-3
  ctx.save();
  ctx.translate(cx, cardY + Math.round(headH * 0.84));
  ctx.rotate((-3 * Math.PI) / 180);
  ctx.font = `700 ${Math.round(w * 0.062)}px ${HEAVY}`;
  ctx.fillStyle = INK;
  ctx.fillText(placeText(b.place), 0, 0);
  ctx.restore();

  // Body: event, organiser, confirmation
  const bodyX = cardX + Math.round(cardW * 0.07);
  const bodyW = cardW - Math.round(cardW * 0.14);
  let y = cardY + headH + Math.round(cardH * 0.1);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const title = fitTitle(ctx, b.event, bodyW, 3, Math.round(w * 0.072));
  ctx.fillStyle = INK;
  for (const line of title.lines) {
    ctx.fillText(line, bodyX, y);
    y += Math.round(title.px * 1.1);
  }

  y += Math.round(w * 0.012);
  ctx.font = `400 ${Math.round(w * 0.036)}px ${MONO}`;
  ctx.fillStyle = MUTED;
  for (const line of wrap(ctx, `${b.org} · ${b.date}`, bodyW).slice(0, 2)) {
    ctx.fillText(line, bodyX, y);
    y += Math.round(w * 0.048);
  }

  // Dashed rule + "confirmed by the organiser"
  y += Math.round(w * 0.016);
  ctx.save();
  ctx.setLineDash([Math.round(w * 0.012), Math.round(w * 0.01)]);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyX, y);
  ctx.lineTo(bodyX + bodyW, y);
  ctx.stroke();
  ctx.restore();

  y += Math.round(w * 0.055);
  ctx.font = `700 ${Math.round(w * 0.034)}px ${HEAVY}`;
  ctx.fillStyle = INK;
  check(ctx, bodyX + Math.round(w * 0.014), y - Math.round(w * 0.011), Math.round(w * 0.016));
  ctx.fillText("ПОТВЪРДЕНО ОТ ОРГАНИЗАТОРА", bodyX + Math.round(w * 0.042), y);

  // Brand, outside the card
  tape(
    ctx,
    Math.round(w * 0.1),
    cardY - Math.round(w * 0.03),
    Math.round(w * 0.22),
    Math.round(w * 0.05),
    -4,
  );

  ctx.textAlign = "center";
  const brandY =
    format === "story" ? cardY + cardH + Math.round(h * 0.07) : h - Math.round(pad * 0.55);
  ctx.font = `700 ${Math.round(w * 0.058)}px ${HEAVY}`;
  ctx.fillStyle = PINK;
  ctx.fillText(BRAND, w / 2, brandY);
  if (opts.url) {
    ctx.font = `400 ${Math.round(w * 0.028)}px ${MONO}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(opts.url.replace(/^https?:\/\//, ""), w / 2, brandY + Math.round(w * 0.045));
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("toBlob failed"));
    }, "image/png");
  });
}

/** The picture as a File, which is what the share sheet wants. */
export function blobToFile(blob: Blob, name: string): File {
  return new File([blob], name, { type: blob.type || "image/png" });
}
