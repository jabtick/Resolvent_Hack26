// What search engines get: robots.txt and sitemap.xml. Only public, indexable pages are listed
// (the feed, the calendar and each published opportunity). Student profiles are left out on
// purpose: a profile is public to people with the link, but we don't push it into search results.

const STATIC_PATHS = ["/", "/calendar"];

export type SitemapOpp = { id: string; updatedAt: string | null };

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** `https://site.example` with no trailing slash; only http(s) origins are accepted. */
export function cleanOrigin(origin: string): string {
  const u = new URL(origin);
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad origin");
  return u.origin;
}

export function buildRobots(origin: string): string {
  const o = cleanOrigin(origin);
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /profile",
    "Disallow: /settings",
    "Disallow: /saved",
    "Disallow: /achievements",
    "",
    `Sitemap: ${o}/sitemap.xml`,
    "",
  ].join("\n");
}

export function buildSitemap(origin: string, opps: SitemapOpp[]): string {
  const o = cleanOrigin(origin);
  const urls = [
    ...STATIC_PATHS.map((p) => `  <url><loc>${esc(o + p)}</loc></url>`),
    ...opps.map((x) => {
      const day =
        x.updatedAt && /^\d{4}-\d{2}-\d{2}/.test(x.updatedAt) ? x.updatedAt.slice(0, 10) : null;
      return `  <url><loc>${esc(`${o}/opp/${x.id}`)}</loc>${day ? `<lastmod>${day}</lastmod>` : ""}</url>`;
    }),
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
