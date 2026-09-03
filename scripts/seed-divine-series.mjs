/**
 * Divine Series — database migration (Sep 2026).
 *
 * The storefront reads products and their photos from Supabase; src/data/products.ts is
 * only the fallback snapshot used when those tables are empty. So adding the two Divine
 * Series sets to the code does NOT put them on the live site — this script does.
 *
 * ⚠ RUN THIS *AFTER* THE CODE IS DEPLOYED, NOT BEFORE.
 *
 * Every image below is referenced by a storage key that resolves against the deployed
 * JS bundle (see src/lib/imageSource.ts). Running this against the currently-live bundle
 * would point the database at files that build has never seen, and both new products —
 * plus Guldasta — would render blank placeholder tiles for real shoppers.
 *
 *   1. push the code, wait for the Vercel deploy to finish
 *   2. node scripts/seed-divine-series.mjs
 *
 * Safe to re-run: products are upserted by id, image rows are replaced per product, and
 * the Guldasta fix is skipped once its rows already point at the new files.
 *
 * Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (both already in .env).
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const env = { ...process.env };
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    if (env[k] === undefined) env[k] = line.slice(i + 1).trim();
  }
} catch { /* rely on the real environment */ }

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const sb = createClient(url, key);

/** Storage keys are paths below src/assets/ — they must match files in the deployed build. */
const PREMIUM_IMAGES = ["1", "2", "3", "4", "5"].map(n => `Divine Series/Premium Divine Series/${n}.jpg`);
const SET_IMAGES = ["163", "164", "165", "166", "167"].map(n => `Divine Series/Divine Series Set/${n}.jpg`);
const GULDASTA_IMAGES = ["1", "2", "3", "4", "5"].map(n => `new Product Gallery/Guldasta/${n}.jpg`);

const PRODUCTS = [
  {
    id: "g-premium-divine-series",
    slug: "premium-divine-series",
    name: "Premium Divine Series",
    tagline: "Eight premium attars, one gift box",
    description:
      "Eight of our premium attars together in one gift box — Shahi Gulab, Royal Oud, Lavender, Mogra Gold, Rajnigandha, Shyam Shringar, Lotus and Rooh Chandan. Alcohol-free, traditionally crafted, and presented ready to give.",
    ingredients: "Eight alcohol-free premium attars in a luxury gift box.",
    category: "Gift Set",
    gender: "Unisex",
    price: 1299,
    // compare_at intentionally null — no MRP was supplied, and a fabricated "was" price
    // would show shoppers a discount that does not exist. Set it to switch the badge on.
    compare_at: null,
    volumes: ["Gift Box"],
    notes: { top: ["Rose", "Lavender"], heart: ["Mogra", "Rajnigandha", "Lotus"], base: ["Oud", "Sandalwood"] },
    longevity: "10+ hours",
    projection: "Moderate",
    occasions: ["Gifting", "Festive", "Pooja"],
    moods: ["Pure", "Timeless"],
    rating: 4.8,
    reviews_count: 0,
    new_arrival: true,
    archived: false,
    images: PREMIUM_IMAGES,
  },
  {
    id: "g-divine-series-set",
    slug: "divine-series-set",
    name: "Divine Series Set",
    tagline: "Shahi Chandan & Red Rose, boxed",
    description:
      "A four-bottle attar set — Shahi Chandan and Red Rose, two of each — in a signature Itrawala gift box. Alcohol-free and traditionally crafted, made for festive gifting.",
    ingredients: "Four alcohol-free premium attars in a luxury gift box.",
    category: "Gift Set",
    gender: "Unisex",
    price: 999,
    compare_at: null,
    volumes: ["Gift Box"],
    notes: { top: ["Rose"], heart: ["Red Rose", "Sandalwood"], base: ["Chandan", "Musk"] },
    longevity: "10 hours",
    projection: "Intimate",
    occasions: ["Gifting", "Festive", "Pooja"],
    moods: ["Joyful", "Pure"],
    rating: 4.7,
    reviews_count: 0,
    new_arrival: true,
    archived: false,
    images: SET_IMAGES,
  },
];

async function setImages(productId, keys) {
  const { error: delErr } = await sb.from("product_images").delete().eq("product_id", productId);
  if (delErr) throw new Error(`clearing images for ${productId}: ${delErr.message}`);
  const rows = keys.map((storage_key, position) => ({ product_id: productId, source: "repo", storage_key, position }));
  const { error } = await sb.from("product_images").insert(rows);
  if (error) throw new Error(`inserting images for ${productId}: ${error.message}`);
  return rows.length;
}

async function main() {
  // Append after the current last product rather than colliding with an existing slot.
  const { data: last } = await sb.from("products").select("position").order("position", { ascending: false }).limit(1);
  let position = (last?.[0]?.position ?? 0) + 1;

  for (const { images, ...product } of PRODUCTS) {
    const { data: existing } = await sb.from("products").select("id,position").eq("id", product.id).maybeSingle();
    const row = { ...product, position: existing?.position ?? position++ };
    const { error } = await sb.from("products").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`upserting ${product.id}: ${error.message}`);
    const n = await setImages(product.id, images);
    console.log(`${existing ? "updated" : "created"}  ${product.name.padEnd(24)} ₹${product.price}  (${n} images)`);
  }

  // Guldasta's rows still point at 163-167.jpg, which moved to the Divine Series Set.
  const { data: g } = await sb.from("product_images").select("storage_key").eq("product_id", "a-guldasta");
  const stale = (g ?? []).some(r => /\/16[3-7]\.jpg$/.test(r.storage_key ?? ""));
  if (stale) {
    const n = await setImages("a-guldasta", GULDASTA_IMAGES);
    console.log(`updated  ${"Guldasta".padEnd(24)} (${n} images repointed to the real bottle shots)`);
  } else {
    console.log(`skipped  ${"Guldasta".padEnd(24)} (already repointed)`);
  }

  console.log("\nDone. Hard-refresh the storefront to see it.");
}

main().catch(err => { console.error("\nFAILED:", err.message); process.exit(1); });
