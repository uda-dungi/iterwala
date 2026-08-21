// Friendship Sale — automatic cart offers.
//
// The pure cart math in `computeOffers` is mirrored byte-for-byte in api/_lib/offers.ts
// so the browser's displayed discount and the server's *charged* discount can never
// disagree (same reason api/_lib/prices.ts mirrors src/data/products.ts). If you edit
// the logic or the constants below, edit BOTH files.
//
// To end the sale: flip FRIENDSHIP_SALE_ACTIVE to false here AND in api/_lib/offers.ts.

export const FRIENDSHIP_SALE_ACTIVE = true;

/** Pack of 4 (Signature Quad) — every pair of boxes costs PACK_OF_4_PAIR_PRICE. */
export const PACK_OF_4_ID = "g-pack-of-4";
export const PACK_OF_4_PAIR_PRICE = 999;

/** Pack of 8 (Discovery / Octet) — every pair of boxes costs PACK_OF_8_PAIR_PRICE,
 *  the same pair price as Pack of 4 (both boxes list at 699). */
export const PACK_OF_8_ID = "g-discovery";
export const PACK_OF_8_PAIR_PRICE = 999;

/** Gift boxes sold on pair pricing: 1 box = full price, every 2 boxes = `pairPrice`.
 *  Driven off a table rather than repeated per product so adding the next pack is one
 *  line here instead of another copy of the same arithmetic in three functions. */
type PairPack = { id: string; pairPrice: number; name: string; code: string };
const PAIR_PRICE_PACKS: PairPack[] = [
  { id: PACK_OF_4_ID, pairPrice: PACK_OF_4_PAIR_PRICE, name: "Pack of 4", code: "PACK4_BOGO" },
  { id: PACK_OF_8_ID, pairPrice: PACK_OF_8_PAIR_PRICE, name: "Pack of 8", code: "PACK8_BOGO" },
];

/** Collector's Edition — buy any 3 (mix & match), cheapest is free. */
export const COLLECTORS_EDITION_IDS = ["ce-shabd", "ce-kahani", "ce-ehsaas"];

export type OfferLine = { code: string; label: string; amount: number };
export type CartLineInput = { id: string; qty: number; unitPrice: number };

/** Every individual box of `id` in the cart, one entry per unit, as its unit price.
 *
 *  A cart line is product + variant, so ONE product can occupy several lines — Pack of 8
 *  ships two lineups and Pack of 4 five, meaning "Variant 1 ×1 + Variant 2 ×1" is two
 *  boxes spread over two lines. Matching a single line (`lines.find`) counted that as one
 *  box and silently withheld the offer the shopper had already earned, so every line for
 *  the product is expanded and counted together. */
function unitsOf(lines: CartLineInput[], id: string): number[] {
  const units: number[] = [];
  for (const l of lines) {
    if (l.id !== id) continue;
    for (let i = 0; i < l.qty; i++) units.push(l.unitPrice);
  }
  return units;
}

/**
 * Total discount for a cart, plus a per-offer breakdown. `unitPrice` must be the
 * server-truth price of the line (priceFor / priceForServer), never a client-sent value.
 */
export function computeOffers(lines: CartLineInput[]): { discount: number; offers: OfferLine[] } {
  if (!FRIENDSHIP_SALE_ACTIVE) return { discount: 0, offers: [] };
  const offers: OfferLine[] = [];

  // Pair-priced gift boxes. 1 box = full price, every 2 boxes = pairPrice.
  for (const pack of PAIR_PRICE_PACKS) {
    const units = unitsOf(lines, pack.id);
    const pairs = Math.floor(units.length / 2);
    if (pairs < 1) continue;
    // Dearest boxes go into the pairs, so a mixed-price cart discounts in the shopper's
    // favour rather than by whichever line happened to come first.
    units.sort((a, b) => b - a);
    const paired = units.slice(0, pairs * 2).reduce((s, p) => s + p, 0);
    const saving = Math.max(0, paired - pairs * pack.pairPrice);
    if (saving > 0) {
      offers.push({
        code: pack.code,
        label: pairs > 1 ? `${pack.name} · Buy 1 Get 1 (×${pairs})` : `${pack.name} · Buy 1 Get 1 Free`,
        amount: saving,
      });
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
  for (const pack of PAIR_PRICE_PACKS) {
    const qty = unitsOf(lines, pack.id).length;
    if (qty > 0 && qty % 2 === 1) {
      return `Add 1 more ${pack.name} to get Buy 1 Get 1 Free 🎁`;
    }
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
  if (!FRIENDSHIP_SALE_ACTIVE) return null;
  const pack = PAIR_PRICE_PACKS.find((p) => p.id === id);
  if (pack) {
    return {
      badge: "Buy 1 Get 1 Free",
      headline: "Raksha Bandhan Sale · Buy 1 Get 1 Free",
      detail: `Add 2 ${pack.name} gift sets for just ${inr(pack.pairPrice)}.`,
    };
  }
  if (COLLECTORS_EDITION_IDS.includes(id)) {
    return {
      badge: "Buy 2 Get 1 Free",
      headline: "Raksha Bandhan Sale · Buy 2 Get 1 Free",
      detail: "Mix and match any three across Shabd, Kahani and Ehsaas.",
    };
  }
  return null;
}
