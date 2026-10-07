// Mirror of src/lib/freeGift.ts — keep in sync.

export const FREE_GIFT_MIN_ORDER = 999;
export const FREE_GIFT_VOLUME = "10ml";

export const FREE_GIFT_IDS = ["a-inayat", "a-jannat-firdaus", "a-royal-oud", "a-amber", "a-lavender", "a-aseel"];

/** The ₹0 order line for the gift, or null when the order doesn't qualify or the id isn't on the list. */
export function freeGiftLine(giftId: unknown, giftName: unknown, discountedSubtotal: number) {
  if (discountedSubtotal < FREE_GIFT_MIN_ORDER) return null;
  if (typeof giftId !== "string" || !FREE_GIFT_IDS.includes(giftId)) return null;
  const name = typeof giftName === "string" ? giftName.replace(/[^\x20-\x7E]/g, "").slice(0, 60) : "Attar";
  return { id: giftId, volume: FREE_GIFT_VOLUME, name: `FREE GIFT - ${name} (${FREE_GIFT_VOLUME})`, price: 0, qty: 1, gift: true };
}
