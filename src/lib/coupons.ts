// Promo codes — client mirror of api/_lib/coupons.ts.
//
// The arithmetic and the no-stacking rule are duplicated byte-for-byte so the cart shows
// the same discount the server will actually charge (same reason src/lib/offers.ts mirrors
// api/_lib/offers.ts). If you edit the rules here, edit BOTH files.
//
// What is NOT mirrored: eligibility. WELCOME10 is first-order-only, tracked per email,
// which needs a database lookup — so the browser can only ever show an optimistic figure.
// /api/coupon/validate confirms it once an email is known, and /api/checkout/initiate
// re-checks authoritatively before anything is charged.

export const WELCOME_CODE = "WELCOME10";
export const WELCOME_PERCENT = 10;

export type CouponResult = { valid: boolean; discount: number; reason?: string };

export const normalizeCode = (code: string): string => code.trim().toUpperCase();

export function computeCoupon(code: string, discountedSubtotal: number, offerDiscount: number): CouponResult {
  const c = normalizeCode(code);
  if (!c) return { valid: false, discount: 0 };
  if (c !== WELCOME_CODE) return { valid: false, discount: 0, reason: "That code isn't valid." };
  if (offerDiscount > 0) {
    return {
      valid: false,
      discount: 0,
      reason: "WELCOME10 can't be combined with the Raksha Bandhan Sale — your cart already has a bigger saving.",
    };
  }
  const discount = Math.round((discountedSubtotal * WELCOME_PERCENT) / 100);
  if (discount <= 0) return { valid: false, discount: 0, reason: "That code isn't valid for this cart." };
  return { valid: true, discount };
}
