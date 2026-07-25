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

export const PACK_OF_4_ID = "g-signature-quad";
export const PACK_OF_4_PAIR_PRICE = 1049;

export const COLLECTORS_EDITION_IDS = ["ce-shabd", "ce-kahani", "ce-ehsaas"];

export type OfferLine = { code: string; label: string; amount: number };
export type CartLineInput = { id: string; qty: number; unitPrice: number };

export function computeOffers(lines: CartLineInput[]): { discount: number; offers: OfferLine[] } {
  if (!FRIENDSHIP_SALE_ACTIVE) return { discount: 0, offers: [] };
  const offers: OfferLine[] = [];

  const pack = lines.find((l) => l.id === PACK_OF_4_ID);
  if (pack) {
    const pairs = Math.floor(pack.qty / 2);
    const saving = pairs * Math.max(0, pack.unitPrice * 2 - PACK_OF_4_PAIR_PRICE);
    if (saving > 0) {
      offers.push({ code: "PACK4_BOGO", label: pairs > 1 ? `Pack of 4 · Buy 1 Get 1 (×${pairs})` : "Pack of 4 · Buy 1 Get 1 Free", amount: saving });
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
