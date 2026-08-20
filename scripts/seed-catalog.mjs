/**
 * Generates the one-time catalogue seed: src/data/products.ts → seed-catalog.sql
 *
 *   node scripts/seed-catalog.mjs
 *
 * WHY THIS IS NOT A REGEX JOB
 * Earlier scripts in this folder transpile products.ts by regex-stripping types and
 * stubbing `img()` to return its own argument. That loses the real image mapping — and
 * the mapping is the whole point here, because every one of the 851 committed photos
 * has to land in product_images with the exact path the storefront resolver expects.
 *
 * Instead this:
 *   1. Transpiles products.ts with esbuild (real TypeScript, no regex).
 *   2. Replaces Vite's `import.meta.glob(...)` with a filesystem walk that returns an
 *      IDENTITY map — "../assets/x.jpg" → "../assets/x.jpg". Vite normally maps those
 *      keys to hashed build URLs; mapping them to themselves means every helper in
 *      products.ts (galleryImagesFor, GALLERY_ORDER sorting, the PACK_EXCLUDE filter,
 *      the dark-background-first ordering) runs completely untouched and returns
 *      source paths instead of URLs.
 *
 * So the seed preserves the curated gallery order exactly as it renders today, rather
 * than re-deriving it and quietly changing which photo leads each product.
 *
 * Output is SQL rather than direct inserts: it is reviewable before it touches the
 * database, and it is idempotent (ON CONFLICT DO UPDATE), so re-running after a fix is
 * safe.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src/data/products.ts");
const ASSETS = path.join(ROOT, "src/assets");
const OUT = path.join(ROOT, "seed-catalog.sql");

/* ── 1 · read every asset once, so the glob shim is a lookup not a walk ─────── */

const allAssets = [];
(function walk(dir, rel = "") {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walk(abs, relPath);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) allAssets.push(relPath.replace(/\\/g, "/"));
  }
})(ASSETS);

/**
 * Stands in for Vite's import.meta.glob. Accepts the same patterns products.ts uses
 * and returns { "../assets/<path>": "../assets/<path>" }.
 */
