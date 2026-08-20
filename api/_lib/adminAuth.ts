import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured, isAdminEmail } from "./supabaseAdmin.js";

/**
 * The gate in front of every /api/admin/* route.
 *
 * This matters more than it used to. Admin routes used to be read-only (list orders,
 * render a PDF); they now write the catalogue, which means they decide what customers
 * are charged. An unguarded mutation endpoint would let anyone who finds the URL set a
 * price to ₹1 and check out at that price.
 *
 * RLS is not the protection here — these handlers run with the SERVICE ROLE key, which
 * bypasses RLS entirely by design. This function IS the protection. Every mutating
 * handler must call requireAdmin() and return immediately if it doesn't get a context
 * back.
 *
 * The check is deliberately the same one api/admin/orders.ts already performed, lifted
 * into one place so a new endpoint can't accidentally implement a weaker version of it:
 *   1. Bearer token present
 *   2. Supabase service-role configured
 *   3. Token resolves to a real user (verified by Supabase, not decoded locally)
 *   4. That user's email is on the admin allowlist
 */

export type AdminContext = {
  admin: SupabaseClient;
  email: string;
  userId: string;
};

/**
 * Resolves the caller to an admin, or writes the error response and returns null.
 *
 * Returning null (rather than throwing) keeps handlers as a flat `if (!ctx) return;`
 * with no try/catch, so there is no path where a handler swallows an auth failure and
 * carries on to the write.
 */
export async function requireAdmin(req: any, res: any): Promise<AdminContext | null> {
  const authHeader = String(req.headers?.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  if (!isSupabaseAdminConfigured()) {
    res.status(503).json({ error: "Server is not configured for Supabase admin access." });
    return null;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: "Could not create Supabase admin client." });
    return null;
  }

  // Verified against Supabase rather than decoded here: a locally-parsed JWT proves
  // nothing about revocation, and getting signature validation subtly wrong is exactly
  // the kind of mistake that stays invisible until it's exploited.
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user?.email) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const email = String(data.user.email).toLowerCase();
  if (!isAdminEmail(email)) {
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  return { admin, email, userId: data.user.id };
}

/**
 * Records a catalogue change. Best-effort: a failure to log must not fail the write
 * the admin just made, but it is logged loudly because a silent gap in the audit trail
 * defeats the point of having one.
 */
export async function writeAudit(
  ctx: AdminContext,
  entry: {
    action: "create" | "update" | "delete" | "reorder";
    entity: string;
    entityId?: string | null;
    before?: unknown;
    after?: unknown;
  }
): Promise<void> {
  try {
    const { error } = await ctx.admin.from("admin_audit").insert({
      actor_email: ctx.email,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
    });
    if (error) console.error("adminAuth:writeAudit", error.message);
  } catch (err) {
    console.error("adminAuth:writeAudit unexpected", err);
  }
}

/** Rejects any method other than those listed. Returns false when it has responded. */
export function allowMethods(req: any, res: any, methods: string[]): boolean {
  if (!methods.includes(req.method)) {
    res.setHeader("Allow", methods.join(", "));
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

/** Vercel hands body through as string or object depending on content-type. */
export function parseBody(raw: any): Record<string, any> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? raw : {};
}
