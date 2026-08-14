// Promo codes — client mirror of api/_lib/coupons.ts.
//
// The arithmetic and the no-stacking rule are duplicated byte-for-byte so the cart shows
// the same discount the server will actually charge (same reason src/lib/offers.ts mirrors
// api/_lib/offers.ts). If you edit the rules here, edit BOTH files.
//
// What is NOT mirrored: eligibility. WELCOME25 is first-order-only, tracked per email,
// which needs a database lookup — so the browser can only ever show an optimistic figure.
// /api/coupon/validate confirms it once an email is known, and /api/checkout/initiate
// re-checks authoritatively before anything is charged.

export const WELCOME_CODE = "WELCOME25";
export const WELCOME_PERCENT = 25;

/** Codes handed out before the Independence Day bump to 25%. Still accepted, at the
 *  current percentage, so nobody holding an older popup/email code gets turned away. */
const LEGACY_CODES = ["WELCOME10", "WELCOME15"];

export type CouponResult = { valid: boolean; discount: number; reason?: string };

export const normalizeCode = (code: string): string => code.trim().toUpperCase();

/** `offerDiscount` is no longer a blocker — the welcome code stacks on top of the Raksha
 *  Bandhan offers (see api/_lib/coupons.ts for the rule). It stays in the signature
 *  because callers pass it and the server mirror needs the same shape. */
export function computeCoupon(code: string, discountedSubtotal: number, offerDiscount: number): CouponResult {
  const c = normalizeCode(code);
  if (!c) return { valid: false, discount: 0 };
  if (c !== WELCOME_CODE && !LEGACY_CODES.includes(c)) {
    return { valid: false, discount: 0, reason: "That code isn't valid." };
  }
  const discount = Math.round((discountedSubtotal * WELCOME_PERCENT) / 100);
  if (discount <= 0) return { valid: false, discount: 0, reason: "That code isn't valid for this cart." };
  return { valid: true, discount };
}
