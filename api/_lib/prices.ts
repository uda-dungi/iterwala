// Server-side price table — generated from src/data/products.ts.
//
// Why this exists: the frontend cart computes prices client-side (fine for display),
// but /api/checkout/initiate used to trust whatever `amounts.total` the browser sent
// and hash *that* for PayU. A tampered request (e.g. via devtools/curl) could set an
// arbitrary total and pay less than the real cart value. This table lets the API
// recompute the true order total from known catalog prices and reject anything that
// doesn't match, so the amount that gets signed and charged is never client-controlled.
//
// Regenerate after editing prices in src/data/products.ts: run a small Node script that
// transpiles products.ts (stubbing the Vite-only `img()`/import.meta.glob helper) and
// dumps `{ id: { price, compareAt, priceByVolume } }` for every product — see the repo's
// internal notes for the exact one-off script, or just hand-edit the changed entries below.

export type PriceEntry = {
  price: number;
  compareAt: number | null;
  priceByVolume: Record<string, { price: number; compareAt?: number }> | null;
};

export const PRICE_TABLE: Record<string, PriceEntry> = {
  "p-celebrity": { "price": 1099, "compareAt": 1399, "priceByVolume": {"100ml":{"price":1099,"compareAt":1399},"50ml":{"price":649,"compareAt":1099},"20ml":{"price":299,"compareAt":349}} },
  "p-impression": { "price": 1099, "compareAt": 1399, "priceByVolume": {"100ml":{"price":1099,"compareAt":1399},"50ml":{"price":649,"compareAt":1099}} },
  "p-inayat": { "price": 649, "compareAt": 849, "priceByVolume": {"100ml":{"price":649,"compareAt":849},"50ml":{"price":499,"compareAt":749}} },
  "p-oud-wood": { "price": 899, "compareAt": 1499, "priceByVolume": {"50ml":{"price":449,"compareAt":899},"100ml":{"price":899,"compareAt":1499}} },
  "p-sukoon": { "price": 899, "compareAt": 999, "priceByVolume": {"100ml":{"price":899,"compareAt":999},"20ml":{"price":249,"compareAt":999},"50ml":{"price":499,"compareAt":999}} },
  "p-touch": { "price": 899, "compareAt": 1599, "priceByVolume": {"50ml":{"price":499,"compareAt":899},"100ml":{"price":899,"compareAt":1599},"20ml":{"price":249,"compareAt":1599}} },
  "p-ocean-water": { "price": 749, "compareAt": 1099, "priceByVolume": {"100ml":{"price":749,"compareAt":1099},"50ml":{"price":499,"compareAt":1799}} },
  "p-white-musk": { "price": 649, "compareAt": 849, "priceByVolume": {"100ml":{"price":649,"compareAt":849},"20ml":{"price":299,"compareAt":349},"50ml":{"price":499,"compareAt":749}} },
  "p-temptation": { "price": 749, "compareAt": 1099, "priceByVolume": {"100ml":{"price":749,"compareAt":1099},"20ml":{"price":299,"compareAt":349},"50ml":{"price":499,"compareAt":749}} },
  "p-rose-petals": { "price": 649, "compareAt": 849, "priceByVolume": {"100ml":{"price":649,"compareAt":849},"50ml":{"price":499,"compareAt":749}} },
  "p-legend": { "price": 649, "compareAt": 849, "priceByVolume": {"100ml":{"price":649,"compareAt":849},"20ml":{"price":299,"compareAt":349},"50ml":{"price":499,"compareAt":749}} },
  "a-royal-oud": { "price": 899, "compareAt": 1199, "priceByVolume": null },
  "a-shahi-gulab": { "price": 699, "compareAt": null, "priceByVolume": null },
  "a-mogra-gold": { "price": 649, "compareAt": null, "priceByVolume": null },
  "a-rooh-chandan": { "price": 749, "compareAt": null, "priceByVolume": null },
  "a-jannat-firdaus": { "price": 649, "compareAt": 1099, "priceByVolume": null },
  "a-amber": { "price": 699, "compareAt": 1299, "priceByVolume": null },
  "a-rajnigandha": { "price": 599, "compareAt": null, "priceByVolume": null },
  "a-lavender": { "price": 549, "compareAt": null, "priceByVolume": null },
  "a-tulsi": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-ruh-kewra": { "price": 2199, "compareAt": 2599, "priceByVolume": null },
  "a-shyam-shringar": { "price": 649, "compareAt": null, "priceByVolume": null },
  "a-inayat": { "price": 549, "compareAt": 999, "priceByVolume": null },
  "a-aseel": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "g-discovery": { "price": 699, "compareAt": 1299, "priceByVolume": null },
  "g-aqua-duo": { "price": 599, "compareAt": 1299, "priceByVolume": null },
  "g-attar-duo": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "p-million": { "price": 749, "compareAt": 1099, "priceByVolume": {"100ml":{"price":749,"compareAt":1099},"50ml":{"price":489,"compareAt":1799}} },
  "p-smoke": { "price": 749, "compareAt": 1099, "priceByVolume": {"50ml":{"price":449,"compareAt":649},"100ml":{"price":749,"compareAt":1099}} },
  "p-dubai-fame": { "price": 549, "compareAt": 999, "priceByVolume": {"50ml":{"price":349,"compareAt":749},"100ml":{"price":549,"compareAt":999}} },
  "p-valentine": { "price": 749, "compareAt": 1099, "priceByVolume": {"100ml":{"price":749,"compareAt":1099},"50ml":{"price":499,"compareAt":1799}} },
  "p-aura": { "price": 949, "compareAt": 1299, "priceByVolume": {"100ml":{"price":949,"compareAt":1299},"50ml":{"price":649,"compareAt":1099}} },
  "p-melody": { "price": 549, "compareAt": 999, "priceByVolume": {"100ml":{"price":549,"compareAt":999},"50ml":{"price":349,"compareAt":749}} },
  "p-choco-blast": { "price": 749, "compareAt": 1099, "priceByVolume": {"100ml":{"price":749,"compareAt":1099},"20ml":{"price":299,"compareAt":349},"50ml":{"price":489,"compareAt":999}} },
  "p-honeymoon": { "price": 649, "compareAt": 849, "priceByVolume": {"100ml":{"price":649,"compareAt":849},"50ml":{"price":499,"compareAt":749}} },
  "p-blue-ice": { "price": 549, "compareAt": 999, "priceByVolume": {"100ml":{"price":549,"compareAt":999},"50ml":{"price":349,"compareAt":749}} },
  "a-sukoon": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-oud-wood": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-honeymoon": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-lotus": { "price": 699, "compareAt": 1299, "priceByVolume": null },
  "a-maati": { "price": 1099, "compareAt": 1299, "priceByVolume": null },
  "a-ruh-heena": { "price": 1399, "compareAt": 1599, "priceByVolume": null },
  "a-ruh-khus": { "price": 1999, "compareAt": 2499, "priceByVolume": null },
  "a-ruh-mogra": { "price": 1599, "compareAt": 2499, "priceByVolume": null },
  "g-signature-quad": { "price": 699, "compareAt": 1299, "priceByVolume": null },
  "g-rooh-chandan-duo": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "p-black-gold": { "price": 549, "compareAt": 999, "priceByVolume": null },
  "a-famous": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-feel-good": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-guldasta": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-kesar-gulab": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "g-whiteoud-blackoud-duo": { "price": 999, "compareAt": 1299, "priceByVolume": null },
  "g-mogragold-shahigulab-duo": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "g-royaloud-shyamshringar-duo": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "ce-shabd": { "price": 1999, "compareAt": 2999, "priceByVolume": null },
  "ce-kahani": { "price": 1999, "compareAt": 2999, "priceByVolume": null },
  "ce-ehsaas": { "price": 1999, "compareAt": 2999, "priceByVolume": null },
  "a-celebrity": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "p-wild": { "price": 899, "compareAt": 1799, "priceByVolume": {"100ml":{"price":899,"compareAt":1799},"50ml":{"price":449,"compareAt":1299}} },
  "a-saffron-sandal": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "p-feel-good": { "price": 1499, "compareAt": 1499, "priceByVolume": {"100ml":{"price":1499,"compareAt":1499},"50ml":{"price":489,"compareAt":1499}} },
  "a-impression": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-choco-blast": { "price": 599, "compareAt": 999, "priceByVolume": null },
  "p-chemistry": { "price": 1299, "compareAt": 1299, "priceByVolume": {"100ml":{"price":1299,"compareAt":1299},"20ml":{"price":249,"compareAt":699},"50ml":{"price":499,"compareAt":899}} },
  "a-shanaya": { "price": 569, "compareAt": 1699, "priceByVolume": null },
  "a-khawab": { "price": 1354, "compareAt": 1499, "priceByVolume": null },
  "a-million": { "price": 949, "compareAt": 1499, "priceByVolume": null },
  "a-noor-jahan": { "price": 994, "compareAt": 1499, "priceByVolume": null },
  "a-fitoor": { "price": 549, "compareAt": 1699, "priceByVolume": null },
  "p-poetry": { "price": 999, "compareAt": 1299, "priceByVolume": {"100ml":{"price":999,"compareAt":1299},"50ml":{"price":649,"compareAt":1099}} },
  "p-rebel": { "price": 999, "compareAt": 1299, "priceByVolume": {"100ml":{"price":999,"compareAt":1299},"50ml":{"price":649,"compareAt":1099}} },
  "g-royal-oud": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-smoke": { "price": 949, "compareAt": 1499, "priceByVolume": null },
  "a-dargah": { "price": 549, "compareAt": 1699, "priceByVolume": null },
  "a-touch": { "price": 949, "compareAt": 1499, "priceByVolume": null },
  "a-white-oud": { "price": 949, "compareAt": 1499, "priceByVolume": null },
  "a-wild": { "price": 949, "compareAt": 1499, "priceByVolume": null },
  "p-wanted": { "price": 899, "compareAt": 1499, "priceByVolume": {"100ml":{"price":899,"compareAt":1499},"50ml":{"price":649,"compareAt":1099}} },
  "a-zannat": { "price": 999, "compareAt": 1299, "priceByVolume": null },
};

/** Server-truth unit price for a product id + selected volume, mirroring src/data/products.ts's priceFor(). */
export function priceForServer(productId: string, volume?: string): number | null {
  const entry = PRICE_TABLE[productId];
  if (!entry) return null;
  if (volume && entry.priceByVolume && entry.priceByVolume[volume]) {
    return entry.priceByVolume[volume].price;
  }
  return entry.price;
}

export const FREE_SHIPPING_THRESHOLD = 499;
export const SHIPPING_FEE = 99;
export const GIFT_WRAP_FEE = 49;
