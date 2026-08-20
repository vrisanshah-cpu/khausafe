import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isAdminClientConfigured = Boolean(supabaseUrl && serviceRoleKey);

/**
 * Privileged server-only client for admin writes (add/edit vendors, moderate
 * reviews). Bypasses row-level security entirely — only ever call this from
 * a route that has already verified the caller is a signed-in admin via
 * `isAdminEmail`. Never import this from client components.
 */
export function createAdminClient() {
  if (!isAdminClientConfigured) return null;
  return createSupabaseClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
