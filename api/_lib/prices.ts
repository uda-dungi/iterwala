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
  "p-celebrity": { "price": 1099, "compareAt": 1399, "priceByVolume": { "50ml": { "price": 649, "compareAt": 849 }, "100ml": { "price": 1099, "compareAt": 1399 } } },
  "p-impression": { "price": 1099, "compareAt": 1399, "priceByVolume": { "50ml": { "price": 649, "compareAt": 1099 }, "100ml": { "price": 1099, "compareAt": 1399 } } },
  "p-inayat": { "price": 649, "compareAt": 849, "priceByVolume": { "50ml": { "price": 399, "compareAt": 499 }, "100ml": { "price": 649, "compareAt": 849 } } },
  "p-oud-wood": { "price": 449, "compareAt": 899, "priceByVolume": { "50ml": { "price": 449, "compareAt": 899 }, "100ml": { "price": 749, "compareAt": 1499 } } },
  "p-sukoon": { "price": 899, "compareAt": null, "priceByVolume": { "50ml": { "price": 549 }, "100ml": { "price": 899 } } },
  "p-touch": { "price": 799, "compareAt": 999, "priceByVolume": { "50ml": { "price": 499, "compareAt": 599 }, "100ml": { "price": 799, "compareAt": 999 } } },
  "p-ocean-water": { "price": 749, "compareAt": null, "priceByVolume": { "50ml": { "price": 449 }, "100ml": { "price": 749 } } },
  "p-white-musk": { "price": 649, "compareAt": 849, "priceByVolume": { "50ml": { "price": 399, "compareAt": 499 }, "100ml": { "price": 649, "compareAt": 849 } } },
  "p-temptation": { "price": 749, "compareAt": 1099, "priceByVolume": { "50ml": { "price": 449, "compareAt": 649 }, "100ml": { "price": 749, "compareAt": 1099 } } },
  "p-rose-petals": { "price": 649, "compareAt": 849, "priceByVolume": { "50ml": { "price": 399, "compareAt": 499 }, "100ml": { "price": 649, "compareAt": 849 } } },
  "p-legend": { "price": 649, "compareAt": 849, "priceByVolume": { "50ml": { "price": 399, "compareAt": 499 }, "100ml": { "price": 649, "compareAt": 849 } } },
  "a-royal-oud": { "price": 899, "compareAt": 1199, "priceByVolume": null },
  "a-shahi-gulab": { "price": 699, "compareAt": null, "priceByVolume": null },
  "a-mogra-gold": { "price": 649, "compareAt": null, "priceByVolume": null },
  "a-rooh-chandan": { "price": 749, "compareAt": null, "priceByVolume": null },
  "a-jannat-firdaus": { "price": 799, "compareAt": null, "priceByVolume": null },
  "a-amber": { "price": 699, "compareAt": 1299, "priceByVolume": null },
  "a-rajnigandha": { "price": 599, "compareAt": null, "priceByVolume": null },
  "a-lavender": { "price": 549, "compareAt": null, "priceByVolume": null },
  "a-tulsi": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "a-ruh-kewra": { "price": 2199, "compareAt": 2599, "priceByVolume": null },
  "a-shyam-shringar": { "price": 649, "compareAt": null, "priceByVolume": null },
  "a-inayat": { "price": 699, "compareAt": null, "priceByVolume": null },
  "a-aseel": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "g-discovery": { "price": 1499, "compareAt": 1999, "priceByVolume": null },
  "g-aqua-duo": { "price": 599, "compareAt": 1299, "priceByVolume": null },
  "g-attar-duo": { "price": 499, "compareAt": 1299, "priceByVolume": null },
  "p-million": { "price": 749, "compareAt": 1099, "priceByVolume": { "50ml": { "price": 449, "compareAt": 649 }, "100ml": { "price": 749, "compareAt": 1099 } } },
  "p-smoke": { "price": 749, "compareAt": 1099, "priceByVolume": { "50ml": { "price": 449, "compareAt": 649 }, "100ml": { "price": 749, "compareAt": 1099 } } },
  "p-dubai-fame": { "price": 549, "compareAt": 999, "priceByVolume": { "50ml": { "price": 349, "compareAt": 749 }, "100ml": { "price": 549, "compareAt": 999 } } },
  "p-valentine": { "price": 749, "compareAt": 1099, "priceByVolume": { "50ml": { "price": 449, "compareAt": 649 }, "100ml": { "price": 749, "compareAt": 1099 } } },
  "p-aura": { "price": 949, "compareAt": 1299, "priceByVolume": { "50ml": { "price": 599, "compareAt": 799 }, "100ml": { "price": 949, "compareAt": 1299 } } },
  "p-melody": { "price": 549, "compareAt": 999, "priceByVolume": { "50ml": { "price": 349, "compareAt": 599 }, "100ml": { "price": 549, "compareAt": 999 } } },
  "p-choco-blast": { "price": 749, "compareAt": 1099, "priceByVolume": { "50ml": { "price": 449, "compareAt": 649 }, "100ml": { "price": 749, "compareAt": 1099 } } },
  "p-honeymoon": { "price": 649, "compareAt": 849, "priceByVolume": { "50ml": { "price": 399, "compareAt": 499 }, "100ml": { "price": 649, "compareAt": 849 } } },
  "p-blue-ice": { "price": 549, "compareAt": 999, "priceByVolume": { "50ml": { "price": 349, "compareAt": 599 }, "100ml": { "price": 549, "compareAt": 999 } } },
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
