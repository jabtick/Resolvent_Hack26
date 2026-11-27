// POST /functions/v1/delete-account
// GDPR "right to erasure": the signed-in user deletes their own account.
//
// Body: { "confirm": "DELETE" }  — guards against accidental calls.
//
// Relies on the schema: every table that holds a user's data must reference
// auth.users(id) with ON DELETE CASCADE, so deleting the auth user removes it all.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { handler, HttpError, json, readJson } from "../_shared/http.ts";
import { adminClient, rateLimit, requireUser } from "../_shared/supabase.ts";

Deno.serve(handler(["POST"], async (req) => {
  const user = await requireUser(req);
  await rateLimit(`delete-account:${user.id}`, 3, 3600);

  const body = await readJson<{ confirm?: string }>(req);
  if (body.confirm !== "DELETE") {
    throw new HttpError(
      400,
      "confirmation_required",
      'Send { "confirm": "DELETE" } to delete your account.',
    );
  }

  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) throw error;

  return json({ deleted: true });
}));
