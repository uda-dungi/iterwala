// Independence Day Freedom Sale — automatic 25% off every product's original selling
// price, one day only (15 August 2026, India Standard Time). The product's true MRP
// (compareAt) still shows as the strikethrough — this is 25% off the already-marked-down
// selling price, not off the MRP.
//
// Date-gated so the sale switches on and off by itself at IST midnight, with no manual
// toggle and no redeploy needed — every call recomputes from the current clock rather
// than caching a flag. Mirrored byte-for-byte in api/_lib/independenceDaySale.ts so the
// price the browser shows and the price the server charges can never disagree (same
// pattern as offers.ts / coupons.ts / prices.ts).
//
// Stacks on top of the Raksha Bandhan Sale's BOGO offers (Pack of 4, Collector's
// Edition) rather than replacing them — see priceFor() / priceForServer() in
// products.ts / prices.ts, which apply this discount before offers.ts's BOGO math runs
// on the resulting (already discounted) unit price.

export const INDEPENDENCE_DAY_PERCENT = 25;

const SALE_YEAR = 2026;
const SALE_MONTH_INDEX = 7; // August (0-indexed)
const SALE_DAY = 15;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** True only on 15 August 2026, India Standard Time — computed fresh from the clock
 *  (accepts an override for tests), not cached, so it flips off at IST midnight on its
 *  own. */
export function isIndependenceDaySaleActive(now: Date = new Date()): boolean {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return (
    ist.getUTCFullYear() === SALE_YEAR &&
    ist.getUTCMonth() === SALE_MONTH_INDEX &&
    ist.getUTCDate() === SALE_DAY
  );
}

/** 25% off a base price, rounded to the nearest rupee, while the sale is active.
 *  Returns the base price unchanged once the sale has ended. */
export function independenceDayPrice(basePrice: number, now: Date = new Date()): number {
  if (!isIndependenceDaySaleActive(now)) return basePrice;
  return Math.round(basePrice * (1 - INDEPENDENCE_DAY_PERCENT / 100));
}