function globFs(patterns) {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const out = {};
  for (const pattern of list) {
    // "../assets/Product Gallery/**/*.{png,jpg}" → prefix "Product Gallery/"
    const prefix = pattern.replace(/^\.\.\/assets\//, "").split("*")[0];
    for (const asset of allAssets) {
      if (!asset.startsWith(prefix)) continue;
      // A single-star pattern ("products/*.jpg") must not match nested files.
      if (!pattern.includes("**")) {
        const rest = asset.slice(prefix.length);
        if (rest.includes("/")) continue;
      }
      out[`../assets/${asset}`] = `../assets/${asset}`;
    }
  }
  return out;
}

/* ── 2 · transpile products.ts and evaluate it with the shim in scope ───────── */

const result = await build({
  entryPoints: [SRC],
  bundle: false,
  write: false,
  format: "cjs",
  platform: "node",
  target: "node18",
  loader: { ".ts": "ts" },
  logLevel: "silent",
});

let code = result.outputFiles[0].text;

// esbuild rewrites `import.meta.x` to `import_meta.x` and emits its own empty
// `import_meta` shim, so the substitution has to run on the transpiled output — not
// the source — and both spellings are handled in case that changes.
code = code
  .replace(/import\.meta\.glob/g, "__globFs")
  .replace(/import_meta\.glob/g, "__globFs")
  .replace(/import\.meta\.env/g, "__env")
  .replace(/import_meta\.env/g, "__env");

const module = { exports: {} };
new Function("module", "exports", "require", "__globFs", "__env", code)(
  module,
  module.exports,
  () => ({}),
  globFs,
  { DEV: false, PROD: true }
);

const { products, collections, NEW_LAUNCH_SLUGS } = module.exports;

if (!Array.isArray(products) || !products.length) {
  console.error("Failed to load products from products.ts");
  process.exit(1);
}

/* ── 3 · helpers ───────────────────────────────────────────────────────────── */

const q = (v) => (v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === null || v === undefined || v === "" ? "NULL" : Number(v));
const bool = (v) => (v ? "true" : "false");
const jsonb = (v) =>
  v === null || v === undefined ? "NULL" : `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
const textArray = (v) =>
  !v || !v.length ? "'{}'" : `ARRAY[${v.map((x) => q(x)).join(",")}]::text[]`;

/** "../assets/product-gallery-3/Maati/321.jpg" → "product-gallery-3/Maati/321.jpg"
 *  Anything that isn't a source path (a data: placeholder from a missing file) is
 *  dropped, so the seed never writes an unresolvable key. */
const toStorageKey = (v) => {
  if (typeof v !== "string" || !v.startsWith("../assets/")) return null;
  return v.slice("../assets/".length);
};

/* ── 4 · emit ──────────────────────────────────────────────────────────────── */

const lines = [];
lines.push("-- Generated by scripts/seed-catalog.mjs — do not edit by hand.");
lines.push(`-- Source: src/data/products.ts (${products.length} products)`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push("--");
lines.push("-- Run AFTER admin-schema.sql. Idempotent: safe to re-run.");
lines.push("");
lines.push("begin;");
lines.push("");

/* products */
lines.push("-- ── products ───────────────────────────────────────────────────────────────");
for (const p of products) {
  lines.push(`insert into public.products (
  id, slug, name, tagline, description, ingredients, category, gender,
  price, compare_at, price_by_volume, volumes, featured_volume, variant_label,
  content_by_volume, notes, longevity, projection, occasions, moods,
  rating, reviews_count, badge, best_seller, new_arrival, trending,
  amazon_choice, amazon_url, video_url, position
) values (
  ${q(p.id)}, ${q(p.slug)}, ${q(p.name)}, ${q(p.tagline)}, ${q(p.description)}, ${q(p.ingredients)},
  ${q(p.category)}, ${q(p.gender)},
  ${num(p.price)}, ${num(p.compareAt)}, ${jsonb(p.priceByVolume ?? null)},
  ${textArray(p.volume)}, ${q(p.featuredVolume)}, ${q(p.variantLabel)},
  ${jsonb(p.contentByVolume ?? null)}, ${jsonb(p.notes)},
  ${q(p.longevity)}, ${q(p.projection)}, ${textArray(p.occasions)}, ${textArray(p.moods)},
  ${num(p.rating)}, ${num(p.reviews)}, ${q(p.badge)},
  ${bool(p.bestSeller)}, ${bool(p.newArrival)}, ${bool(p.trending)},
  ${bool(p.amazonChoice)}, ${q(p.amazonUrl)}, ${q(p.videoUrl)},
  ${products.indexOf(p)}
)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, tagline = excluded.tagline,
  description = excluded.description, ingredients = excluded.ingredients,
  category = excluded.category, gender = excluded.gender,
  price = excluded.price, compare_at = excluded.compare_at,
  price_by_volume = excluded.price_by_volume, volumes = excluded.volumes,
  featured_volume = excluded.featured_volume, variant_label = excluded.variant_label,
  content_by_volume = excluded.content_by_volume, notes = excluded.notes,
  longevity = excluded.longevity, projection = excluded.projection,
  occasions = excluded.occasions, moods = excluded.moods,
  rating = excluded.rating, reviews_count = excluded.reviews_count,
  badge = excluded.badge, best_seller = excluded.best_seller,
  new_arrival = excluded.new_arrival, trending = excluded.trending,
  amazon_choice = excluded.amazon_choice, amazon_url = excluded.amazon_url,
  video_url = excluded.video_url, position = excluded.position;`);
  lines.push("");
}

/* images */
lines.push("-- ── product images ─────────────────────────────────────────────────────────");
lines.push("-- Rebuilt from scratch each run so a re-seed can't duplicate galleries.");
lines.push("delete from public.product_images where source = 'repo';");
lines.push("");

let imageCount = 0;
let skipped = 0;

for (const p of products) {
  const rows = [];

  // General gallery (volume NULL).
  const gallery = Array.isArray(p.gallery) ? p.gallery : [];
  gallery.forEach((src, i) => {
    const key = toStorageKey(src);
    if (!key) { skipped++; return; }
    rows.push({ volume: null, key, position: i });
  });

  // Size-scoped galleries.
  if (p.galleryByVolume) {
    for (const [volume, list] of Object.entries(p.galleryByVolume)) {
      (list || []).forEach((src, i) => {
        const key = toStorageKey(src);
        if (!key) { skipped++; return; }
        rows.push({ volume, key, position: i });
      });
    }
  }

  for (const r of rows) {
    imageCount++;
    lines.push(
      `insert into public.product_images (product_id, volume, source, storage_key, position) ` +
        `values (${q(p.id)}, ${r.volume ? q(r.volume) : "NULL"}, 'repo', ${q(r.key)}, ${r.position});`
    );
  }
}
lines.push("");

/* collections */
lines.push("-- ── collections ────────────────────────────────────────────────────────────");
(collections || []).forEach((c, i) => {
  lines.push(`insert into public.collections (key, title, blurb, sub, position, active)
values (${q(c.key)}, ${q(c.title)}, ${q(c.blurb)}, ${textArray([...c.sub])}, ${i}, true)
on conflict (key) do update set
  title = excluded.title, blurb = excluded.blurb, sub = excluded.sub, position = excluded.position;`);
});
lines.push("");

/* announcements — mirrors src/config/site.ts at time of seeding */
lines.push("-- ── announcements ──────────────────────────────────────────────────────────");
lines.push("-- Seeded only when the table is empty, so a re-run can't resurrect lines the");
lines.push("-- admin has since deleted.");
const ANNOUNCEMENTS = [
  "✦ Raksha Bandhan Sale is Live Now ✦",
  "New Here? Get 15% Off with Code WELCOME15",
  "Free Shipping",
  "Amazon's Choice Products Available",
  "100% Money-Back Guarantee",
  "WhatsApp Support — We reply fast",
];
lines.push(`insert into public.announcements (text, position, active)
select * from (values
${ANNOUNCEMENTS.map((t, i) => `  (${q(t)}, ${i}, true)`).join(",\n")}
) as v(text, position, active)
where not exists (select 1 from public.announcements);`);
lines.push("");

/* settings */
lines.push("-- ── settings ───────────────────────────────────────────────────────────────");
const settings = {
  new_launch_slugs: [...(NEW_LAUNCH_SLUGS || [])],
  delivery_estimate: "Delivered within 6 business days",
  trading_since: 2020,
};
for (const [key, value] of Object.entries(settings)) {
  lines.push(`insert into public.site_settings (key, value) values (${q(key)}, ${jsonb(value)})
on conflict (key) do update set value = excluded.value, updated_at = now();`);
}
lines.push("");
lines.push("commit;");
lines.push("");

fs.writeFileSync(OUT, lines.join("\n"), "utf8");

console.log(`✓ ${path.relative(ROOT, OUT)}`);
console.log(`  products     ${products.length}`);
console.log(`  images       ${imageCount}`);
console.log(`  collections  ${(collections || []).length}`);
console.log(`  settings     ${Object.keys(settings).length}`);
if (skipped) {
  console.log(`  skipped      ${skipped} unresolvable image reference(s)`);
}
