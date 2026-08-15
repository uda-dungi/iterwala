/**
 * Promo codes — server side (the source of truth for what actually gets charged).
 *
 * The pure math + stacking rule is mirrored in src/lib/coupons.ts so the cart can show
 * the same number the server will charge, exactly like offers.ts / api/_lib/offers.ts.
 * If you edit the rules below, edit BOTH files.
 *
 * Eligibility deliberately lives here only, NOT in the mirror: "first order" needs a
 * database lookup, so the browser can never decide it. The client shows an optimistic
 * figure and /api/coupon/validate + /api/checkout/initiate have the final say.
 *
 * WELCOME25 rules (Independence Day 2026):
 *   - 25% off
 *   - DOES stack with the Raksha Bandhan Sale offers, and applies to every product
 *     including the Pack of 4 and the Collector's Edition. The percentage is taken off
 *     the subtotal that already has the offer discount applied, so the two compound
 *     rather than double-count (2 × Pack of 4 = ₹999 after BOGO, ₹749 after this).
 *   - first order only, tracked per email address
 *   - PAUSED entirely while the Independence Day Sale's automatic 10% off is active
 *     (independenceDaySale.ts) — that discount isn't meant to stack with a coupon.
 */

import { isIndependenceDaySaleActive } from "./independenceDaySale.js";

export const WELCOME_CODE = "WELCOME25";
export const WELCOME_PERCENT = 25;

/** Codes handed out before the Independence Day bump to 25%. Still accepted, at the
 *  current percentage, so nobody holding an older popup/email code gets turned away. */
const LEGACY_CODES = ["WELCOME10", "WELCOME15"];

export type CouponResult = { valid: boolean; discount: number; reason?: string };

export const normalizeCode = (code: unknown): string =>
  typeof code === "string" ? code.trim().toUpperCase() : "";

/**
 * The part of validation that's pure arithmetic — shared with the client mirror.
 * `discountedSubtotal` is the cart AFTER any Raksha Bandhan offer, and `offerDiscount`
 * is how much that offer already took off (used for the no-stacking rule).
 */
export function computeCoupon(code: unknown, discountedSubtotal: number, offerDiscount: number): CouponResult {
  const c = normalizeCode(code);
  if (!c) return { valid: false, discount: 0 };
  // All coupon codes are paused for the Independence Day Sale — the automatic 10% off
  // (independenceDaySale.ts) is not meant to stack with a coupon on top of it.
  if (isIndependenceDaySaleActive()) {
    return { valid: false, discount: 0, reason: "Coupons are paused during the Independence Day Sale — 10% off is already applied automatically." };
  }
  if (c !== WELCOME_CODE && !LEGACY_CODES.includes(c)) {
    return { valid: false, discount: 0, reason: "That code isn't valid." };
  }
  const discount = Math.round((discountedSubtotal * WELCOME_PERCENT) / 100);
  if (discount <= 0) return { valid: false, discount: 0, reason: "That code isn't valid for this cart." };
  return { valid: true, discount };
}

/**
 * Has this email already completed an order? WELCOME25 is first-order-only, and orders
 * are keyed by email, so one paid order permanently uses the code up for that address.
 *
 * Only 'paid' counts — an abandoned 'pending' row (checkout started, payment never
 * finished) must not lock someone out of the discount they never actually received.
 *
 * Fails OPEN (returns false) when Supabase isn't configured or the query errors: a
 * tracking lookup that's down should not block a real sale. The discount is capped at
 * 25% either way, so the downside of the rare false-allow is small.
 */
export async function hasPreviousPaidOrder(admin: any, email: string): Promise<boolean> {
  if (!admin || !email) return false;
  try {
    const { data, error } = await admin
      .from("orders")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .eq("status", "paid")
      .limit(1);
    if (error) {
      console.error("coupons: previous-order lookup failed", error.message);
      return false;
    }
    return Array.isArray(data) && data.length > 0;
  } catch (err) {
    console.error("coupons: previous-order lookup threw", err);
    return false;
  }
}
