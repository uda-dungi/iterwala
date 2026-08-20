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
 * Per-instance throttle on failed auth attempts, keyed by client IP.
 *
 * Serverless instances are recycled and requests spread across them, so this is not a
 * hard guarantee — a determined attacker with many IPs is not stopped by it. What it
 * does buy is a cheap cap on credential-stuffing against a single origin, and it costs
 * nothing. Only FAILURES count, so a working admin is never throttled.
 *
 * A real distributed limit would need shared state (Upstash/Redis); this is the
 * proportionate version for an endpoint that already requires a valid Supabase JWT.
 */
const failures = new Map<string, { count: number; first: number }>();
const WINDOW_MS = 60_000;
const MAX_FAILURES = 10;

function clientIp(req: any): string {
  const fwd =
    (req.headers?.["x-forwarded-for"] as string) ||
    (req.headers?.["x-vercel-forwarded-for"] as string) ||
    (req.headers?.["x-real-ip"] as string) ||
    "";
  return fwd.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function isThrottled(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.first > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const entry = failures.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) {
    failures.set(ip, { count: 1, first: now });
    return;
  }
  entry.count += 1;
  // Unbounded growth would be a slow memory leak across a long-lived instance.
  if (failures.size > 5000) failures.clear();
}

/**
 * Resolves the caller to an admin, or writes the error response and returns null.
 *
 * Returning null (rather than throwing) keeps handlers as a flat `if (!ctx) return;`
 * with no try/catch, so there is no path where a handler swallows an auth failure and
 * carries on to the write.
 */
export async function requireAdmin(req: any, res: any): Promise<AdminContext | null> {
  const ip = clientIp(req);
  if (isThrottled(ip)) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({ error: "Too many attempts. Try again in a minute." });
    return null;
  }

  const authHeader = String(req.headers?.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    recordFailure(ip);
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
    recordFailure(ip);
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  const email = String(data.user.email).toLowerCase();
  if (!isAdminEmail(email)) {
    // A valid account that is not an admin is the signal worth logging: it means
    // someone signed in and then probed the admin API.
    console.warn(`adminAuth: non-admin ${email} attempted ${req.method} ${req.url}`);
    recordFailure(ip);
    res.status(403).json({ error: "Forbidden" });
    return null;
  }

  // Successful auth clears the counter so a typo earlier can't lock out real work.
  failures.delete(ip);
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
