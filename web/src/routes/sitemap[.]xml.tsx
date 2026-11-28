import { createFileRoute } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { buildSitemap } from "@/lib/seo";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { data } = await supabase
          .from("opportunities")
          .select("id, updated_at")
          .eq("status", "published")
          .order("updated_at", { ascending: false })
          .limit(1000);
        const opps = (data ?? []).map((r) => ({ id: r.id, updatedAt: r.updated_at }));
        return new Response(buildSitemap(new URL(request.url).origin, opps), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
