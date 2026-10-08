// Karwa Chauth Sale free gift — a 10ml attar added at no charge once the order reaches
// FREE_GIFT_MIN_ORDER. Mirrored in api/_lib/freeGift.ts: the server re-checks the threshold
// and the gift id before recording the gift on the order, so edit BOTH files together.

export const FREE_GIFT_MIN_ORDER = 999;
/** Dearest attar in the gift pool (Royal Oud) — shown as "worth up to" on product pages. */
export const FREE_GIFT_MAX_WORTH = 899;
export const FREE_GIFT_VOLUME = "10ml";
export const FREE_GIFT_LABEL = "🎁 Free Gift — 10ml Attar (Karwa Chauth Special)";

/** Product ids the gift is drawn from (Inayat Attar, Jannat Firdaus, Royal Oud, Amber, Lavender, Aseel). */
export const FREE_GIFT_IDS = ["a-inayat", "a-jannat-firdaus", "a-royal-oud", "a-amber", "a-lavender", "a-aseel"];

export const pickFreeGiftId = () => FREE_GIFT_IDS[Math.floor(Math.random() * FREE_GIFT_IDS.length)];

/** Gift Sets (incl. Divine Series) — ids start "g-" — don't earn the free attar nor count toward its minimum. */
export const isFreeGiftExcluded = (productId: string) => productId.startsWith("g-");

/** `discountedSubtotal` = cart value after automatic offers, before promo codes. */
export const qualifiesForFreeGift = (discountedSubtotal: number) => discountedSubtotal >= FREE_GIFT_MIN_ORDER;
