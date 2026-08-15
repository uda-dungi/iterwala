// Friendship Sale — automatic cart offers.
//
// The pure cart math in `computeOffers` is mirrored byte-for-byte in api/_lib/offers.ts
// so the browser's displayed discount and the server's *charged* discount can never
// disagree (same reason api/_lib/prices.ts mirrors src/data/products.ts). If you edit
// the logic or the constants below, edit BOTH files.
//
// To end the sale: flip FRIENDSHIP_SALE_ACTIVE to false here AND in api/_lib/offers.ts.
//
// Independence Day Freedom Sale (independenceDaySale.ts) stacks on top of these BOGO
// offers rather than replacing them — `unitPrice` below is already the post-25%-off
// price (via priceFor / priceForServer), so the BOGO math just runs on top of that.

import { isIndependenceDaySaleActive, INDEPENDENCE_DAY_PERCENT } from "@/lib/independenceDaySale";

export const FRIENDSHIP_SALE_ACTIVE = true;

/** Pack of 4 (Signature Quad) — every pair of boxes costs PACK_OF_4_PAIR_PRICE. */
export const PACK_OF_4_ID = "g-pack-of-4";
export const PACK_OF_4_PAIR_PRICE = 999;

/** Collector's Edition — buy any 3 (mix & match), cheapest is free. */
export const COLLECTORS_EDITION_IDS = ["ce-shabd", "ce-kahani", "ce-ehsaas"];

export type OfferLine = { code: string; label: string; amount: number };
export type CartLineInput = { id: string; qty: number; unitPrice: number };

/**
 * Total discount for a cart, plus a per-offer breakdown. `unitPrice` must be the
 * server-truth price of the line (priceFor / priceForServer), never a client-sent value.
 */
export function computeOffers(lines: CartLineInput[]): { discount: number; offers: OfferLine[] } {
  if (!FRIENDSHIP_SALE_ACTIVE) return { discount: 0, offers: [] };
  const offers: OfferLine[] = [];

  // Pack of 4 — pair pricing. 1 box = full price, every 2 boxes = PACK_OF_4_PAIR_PRICE.
  const pack = lines.find((l) => l.id === PACK_OF_4_ID);
  if (pack) {
    const pairs = Math.floor(pack.qty / 2);
    const saving = pairs * Math.max(0, pack.unitPrice * 2 - PACK_OF_4_PAIR_PRICE);
    if (saving > 0) {
      offers.push({ code: "PACK4_BOGO", label: pairs > 1 ? `Pack of 4 · Buy 1 Get 1 (×${pairs})` : "Pack of 4 · Buy 1 Get 1 Free", amount: saving });
    }
  }

  // Collector's Edition — for every 3 bottles (any mix), the cheapest is free.
  const cePrices: number[] = [];
  for (const l of lines) {
    if (COLLECTORS_EDITION_IDS.includes(l.id)) {
      for (let i = 0; i < l.qty; i++) cePrices.push(l.unitPrice);
    }
  }
  const freeCount = Math.floor(cePrices.length / 3);
  if (freeCount > 0) {
    cePrices.sort((a, b) => a - b); // free the cheapest ones
    const saving = cePrices.slice(0, freeCount).reduce((s, p) => s + p, 0);
    if (saving > 0) {
      offers.push({ code: "CE_B2G1", label: freeCount > 1 ? `Collector's Edition · Buy 2 Get 1 (×${freeCount})` : "Collector's Edition · Buy 2 Get 1 Free", amount: saving });
    }
  }

  return { discount: offers.reduce((s, o) => s + o.amount, 0), offers };
}

/** How many more of a participating item unlocks / extends its offer — drives the cart nudge. */
export function offerNudge(lines: CartLineInput[]): string | null {
  if (!FRIENDSHIP_SALE_ACTIVE) return null;
  const pack = lines.find((l) => l.id === PACK_OF_4_ID);
  if (pack && pack.qty % 2 === 1) {
    return "Add 1 more Pack of 4 to get Buy 1 Get 1 Free 🎁";
  }
  const ceQty = lines.filter((l) => COLLECTORS_EDITION_IDS.includes(l.id)).reduce((s, l) => s + l.qty, 0);
  if (ceQty > 0 && ceQty % 3 !== 0) {
    const need = 3 - (ceQty % 3);
    return `Add ${need} more Collector's Edition to get 1 free ✨`;
  }
  return null;
}

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Marketing copy for a participating product — used on product pages & cards. */
export function offerForProduct(id: string): { badge: string; headline: string; detail: string } | null {
  const independenceDay = isIndependenceDaySaleActive();

  if (FRIENDSHIP_SALE_ACTIVE && id === PACK_OF_4_ID) {
    return {
      badge: "Buy 1 Get 1 Free",
      headline: "Raksha Bandhan Sale · Buy 1 Get 1 Free",
      detail: independenceDay
        ? `Add 2 Pack of 4 gift sets for just ${inr(PACK_OF_4_PAIR_PRICE)} — plus ${INDEPENDENCE_DAY_PERCENT}% off everything today.`
        : `Add 2 Pack of 4 gift sets for just ${inr(PACK_OF_4_PAIR_PRICE)}.`,
    };
  }
  if (FRIENDSHIP_SALE_ACTIVE && COLLECTORS_EDITION_IDS.includes(id)) {
    return {
      badge: "Buy 2 Get 1 Free",
      headline: "Raksha Bandhan Sale · Buy 2 Get 1 Free",
      detail: independenceDay
        ? `Mix and match any three across Shabd, Kahani and Ehsaas — plus ${INDEPENDENCE_DAY_PERCENT}% off today.`
        : "Mix and match any three across Shabd, Kahani and Ehsaas.",
    };
  }
  if (independenceDay) {
    return {
      badge: `${INDEPENDENCE_DAY_PERCENT}% Off`,
      headline: `Independence Day Sale · Flat ${INDEPENDENCE_DAY_PERCENT}% Off`,
      detail: "Applied automatically at checkout — no code needed. Ends tonight, 15th August.",
    };
  }
  return null;
}
