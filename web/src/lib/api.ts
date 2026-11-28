// One place where the site's data APIs are built on the shared Supabase client.
import { supabase } from "@/integrations/supabase/client";

import { createAchievementsApi } from "./achievements";
import { createAuthApi } from "./auth";
import { createOppsApi } from "./opps";
import { createProfilesApi } from "./profiles";

export const api = {
  auth: createAuthApi(supabase),
  profiles: createProfilesApi(supabase),
  opps: createOppsApi(supabase),
  achievements: createAchievementsApi(supabase),
};
