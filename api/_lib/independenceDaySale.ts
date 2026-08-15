/**
 * Independence Day Freedom Sale — SERVER copy of the date gate and discount math.
 *
 * Byte-for-byte mirror of src/lib/independenceDaySale.ts. Exists so /api/checkout/initiate
 * and /api/coupon/validate charge exactly the discount the browser showed, computed from
 * server-truth prices and the server's own clock — never from anything the client sent.
 * Keep the two files in sync (same reason api/_lib/prices.ts mirrors src/data/products.ts).
 */

export const INDEPENDENCE_DAY_PERCENT = 10;

const SALE_YEAR = 2026;
const SALE_MONTH_INDEX = 7; // August (0-indexed)
const SALE_DAY = 15;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** True only on 15 August 2026, India Standard Time — computed fresh from the clock on
 *  every call, so it flips off at IST midnight on its own with no redeploy. */
export function isIndependenceDaySaleActive(now: Date = new Date()): boolean {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return (
    ist.getUTCFullYear() === SALE_YEAR &&
    ist.getUTCMonth() === SALE_MONTH_INDEX &&
    ist.getUTCDate() === SALE_DAY
  );
}

/** 10% off a base price, rounded to the nearest rupee, while the sale is active. */
export function independenceDayPrice(basePrice: number, now: Date = new Date()): number {
  if (!isIndependenceDaySaleActive(now)) return basePrice;
  return Math.round(basePrice * (1 - INDEPENDENCE_DAY_PERCENT / 100));
}
