import { describe, expect, it } from "vitest";

import { buildRobots, buildSitemap, cleanOrigin } from "./seo";

describe("robots.txt", () => {
  it("points at the sitemap of the same site and hides private pages", () => {
    const r = buildRobots("https://nofuture.netlify.app/some/path");
    expect(r).toContain("Sitemap: https://nofuture.netlify.app/sitemap.xml");
    expect(r).toContain("Disallow: /profile");
    expect(r).toContain("Disallow: /settings");
  });

  it("refuses a non-http origin", () => {
    expect(() => cleanOrigin("javascript:alert(1)")).toThrow();
    expect(() => cleanOrigin("not a url")).toThrow();
  });
});

describe("sitemap.xml", () => {
  const xml = buildSitemap("https://x.example", [
    { id: "11111111-1111-1111-1111-111111111111", updatedAt: "2026-11-28T10:00:00+00:00" },
    { id: "a&b<c>", updatedAt: null },
  ]);

  it("lists the static pages and every opportunity", () => {
    expect(xml).toContain("<loc>https://x.example/</loc>");
    expect(xml).toContain("<loc>https://x.example/calendar</loc>");
    expect(xml).toContain(
      "<loc>https://x.example/opp/11111111-1111-1111-1111-111111111111</loc><lastmod>2026-11-28</lastmod>",
    );
  });

  it("escapes XML, and never lists profiles or private pages", () => {
    expect(xml).toContain("a&amp;b&lt;c&gt;");
    expect(xml).not.toContain("/u/");
    expect(xml).not.toContain("/profile");
  });
});
