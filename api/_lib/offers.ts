// Friendship Sale — SERVER copy of the cart offer math.
//
// This is a byte-for-byte mirror of `computeOffers` (and its constants) in
// src/lib/offers.ts. It exists so /api/checkout/initiate charges exactly the discount
// the browser showed — the amount that gets signed into the PayU hash is computed here,
// from server-truth prices, never from anything the client sent. Keep the two in sync
// (same reason api/_lib/prices.ts mirrors src/data/products.ts).
//
// To end the sale: flip FRIENDSHIP_SALE_ACTIVE to false here AND in src/lib/offers.ts.

export const FRIENDSHIP_SALE_ACTIVE = true;

export const PACK_OF_4_ID = "g-pack-of-4";
export const PACK_OF_4_PAIR_PRICE = 999;

export const PACK_OF_8_ID = "g-discovery";
export const PACK_OF_8_PAIR_PRICE = 699;

type PairPack = { id: string; pairPrice: number; name: string; code: string };
const PAIR_PRICE_PACKS: PairPack[] = [
  { id: PACK_OF_4_ID, pairPrice: PACK_OF_4_PAIR_PRICE, name: "Pack of 4", code: "PACK4_BOGO" },
  { id: PACK_OF_8_ID, pairPrice: PACK_OF_8_PAIR_PRICE, name: "Pack of 8", code: "PACK8_BOGO" },
];

export const COLLECTORS_EDITION_IDS = ["ce-shabd", "ce-kahani", "ce-ehsaas"];

export type OfferLine = { code: string; label: string; amount: number };
export type CartLineInput = { id: string; qty: number; unitPrice: number };

/** One entry per physical box, across every cart line carrying this product — a product
 *  with variants (Pack of 8, Pack of 4) occupies one line per variant, so matching a
 *  single line would undercount the boxes and undercharge/overcharge against the browser. */
function unitsOf(lines: CartLineInput[], id: string): number[] {
  const units: number[] = [];
  for (const l of lines) {
    if (l.id !== id) continue;
    for (let i = 0; i < l.qty; i++) units.push(l.unitPrice);
  }
  return units;
}

export function computeOffers(lines: CartLineInput[]): { discount: number; offers: OfferLine[] } {
  if (!FRIENDSHIP_SALE_ACTIVE) return { discount: 0, offers: [] };
  const offers: OfferLine[] = [];

  for (const pack of PAIR_PRICE_PACKS) {
    const units = unitsOf(lines, pack.id);
    const pairs = Math.floor(units.length / 2);
    if (pairs < 1) continue;
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

  const cePrices: number[] = [];
  for (const l of lines) {
    if (COLLECTORS_EDITION_IDS.includes(l.id)) {
      for (let i = 0; i < l.qty; i++) cePrices.push(l.unitPrice);
    }
  }
  const freeCount = Math.floor(cePrices.length / 3);
  if (freeCount > 0) {
    cePrices.sort((a, b) => a - b);
    const saving = cePrices.slice(0, freeCount).reduce((s, p) => s + p, 0);
    if (saving > 0) {
      offers.push({ code: "CE_B2G1", label: freeCount > 1 ? `Collector's Edition · Buy 2 Get 1 (×${freeCount})` : "Collector's Edition · Buy 2 Get 1 Free", amount: saving });
    }
  }

  return { discount: offers.reduce((s, o) => s + o.amount, 0), offers };
}
