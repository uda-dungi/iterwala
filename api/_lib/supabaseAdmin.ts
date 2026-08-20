import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 * Never import this from `src/` — it must only run inside /api serverless functions,
 * otherwise the service role key would leak into the browser bundle.
 */
let cached: SupabaseClient | null | undefined;

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

const adminEmails = (process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

/**
 * Optional domain-wide admin grant, off unless ADMIN_EMAIL_DOMAIN is set.
 *
 * This used to be a hardcoded `endsWith("@itrawala.in")`, which meant ANY address at
 * that domain was a full admin without appearing on any allowlist. Sign-in is
 * passwordless magic-link, so that amounted to: whoever can receive mail at any
 * address on the domain can edit prices. Tolerable when the dashboard only listed
 * orders; not once it controls what customers are charged — and a catch-all mailbox,
 * an ex-employee's alias, or a lapsed domain registration each turn it into a way in.
 *
 * Explicit allowlisting via ADMIN_EMAILS is the intended path. This exists only for
 * teams that genuinely want it, and must be opted into.
 */
const adminDomain = (process.env.ADMIN_EMAIL_DOMAIN || "")
  .trim()
  .toLowerCase()
  .replace(/^@/, "");

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  if (adminEmails.includes(value)) return true;
  if (adminDomain && value.endsWith(`@${adminDomain}`)) return true;
  return false;
}

export function getSupabaseAdmin(): SupabaseClient | null {
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
 * Uses Supabase's magic-link generation, which creates the user as a side effect if
 * they don't exist yet, and returns the user record either way.
 */
export async function ensureCustomerAccount(
  admin: SupabaseClient,
  email: string,
  fullName: string
): Promise<string | null> {
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
