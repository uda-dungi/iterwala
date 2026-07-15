import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 * Plain-JS port of api/_lib/supabaseAdmin.ts for the Hostinger Node.js server.
 * Never import this from `src/` — it must only run on the server, otherwise the
 * service role key would leak into the browser bundle.
 */
let cached;

export function isSupabaseAdminConfigured() {
  return Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  if (cached !== undefined) return cached;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached = url && key
    ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
  return cached;
}

/**
 * Ensures an auth user exists for this email (creating one silently if not) so every
 * order has an account behind it — without ever showing the customer a signup form.
 */
export async function ensureCustomerAccount(admin, email, fullName) {
  try {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      console.error("ensureCustomerAccount:generateLink", error.message);
      return null;
    }
    return data.user?.id ?? null;
  } catch (err) {
    console.error("ensureCustomerAccount:unexpected", err);
    return null;
  }
}
