// The team's Supabase project. Both values are public by design: the
// publishable key only lets the site do what the database rules allow (RLS
// and column grants in supabase/migrations). The secret key and the database
// password never go in the site.
//
// Regenerate the types after a schema change:
//   npx supabase gen types typescript --project-id tjkwpebrakwfkhenpayl --schema public > web/src/integrations/supabase/types.ts
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

export const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"] ?? "https://tjkwpebrakwfkhenpayl.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  "sb_publishable_qe6kOIYNHExsXCIEFWVGZg_jcnDcahj";

const isBrowser = typeof window !== "undefined";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Sessions live in the browser; server rendering only reads public data.
    persistSession: isBrowser,
    autoRefreshToken: isBrowser,
    detectSessionInUrl: isBrowser,
  },
});
