import { isIndependenceDaySaleActive, independenceDayPrice } from "@/lib/independenceDaySale";

// Product images live in src/assets/products and are loaded by filename via Vite glob.
const modules = import.meta.glob("../assets/products/*.jpg", { eager: true, import: "default" }) as Record<string, string>;
// A 1x1 transparent PNG — used only when an image filename can't be resolved.
const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const img = (name: string): string => {
  const hit = Object.entries(modules).find(([k]) => k.endsWith(`/${name}.jpg`));
  // This runs at module-evaluation time, so throwing here would white-screen every
  // single route (including /cart and /admin) over one renamed or deleted file.
  // Warn loudly and keep the site up instead.
  if (!hit) {
    console.warn(`[products] Missing product image: ${name}.jpg — using placeholder.`);
    return PLACEHOLDER_IMG;
  }
  return hit[1];
};

// Newer per-size product photography lives in
// src/assets/Product Gallery/<Product folder>/<Size folder>/*.{png,jpg} — added by Jatin
// directly on disk, one subfolder per bottle size (NOTE: no "products" sub-folder — the
// product folders sit directly under "Product Gallery"). Loaded here via glob (rather
// than by filename like `img()` above) since filenames inside each size folder are
// arbitrary export names, not a known list.
const galleryModules = import.meta.glob(
  "../assets/Product Gallery/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
  { eager: true, import: "default" }
) as Record<string, string>;

// Ordered dark-background-first per product/size folder, derived from an automated
// brightness analysis of each photo's border region (Jul 2026) so the product page
// always leads with a dark-bg shot matching the site's dark theme. Any file dropped into
// a folder later that isn't listed here just sorts after the analyzed ones, alphabetically.
// NOTE: "White MUSK/100 ml" has no dark-bg photo in any of its 5 files today (173-255
// brightness range) — the least-light one is listed first, but a proper dark shot for
// White Musk 100ml is still needed.
//
// Jul 31 2026 update: for the 100ml/main-size folder of several products, the file that
// scored darkest was actually a text-heavy "Fragrance Profile" marketing card (bottle +
// notes/ingredient panel), not a clean standalone product photo. Per Jatin's request the
// lead image should be the *product itself* on a dark background, so for Million/Out wood/
// Sukoon/legend we now lead with an existing plain product shot from the same folder that
// already has a dark background. Poetry/Rebel/Wanted/aura had no such plain shot in their
// folder (only the profile card, white-background renders, or a lifestyle/model photo), so
// a cropped version of each profile card was made — same bottle, same dark background,
// with the top title band and the right-side notes column cut off (files suffixed
// "-hero-crop.png", generated Jul 31 2026, sit alongside the originals in the same folder).
// "Rose Petel/100 ml" still has no plain dark-bg product shot available (its non-model
// options are all white-background or a light/cream infographic) — 89.jpg (a lifestyle
// photo, dark background, model holding the bottle) remains the least-bad choice; a plain
// studio shot on a dark background is still needed for a true fix. Khwaab (a single flat
// img() photo, no per-size Product Gallery folder) was checked too — it already shows the
// bottle on a dark background, so no change was needed there.
const GALLERY_ORDER: Record<string, string[]> = {
  "Million/100 ml": ["Untitled design (4).jpg", "Gemini_Generated_Image_fepd8rfepd8rfepd.jpg", "story (6).jpg", "Untitled design (5).jpg"],
  "Million/20 ml": ["ChatGPT Image Jul 6, 2026, 10_06_04 PM.jpg", "1.jpg", "ChatGPT Image Jul 6, 2026, 09_54_30 PM.jpg", "ChatGPT Image Jul 6, 2026, 09_30_50 PM.jpg", "ChatGPT Image Jul 6, 2026, 09_39_11 PM.jpg"],
  "Million/50 ml": ["ChatGPT Image Jul 6, 2026, 08_19_14 PM.jpg", "ChatGPT Image Jul 6, 2026, 08_52_47 PM.jpg", "ChatGPT Image Jul 6, 2026, 08_45_04 PM.jpg", "ChatGPT Image Jul 6, 2026, 08_47_29 PM.jpg"],
  "Out wood/100 ml": ["118.jpg", "116.jpg", "120.jpg", "117.jpg", "119.jpg"],
  "Out wood/20 ml": ["126.jpg", "128.jpg", "127.jpg", "130.jpg", "129.jpg"],
  "Out wood/50 ml": ["125.jpg", "124.jpg", "123.jpg", "122.jpg", "121.jpg"],
  "Poetry/100 ml": ["poetry-hero-crop.jpg", "Gemini_Generated_Image_94b0n094b0n094b0.jpg", "Gemini_Generated_Image_gjlh2xgjlh2xgjlh.jpg", "3.jpg", "5-768x768.jpg"],
  "Poetry/50 ml": ["ChatGPT Image Jul 6, 2026, 08_15_56 PM.jpg", "Jul 4, 2026, 04_29_04 PM.jpg", "3-1-768x768.jpg", "Gemini_Generated_Image_n7wn2en7wn2en7wn.jpg"],
  "Rebel/100 ml": ["rebel-hero-crop.jpg", "Gemini_Generated_Image_pwy2vnpwy2vnpwy2.jpg", "Untitled design.jpg", "6-768x768.jpg", "4.jpg"],
  "Rebel/50 ml": ["ChatGPT Image Jul 6, 2026, 08_04_12 PM.jpg", "ChatGPT Image Jul 4, 2026, 04_37_27 PM.jpg", "7-768x768.jpg", "Untitled design (3).jpg"],
  "Rose Petel/100 ml": ["88.jpg", "90.jpg", "89.jpg", "87.jpg", "86.jpg"],
  "Rose Petel/20 ml": ["99.jpg", "98.jpg", "100.jpg", "97.jpg", "96.jpg"],
  "Rose Petel/50 ml": ["94.jpg", "91.jpg", "92.jpg", "93.jpg", "95.jpg"],
  "Sukoon/100 ml": ["54.jpg", "55.jpg", "53.jpg", "56.jpg", "52.jpg"],
  "Sukoon/20 ml": ["48.jpg", "50.jpg", "46.jpg", "49.jpg", "47.jpg", "51.jpg"],
  "Sukoon/50 ml": ["60.jpg", "ChatGPT Image Jul 30, 2026, 11_13_42 AM.jpg", "59.jpg", "58.jpg", "57.jpg"],
  "Valentine/100 ml": ["106.jpg", "109.jpg", "108.jpg", "107.jpg", "110.jpg"],
  "Valentine/20 ml": ["101.jpg", "104.jpg", "105.jpg", "102.jpg", "103.jpg"],
  "Valentine/50 ml": ["ChatGPT Image Jul 30, 2026, 11_03_13 AM.jpg", "ChatGPT Image Jul 30, 2026, 11_05_20 AM.jpg", "114.jpg", "115.jpg", "112.jpg"],
  "Wanted/100 ml": ["wanted-hero-crop.jpg", "Gemini_Generated_Image_dyod9zdyod9zdyod.jpg", "Untitled design (1).jpg", "Gemini_Generated_Image_i2wwgqi2wwgqi2ww.jpg", "5.jpg"],
  "Wanted/50 ml": ["ChatGPT Image Jul 6, 2026, 08_04_29 PM.jpg", "ChatGPT Image Jul 4, 2026, 04_43_42 PM.jpg", "ChatGPT Image Jul 4, 2026, 04_49_05 PM.jpg", "10-768x768.jpg"],
  "White MUSK/100 ml": ["8.jpg", "10.jpg", "7.jpg", "9.jpg", "6.jpg"],
  "White MUSK/20 ml": ["2.jpg", "3.jpg", "1.jpg", "4.jpg", "5.jpg"],
  "White MUSK/50 ml": ["12.jpg", "14.jpg", "13.jpg", "15.jpg", "11.jpg"],
  "aura/100 ml": ["aura-hero-crop.jpg", "Gemini_Generated_Image_uxfqzguxfqzguxfq.jpg", "Gemini_Generated_Image_gjlh2xgjlh2xgjlh.jpg", "Gemini_Generated_Image_3a71ql3a71ql3a71.jpg", "2.jpg"],
  "aura/50 ml": ["ChatGPT Image Jul 6, 2026, 08_08_09 PM.jpg", "ChatGPT Image Jul 4, 2026, 05_52_44 PM.jpg", "2-1-768x768.jpg", "ChatGPT Image Jul 4, 2026, 06_00_13 PM.jpg"],
  "inayat/100 ML": ["132.jpg", "131.jpg", "135.jpg", "134.jpg", "133.jpg"],
  "inayat/25 ML": ["145.jpg", "141.jpg", "142.jpg", "143.jpg", "144.jpg"],
  "inayat/50 ML": ["138.jpg", "137.jpg", "139.jpg", "136.jpg", "140.jpg"],
  "legend/100 ML": ["39.jpg", "40.jpg", "38.jpg", "37.jpg", "36.jpg"],
  "legend/20 ML": ["45.jpg", "44.jpg", "43.jpg", "42.jpg", "41.jpg"],
  "legend/50 ML": ["Apparel Eau-de-Parfum 50 ml (7).jpg", "32.jpg", "35.jpg", "34.jpg", "31.jpg"],
  "temptation/100 ml": ["25.jpg", "23.jpg", "24.jpg", "21.jpg", "22.jpg"],
  "temptation/20 ml": ["28.jpg", "29.jpg", "27.jpg", "26.jpg", "30.jpg"],
  "temptation/50 ml": ["18.jpg", "19.jpg", "20.jpg", "16.jpg", "17.jpg"],
};

/** All photos under Product Gallery/<productFolder>/<sizeFolder>/, ordered dark-background
 *  shots first (per GALLERY_ORDER above) so the lead/main image always matches the site's
 *  dark theme. Returns [] (never throws) when the folder is missing or renamed, so a
 *  typo'd folder name can't white-screen the site. */
const galleryImagesFor = (productFolder: string, sizeFolder: string): string[] => {
  const prefix = `../assets/Product Gallery/${productFolder}/${sizeFolder}/`;
  const order = GALLERY_ORDER[`${productFolder}/${sizeFolder}`];
  const rank = (filename: string) => {
    const idx = order?.indexOf(filename) ?? -1;
    return idx === -1 ? Infinity : idx;
  };
  return Object.keys(galleryModules)
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => {
      const fa = a.slice(prefix.length);
      const fb = b.slice(prefix.length);
      const ra = rank(fa);
      const rb = rank(fb);
      if (ra !== rb) return ra - rb;
      return fa.localeCompare(fb);
    })
    .map((k) => galleryModules[k]);
};

// Second batch of studio photography, added Aug 2026 in
// src/assets/new Product Gallery/<Product folder>[/<Size folder>]/ — flat (no size
// subfolder) for most products; Impression has 50 ml/100 ml subfolders like the older
// "Product Gallery" batch above. Loaded the same way, via glob.
const newProductGalleryModules = import.meta.glob(
  "../assets/new Product Gallery/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
  { eager: true, import: "default" }
) as Record<string, string>;

// Ordered dark-background-first per an automated brightness analysis of each photo's
// border region (Aug 2026), same method as GALLERY_ORDER above — so the lead image is
// always the darkest, most on-theme shot. Two manual overrides on top of pure brightness
// (Impression/100 ml and /50 ml each had a text-heavy note/profile card that scored
// darker than an available clean product shot purely because of its near-black
// background — per the same "lead with the product itself" rule noted in GALLERY_ORDER,
// the clean shot leads instead and the card sits later in the gallery).
//
// NOTE on "Guldasta": the 5 photos in that folder show a 4-bottle gift box whose bottles
// are labeled "Shahi Chandan" and "Red Rose" — neither is a catalogue product, and
// a-guldasta itself is sold as a single 10ml attar. Confirmed twice with Jatin that these
// are the intended Guldasta photos, so they're wired in; revisit if the listing is meant
// to become a gift set (the name does mean "bouquet").
const NEW_GALLERY_ORDER: Record<string, string[]> = {
  "Celebrity Attar": ["168.jpg", "172.jpg", "169.jpg", "170.jpg"],
  "Chocoblast Attar": ["178.jpg", "179.jpg", "180.jpg", "181.jpg", "182.jpg"],
  "Impression/100 ml": ["16.jpg", "15..jpg", "14.jpg"],
  "Impression/50 ml": ["150.jpg", "152.jpg", "151.jpg", "148.jpg", "149.jpg"],
  "Million Attar": ["173.jpg", "174.jpg", "175.jpg", "177.jpg", "176.jpg"],
  "Ocean Water": ["complete 5 images set.jpg", "193.jpg", "197.jpg", "194.jpg", "195.jpg", "196.jpg"],
  "Royal Oud Attar": ["156.jpg", "157.jpg", "154.jpg", "155.jpg", "153.jpg"],
  "Shahi Gulab Attar": ["159.jpg", "160.jpg", "161.jpg", "158.jpg", "162.jpg"],
  "Smoke Attar": ["189.jpg", "188.jpg", "191.jpg", "192.jpg", "190.jpg"],
  "Touch Attar": ["183.jpg", "187.jpg", "184.jpg", "185.jpg"],
};

/** Photos under "new Product Gallery/<folder>/" (folder = "Celebrity Attar" for a flat
 *  product folder, or "Impression/100 ml" for one with size subfolders), ordered per
 *  NEW_GALLERY_ORDER. Returns [] (never throws) when the folder is missing/renamed. */
const newGalleryImagesFor = (folder: string): string[] => {
  const prefix = `../assets/new Product Gallery/${folder}/`;
  const order = NEW_GALLERY_ORDER[folder];
  const rank = (filename: string) => {
    const idx = order?.indexOf(filename) ?? -1;
    return idx === -1 ? Infinity : idx;
  };
  return Object.keys(newProductGalleryModules)
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => {
      const fa = a.slice(prefix.length);
      const fb = b.slice(prefix.length);
      const ra = rank(fa);
      const rb = rank(fb);
      if (ra !== rb) return ra - rb;
      return fa.localeCompare(fb);
    })
    .map((k) => newProductGalleryModules[k]);
};

// New "Pack of 4" / "Pack of 8" gift-box mockups (5 fragrance lineups for the 4-pack,
// 2 lineups for the 8-pack) live in src/assets/Pack of 4 and 8/<pack>/<variant>/ —
// added by Jatin directly on disk, one subfolder per lineup. Loaded via glob since
// filenames inside each folder are arbitrary export names, not a known list.
// NOTE (Aug 2026): "pack of 4/variant 4" is a byte-for-byte duplicate of "variant 3"
// (same 5 files, same sizes) — treated as a duplicate upload, not a distinct lineup, so
// it has no product entry. "pack of 4/variant 5" (added later) turned out to be a
// reshoot of variant 3's same Honeymoon lineup (identical scents, different photo
// composition) — its photos replaced variant 3's in the Pack of 4 product below rather
// than becoming a separate 5th listing.
const packModules = import.meta.glob(
  "../assets/Pack of 4 and 8/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
  { eager: true, import: "default" }
) as Record<string, string>;

// A generic box-back mockup ("ChatGPT Image Jul 23, 2026, 02_02_50 AM.jpg", reused
// verbatim — including its "Copy of Copy of Copy of" duplicate — across several variant
// folders) prints "8 N X 8 ml" fill info on what is otherwise a 4-pack folder, and a
// MRP/price that matches neither this site's pack-of-4 nor pack-of-8 pricing. It's a
// leftover shared placeholder, not real per-variant packaging, so it's excluded below.
const PACK_EXCLUDE = /02_02_50 AM\.png$/;

// Lead-image order per pack/variant folder (best hero shot first), mirroring
// GALLERY_ORDER above.
const PACK_GALLERY_ORDER: Record<string, string[]> = {
  "pack of 4/variant 1": [
    "ChatGPT Image Jul 24, 2026, 05_45_24 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 06_44_42 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 06_32_17 PM.jpg",
    "Apparel Eau-de-Parfum 50 ml (5).jpg",
  ],
  "pack of 4/variant 2": [
    "ChatGPT Image Jul 24, 2026, 05_16_31 PM.jpg",
    "ChatGPT Image Jul 23, 2026, 02_50_53 AM.jpg",
    "ChatGPT Image Jul 24, 2026, 05_14_49 PM.jpg",
    "ChatGPT Image Jul 23, 2026, 02_44_37 AM.jpg",
  ],
  "pack of 4/variant 3": [
    "ChatGPT Image Jul 24, 2026, 07_07_32 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 07_22_31 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 07_36_18 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 07_42_05 PM.jpg",
  ],
  // Same filenames as variant 3 (same export batch/session) but different photos — a
  // reshoot of the identical Honeymoon lineup, now used in place of variant 3's photos.
  // 07_22_31 PM (open box, bottles standing, all 4 labels readable) leads per Jatin's
  // reference pick — a stronger hero shot than the flat-lay 07_07_32 PM.
  "pack of 4/variant 5": [
    "ChatGPT Image Jul 24, 2026, 07_22_31 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 07_07_32 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 07_36_18 PM.jpg",
    "ChatGPT Image Jul 24, 2026, 07_42_05 PM.jpg",
  ],
  "Pack of 8/variant 1": [
    "ChatGPT Image Jul 24, 2026, 07_50_08 PM.jpg",
    "ChatGPT Image Jul 23, 2026, 02_26_03 AM.jpg",
    "ChatGPT Image Jul 23, 2026, 02_22_27 AM.jpg",
    "ChatGPT Image Jul 23, 2026, 02_40_02 AM.jpg",
  ],
};

/** All photos under "Pack of 4 and 8/<folder>/" (folder = e.g. "pack of 4/variant 1"),
 *  ordered per PACK_GALLERY_ORDER, excluding the generic mismatched box-back mockup.
 *  Returns [] (never throws) so a typo'd folder name can't white-screen the site. */
const packGalleryFor = (folder: string): string[] => {
  const prefix = `../assets/Pack of 4 and 8/${folder}/`;
  const order = PACK_GALLERY_ORDER[folder];
  const rank = (filename: string) => {
    const idx = order?.indexOf(filename) ?? -1;
    return idx === -1 ? Infinity : idx;
  };
  return Object.keys(packModules)
    .filter((k) => k.startsWith(prefix) && !PACK_EXCLUDE.test(k))
    .sort((a, b) => {
      const fa = a.slice(prefix.length);
      const fb = b.slice(prefix.length);
      const ra = rank(fa);
      const rb = rank(fb);
      if (ra !== rb) return ra - rb;
      return fa.localeCompare(fb);
    })
    .map((k) => packModules[k]);
};

// Third batch of studio photography (Aug 2026) lives in
// src/assets/product-gallery-2/<Product folder>[/<Size folder>]/ — same layout style as
// "new Product Gallery" above (flat per product, or with a size subfolder for products
// sold in multiple volumes). Loaded the same way, via glob. (Originally dropped on disk
// as "product gallery 2" with the raw, uncompressed exports — resized to 1080px and
// mozjpeg-recompressed into this folder, ~56% smaller, before being wired in below.)
// NOTE: the "Guldasta" folder in this batch was empty — still no real Guldasta photos to
// wire in. The Guldasta folder in the *older* "new Product Gallery" batch isn't it either:
// those 5 photos are actually labeled "Shahi Chandan" and "Red Rose" bottles (see the note
// above NEW_GALLERY_ORDER), not Guldasta.
const productGallery2Modules = import.meta.glob(
  "../assets/product-gallery-2/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
  { eager: true, import: "default" }
) as Record<string, string>;

// "Honey moon/100 ml" leads with "complete 5 images setMM.jpg" — a dark-background
// lifestyle shot — ahead of the plain white-background studio bottle shots, matching the
// site's dark-theme-leads convention used elsewhere (see GALLERY_ORDER above).
const PRODUCT_GALLERY_2_ORDER: Record<string, string[]> = {
  "Honey moon/100 ml": ["complete 5 images setMM.jpg", "212.jpg", "213.jpg", "214.jpg", "215.jpg"],
};

/** Photos under "product-gallery-2/<folder>/", ordered per PRODUCT_GALLERY_2_ORDER.
 *  Returns [] (never throws) when the folder is missing/renamed/empty. */
const productGallery2ImagesFor = (folder: string): string[] => {
  const prefix = `../assets/product-gallery-2/${folder}/`;
  const order = PRODUCT_GALLERY_2_ORDER[folder];
  const rank = (filename: string) => {
    const idx = order?.indexOf(filename) ?? -1;
    return idx === -1 ? Infinity : idx;
  };
  return Object.keys(productGallery2Modules)
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => {
      const fa = a.slice(prefix.length);
      const fb = b.slice(prefix.length);
      const ra = rank(fa);
      const rb = rank(fb);
      if (ra !== rb) return ra - rb;
      return fa.localeCompare(fb);
    })
    .map((k) => productGallery2Modules[k]);
};

// Fourth batch of studio photography, imported Aug 2026 from a Google Drive export
// ("drive-download-20260812T060659Z-1-001.zip") covering ~25 products that previously had
// only a single generic photo. Same layout as product-gallery-2 (flat per product, or with
// a size subfolder), resized to 1080px and mozjpeg-recompressed (~56% smaller) before being
// wired in below. The zip also contained many folders that were exact re-uploads of photos
// already wired via Product Gallery / new Product Gallery / product-gallery-2 (aura, million,
// poetry, rebel, celebrity, chemistry, legend, impression, inayat, honeymoon, etc.) — those
// were left out entirely rather than duplicated. Two folders ("guldasta", "celebrity ATTAR"
// dupes aside) turned out to be the same mislabeled "Shahi Chandan"/"Red Rose" gift-box shots
// already flagged as wrong for Guldasta — skipped again for the same reason. "flora" and
// "oud forest" were real branded bottle photos for products that didn't exist in the catalog
// yet — added as new draft listings (Flora, Oud Forest) with placeholder pricing.
const productGallery3Modules = import.meta.glob(
  "../assets/product-gallery-3/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
  { eager: true, import: "default" }
) as Record<string, string>;

// "Maati/324.jpg" is mislabeled in the source export — it's actually a "Ruh-Heena" fragrance
// pyramid infographic, not a Maati photo at all — excluded rather than shown on the wrong
// product page.
const PRODUCT_GALLERY_3_EXCLUDE = new Set(["Maati/324.jpg"]);

// Lead-image order per folder (plain product-itself shot first, matching the site's
// dark-theme-leads convention — see GALLERY_ORDER above). Only curated where the default
// alphabetical order led with a text-heavy marketing card instead of the bottle itself.
const PRODUCT_GALLERY_3_ORDER: Record<string, string[]> = {
  Maati: ["321.jpg", "322.jpg", "320.jpg", "319.jpg", "323.jpg"],
};

/** Photos under "product-gallery-3/<folder>/" (folder = e.g. "Amber" or "Dubai Fame/50 ml"),
 *  ordered per PRODUCT_GALLERY_3_ORDER (falling back to alphabetical for any folder not
 *  listed there — see GALLERY_ORDER above for the same convention). Returns [] (never
 *  throws) when the folder is missing/renamed/empty. */
const productGallery3ImagesFor = (folder: string): string[] => {
  const prefix = `../assets/product-gallery-3/${folder}/`;
  const order = PRODUCT_GALLERY_3_ORDER[folder];
  const rank = (filename: string) => {
    const idx = order?.indexOf(filename) ?? -1;
    return idx === -1 ? Infinity : idx;
  };
  return Object.keys(productGallery3Modules)
    .filter((k) => k.startsWith(prefix) && !PRODUCT_GALLERY_3_EXCLUDE.has(`${folder}/${k.slice(prefix.length)}`))
    .sort((a, b) => {
      const fa = a.slice(prefix.length);
      const fb = b.slice(prefix.length);
      const ra = rank(fa);
      const rb = rank(fb);
      if (ra !== rb) return ra - rb;
      return fa.localeCompare(fb);
    })
    .map((k) => productGallery3Modules[k]);
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  price: number;
  compareAt?: number;
  /** Per-size pricing (e.g. {"50ml": {price: 449}, "100ml": {price: 749}}). When a size is
   *  missing here, priceFor() falls back to the flat price/compareAt above. */
  priceByVolume?: Record<string, { price: number; compareAt?: number }>;
  /** No product uses "New Launch" — that shop filter is virtual and keys off the
   *  `newArrival` flag below (see matchesCategory in src/pages/Shop.tsx). */
  category: "Perfume" | "Attar" | "Gift Set" | "Collector's Edition";
  gender: "Men" | "Women" | "Unisex";
  image: string;
  gallery: string[];
  /** When a product's photos differ by size (e.g. two distinct bottle designs for
   *  50ml vs 100ml), map each volume to its own gallery here. ProductDetail falls
   *  back to `gallery` for any volume not listed. */
  galleryByVolume?: Record<string, string[]>;
  /** Size printed on the primary bottle photo(s). Shop cards and the product-page
   *  default selection use this so price matches the bottle shown. When omitted,
   *  the first entry in `volume` is used (usually 50ml). */
  featuredVolume?: string;
  /** Per-variant tagline/description/ingredients text — used for products where each
   *  `volume` entry isn't a bottle size but a different fragrance lineup (e.g. Pack of 4 /
   *  Pack of 8 gift sets). ProductDetail falls back to the flat tagline/description/
   *  ingredients below for any variant not listed here. */
  contentByVolume?: Record<string, { tagline?: string; description?: string; ingredients?: string }>;
  /** Label shown above the variant selector on the product page. Defaults to "Size". */
  variantLabel?: string;
  notes: { top: string[]; heart: string[]; base: string[] };
  longevity: string;
  projection: string;
  occasions: string[];
  moods: string[];
  ingredients: string;
  description: string;
  rating: number;
  reviews: number;
  badge?: string;
  bestSeller?: boolean;
  newArrival?: boolean;
  trending?: boolean;
  amazonChoice?: boolean;
  amazonUrl?: string;
  videoUrl?: string;
  volume?: string[];
  /** Spec-sheet rows shown in the "Product Details" accordion on the product page, in
   *  insertion order. Sourced from the product's own Amazon listing so both storefronts
   *  state the same thing. Only set where we have real listing data — the accordion is
   *  hidden entirely for products without it rather than showing invented specs. */
  specs?: Record<string, string>;
  /** "About this item" selling points, shown as a bulleted list above the spec rows. */
  highlights?: string[];
};

export const defaultVolumes = ["50ml", "100ml"];

export const collections = [
  {
    key: "Perfume",
    title: "Perfumes",
    blurb: "Long-lasting eau de parfum — bold, modern, affordable luxury.",
    sub: ["Celebrity", "Impression", "Sukoon", "Touch", "Oud Wood", "Legend"],
  },
  {
    key: "Attar",
    title: "Attars",
    blurb: "Alcohol-free premium attars, traditionally crafted.",
    sub: ["Royal Oud", "Shahi Gulab", "Mogra Gold", "Rooh Chandan", "Amber", "Tulsi"],
  },
  {
    key: "Gift Set",
    title: "Gift Sets",
    blurb: "Ready-to-gift combos & discovery sets.",
    // 6 tags (matching the other two cards) so all three "Shop by Collection" cards
    // render the same number of tag rows and end up the same height — a short sub
    // list here was making this card visibly shorter/misaligned next to the others.
    sub: ["Pack of 8", "Perfume Duos", "Attar Combos", "Pack of 4", "Aqua Duo", "Rooh Chandan Duo"],
  },
] as const;

/**
 * The curated "New Launches" line-up — shown on the homepage New Arrivals strip AND
 * behind the shop's "New Launch" category filter, so both always agree.
 *
 * Deliberately a hand-picked list rather than the `newArrival` flag: that flag is set on
 * 58 of 79 products, so filtering by it returns ~73% of the catalogue and tells a shopper
 * nothing. The flag still drives the shop's "Sort: Newest" ordering.
 *
 * Edit this list whenever the featured launches change.
 */
export const NEW_LAUNCH_SLUGS = [
  "rooh-chandan", "jannat-firdaus", "amber", "shahi-gulab",
  "aura", "poetry", "wanted", "rebel",
] as const;

const PERFUME_VOL = ["50ml", "100ml"];
// Eight perfumes also sell a 20ml travel size (per "New Price sheet .xlsx"). They already
// carried a 20ml entry in priceByVolume, but 20ml was missing from their volume array, so
// the size was priced yet impossible to select or buy.
const PERFUME_VOL_20 = ["20ml", "50ml", "100ml"];
// Real inventory only ever sells attars in a single 10ml bottle (confirmed against the
// price sheet) — a fake "6ml/12ml" size picker previously showed with no price difference.
const ATTAR_VOL = ["10ml"];

export const products: Product[] = [
  // ─────────────── PERFUMES ───────────────
  {
    id: "p-celebrity", slug: "celebrity", name: "Celebrity", tagline: "Your red-carpet signature",
    price: 1099, compareAt: 1399, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 1099, compareAt: 1399 }, "50ml": { price: 649, compareAt: 1099 }, "20ml": { price: 299, compareAt: 349 } },
    // New studio + lifestyle shoot (July 2026) verified per bottle size — replaces the old
    // generic photos. Each size has its own bottle design, so keep a dedicated default.
    // Dark/moody lifestyle shots lead each list (site theme is dark) with the white-background
    // studio shots kept later in the gallery for detail views.
    featuredVolume: "50ml",
    image: img("celebrity-50ml-lifestyle-1"),
    gallery: [img("celebrity-50ml-lifestyle-1"), img("celebrity-50ml-lifestyle-2"), img("celebrity-50ml-studio-3"), ...productGallery3ImagesFor("Celebrity/50 ml")],
    galleryByVolume: {
      "20ml": [img("celebrity-20ml-lifestyle-1"), img("celebrity-20ml-lifestyle-2"), img("celebrity-20ml-lifestyle-3"), img("celebrity-20ml-studio-1"), img("celebrity-20ml-studio-2")],
      // The last two are square (1080²) re-crops from the Aug 2026 Drive export, replacing
      // the portrait 768×1290 studio-1/studio-2 versions of the same two shots — those got
      // their tops and bottoms center-cropped in the site's square image containers.
      "50ml": [img("celebrity-50ml-lifestyle-1"), img("celebrity-50ml-lifestyle-2"), img("celebrity-50ml-studio-3"), ...productGallery3ImagesFor("Celebrity/50 ml")],
      "100ml": [img("celebrity-100ml-lifestyle-1"), img("celebrity-100ml-lifestyle-3"), img("celebrity-100ml-studio-1"), img("celebrity-100ml-lifestyle-2")],
    },
    notes: { top: ["Bergamot", "Pink Pepper"], heart: ["Jasmine", "Saffron"], base: ["Amber", "Vanilla", "Musk"] },
    longevity: "8-10 hours", projection: "Strong",
    occasions: ["Evening", "Date Night", "Celebrations"], moods: ["Confident", "Magnetic"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Celebrity is made to be noticed — a luminous, spicy-sweet signature that leaves a trail of compliments wherever you go.",
    rating: 4.8, reviews: 312, badge: "Bestseller", bestSeller: true, trending: true,
  },
  {
    id: "p-impression", slug: "impression", name: "Impression", tagline: "Leave a lasting one",
    price: 1099, compareAt: 1399, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 1099, compareAt: 1399 }, "50ml": { price: 649, compareAt: 1099 } },
    // impression-3 is the pink/black-cap bottle labeled "50 ml"; impression-real/1/2 are
    // the silver-cap studio bottle used for 100ml. New studio photography (Aug 2026,
    // per size) now leads each list; the originals above are kept as a fallback.
    image: newGalleryImagesFor("Impression/50 ml")[0] ?? img("impression"),
    gallery: [...newGalleryImagesFor("Impression/50 ml"), img("impression-3"), img("impression-real"), img("impression-1"), img("impression-2")],
    galleryByVolume: {
      "50ml": [...newGalleryImagesFor("Impression/50 ml"), img("impression-3")],
      "100ml": [...newGalleryImagesFor("Impression/100 ml"), img("impression-real"), img("impression-1"), img("impression-2")],
    },
    notes: { top: ["Citrus", "Apple"], heart: ["Rose", "Geranium"], base: ["Oud", "Patchouli", "Amber"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Office", "Evening"], moods: ["Bold", "Refined"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "A warm, woody-floral statement designed for those who want to leave a lasting impression long after they leave the room.",
    rating: 4.7, reviews: 248, trending: true,
  },
  {
    id: "p-inayat", slug: "inayat", name: "Inayat", tagline: "A graceful blessing",
    price: 649, compareAt: 849, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 649, compareAt: 849 }, "50ml": { price: 499, compareAt: 749 } },
    // inayat.jpg label reads 50 ml; inayat-real.jpg reads 100 ml. inayat-gallery-1..5 are a new
    // lifestyle/mood shoot (July 2026, not size-specific) added to the general gallery only.
    // Dark shots (5, 1, 4) lead, medium-toned 3 next, and gallery-2 (white background — the
    // one that clashes with the site's dark theme) is kept last.
    // New dedicated per-size studio photos from the "Product Gallery" folder (Jul 2026) now
    // lead each size's gallery, with the old size photo kept as an extra shot after them.
    // A "25 ML" folder also exists there, but Inayat only sells 50ml/100ml today, so it isn't
    // wired to a size — flag to Jatin if a 25ml size should be added for sale.
    image: galleryImagesFor("inayat", "100 ML")[0] ?? img("inayat"),
    gallery: [...galleryImagesFor("inayat", "100 ML"), img("inayat-real"), img("inayat-gallery-5"), img("inayat-gallery-1"), img("inayat-gallery-4"), img("inayat-gallery-3"), img("inayat-gallery-2")],
    galleryByVolume: {
      "50ml": [...galleryImagesFor("inayat", "50 ML"), img("inayat")],
      "100ml": [...galleryImagesFor("inayat", "100 ML"), img("inayat-real")],
    },
    notes: { top: ["Saffron", "Bergamot"], heart: ["Rose", "Oud"], base: ["Amber", "Musk", "Sandalwood"] },
    longevity: "10 hours", projection: "Strong",
    occasions: ["Festive", "Special Occasions", "Evening"], moods: ["Opulent", "Elegant"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Inayat is our flagship oriental — saffron and rose wrapped around deep oud and amber. Pure, regal indulgence.",
    rating: 4.9, reviews: 187, badge: "Signature", newArrival: true,
  },
  {
    id: "p-oud-wood", slug: "oud-wood", name: "Oud Wood", tagline: "The rarest wood",
    price: 899, compareAt: 1499, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "50ml": { price: 449, compareAt: 899 }, "100ml": { price: 899, compareAt: 1499 } },
    // oud-wood.jpg label reads 50 ml; oud-wood-real.jpg reads 100 ml — kept as extra shots
    // after the new dedicated per-size studio photos below ("Out wood" Product Gallery
    // folder, Jul 2026). That folder also has a "20 ml" set, but Oud Wood only sells
    // 50ml/100ml today, so it isn't wired to a size — flag to Jatin if 20ml should be added.
    image: galleryImagesFor("Out wood", "100 ml")[0] ?? img("oud-wood-real"),
    gallery: [...galleryImagesFor("Out wood", "100 ml"), img("oud-wood-real"), img("oud-wood")],
    galleryByVolume: {
      "50ml": [...galleryImagesFor("Out wood", "50 ml"), img("oud-wood")],
      "100ml": [...galleryImagesFor("Out wood", "100 ml"), img("oud-wood-real")],
    },
    notes: { top: ["Black Pepper", "Cardamom"], heart: ["Aged Oud", "Leather"], base: ["Sandalwood", "Vetiver", "Amber"] },
    longevity: "10-12 hours", projection: "Strong",
    occasions: ["Evening", "Formal", "Winter"], moods: ["Bold", "Mysterious"],
    ingredients: "Premium oud accord, fragrance oils, French-grade alcohol base.",
    description: "Smoky aged oud meets warm leather and sandalwood — Oud Wood is dark, refined, and unmistakably masculine.",
    rating: 4.9, reviews: 156, badge: "Editor's Pick", bestSeller: true,
  },
  {
    id: "p-sukoon", slug: "sukoon", name: "Sukoon", tagline: "The scent of calm",
    price: 899, compareAt: 999, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 899, compareAt: 999 }, "20ml": { price: 249, compareAt: 999 }, "50ml": { price: 499, compareAt: 999 } },
    // Both available shots are labeled 100 ml (different bottle designs). List at 100ml
    // so shop price matches the bottle; kept as extra shots after the new dedicated
    // per-size studio photos below (Product Gallery folder, Jul 2026) — that folder now
    // also fills in 20ml/50ml photos we previously had none of.
    featuredVolume: "100ml",
    image: galleryImagesFor("Sukoon", "100 ml")[0] ?? img("sukoon"),
    gallery: [...galleryImagesFor("Sukoon", "100 ml"), img("sukoon-1"), img("sukoon-2")],
    galleryByVolume: {
      "20ml": galleryImagesFor("Sukoon", "20 ml").length ? galleryImagesFor("Sukoon", "20 ml") : [img("sukoon")],
      "50ml": galleryImagesFor("Sukoon", "50 ml").length ? galleryImagesFor("Sukoon", "50 ml") : [img("sukoon")],
      "100ml": [...galleryImagesFor("Sukoon", "100 ml"), img("sukoon-1"), img("sukoon-2")],
    },
    notes: { top: ["Lavender", "Bergamot"], heart: ["Cedar", "Iris"], base: ["Amber", "Tonka", "Musk"] },
    longevity: "8-10 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Office", "Relaxed Evenings"], moods: ["Calm", "Grounded"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Sukoon means peace — a soothing, woody-aromatic blend that feels like a deep breath at the end of the day.",
    rating: 4.7, reviews: 134, trending: true,
  },
  {
    id: "p-touch", slug: "touch", name: "Touch", tagline: "Soft. Sensual. Unforgettable.",
    price: 899, compareAt: 1599, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "50ml": { price: 499, compareAt: 899 }, "100ml": { price: 899, compareAt: 1599 }, "20ml": { price: 249, compareAt: 1599 } },
    // New studio + lifestyle shoot (July 2026) verified per bottle size — replaces the old
    // single generic photo.
    featuredVolume: "50ml",
    image: img("touch-50ml-lifestyle-1"),
    gallery: [img("touch-50ml-lifestyle-1"), img("touch-50ml-lifestyle-2"), img("touch-50ml-lifestyle-4"), img("touch-50ml-lifestyle-5"), img("touch-50ml-lifestyle-3")],
    galleryByVolume: {
      // lifestyle-2 has a bright cream/light backdrop (vs the dark backgrounds of the rest) — kept last.
      "20ml": [img("touch-20ml-studio-1"), img("touch-20ml-studio-2"), img("touch-20ml-lifestyle-1"), img("touch-20ml-lifestyle-3"), img("touch-20ml-lifestyle-2")],
      "50ml": [img("touch-50ml-lifestyle-1"), img("touch-50ml-lifestyle-2"), img("touch-50ml-lifestyle-4"), img("touch-50ml-lifestyle-5"), img("touch-50ml-lifestyle-3")],
      "100ml": [img("touch-100ml-studio-1"), img("touch-100ml-lifestyle-1"), img("touch-100ml-lifestyle-2"), img("touch-100ml-lifestyle-3")],
    },
    notes: { top: ["Pear", "Pink Pepper"], heart: ["White Flowers", "Iris"], base: ["Vanilla", "Cashmere Musk"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Brunch", "Date Night"], moods: ["Romantic", "Soft"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Touch wraps the skin like cashmere — warm vanilla and soft musk for those who whisper rather than announce.",
    rating: 4.8, reviews: 221, badge: "Bestseller", bestSeller: true, amazonChoice: true,
  },
  {
    id: "p-ocean-water", slug: "ocean-water", name: "Ocean Water", tagline: "A breath of the sea",
    price: 749, compareAt: 1099, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 749, compareAt: 1099 }, "50ml": { price: 499, compareAt: 1799 } },
    featuredVolume: "100ml",
    // New studio photography (Aug 2026, 100ml bottle) leads; original photo kept after.
    image: newGalleryImagesFor("Ocean Water")[0] ?? img("ocean-water"),
    gallery: [...newGalleryImagesFor("Ocean Water"), img("ocean-water")],
    // Dedicated 50ml photography (Aug 2026) — previously the 100ml gallery above was shown
    // for every size, including 50ml. A "20 ml" folder also exists there, but Ocean Water
    // only sells 50ml/100ml today, so it isn't wired to a size — flag to Jatin if a 20ml
    // size should be added for sale.
    galleryByVolume: {
      "50ml": productGallery3ImagesFor("Ocean Water/50 ml").length ? productGallery3ImagesFor("Ocean Water/50 ml") : [...newGalleryImagesFor("Ocean Water"), img("ocean-water")],
      "100ml": [...newGalleryImagesFor("Ocean Water"), img("ocean-water")],
    },
    notes: { top: ["Marine Accord", "Citrus"], heart: ["Sage", "Lavender"], base: ["Driftwood", "Musk"] },
    longevity: "6-8 hours", projection: "Moderate",
    occasions: ["Office", "Casual", "Summer"], moods: ["Fresh", "Energetic"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Crisp, aquatic and clean — Ocean Water is a fresh daily-wear that feels like a cool breeze off the sea.",
    rating: 4.6, reviews: 178, newArrival: true,
  },
  {
    id: "p-white-musk", slug: "white-musk", name: "White Musk", tagline: "Clean, quiet luxury",
    price: 649, compareAt: 849, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 649, compareAt: 849 }, "20ml": { price: 299, compareAt: 349 }, "50ml": { price: 499, compareAt: 749 } },
    // Both photos are labeled 50 ml — kept as extra shots after the new dedicated per-size
    // studio photos below ("White MUSK" Product Gallery folder, Jul 2026), which now also
    // fills in the 100ml photo we previously had none of.
    featuredVolume: "50ml",
    image: galleryImagesFor("White MUSK", "50 ml")[0] ?? img("white-musk"),
    gallery: [...galleryImagesFor("White MUSK", "50 ml"), img("white-musk-real"), img("white-musk")],
    galleryByVolume: {
      "20ml": galleryImagesFor("White MUSK", "20 ml").length ? galleryImagesFor("White MUSK", "20 ml") : [img("white-musk")],
      "50ml": [...galleryImagesFor("White MUSK", "50 ml"), img("white-musk-real"), img("white-musk")],
      "100ml": galleryImagesFor("White MUSK", "100 ml").length ? galleryImagesFor("White MUSK", "100 ml") : [img("white-musk")],
    },
    notes: { top: ["Aldehydes", "Bergamot"], heart: ["White Musk", "Lily"], base: ["Cedar", "Soft Amber"] },
    longevity: "8 hours", projection: "Soft",
    occasions: ["Daily Wear", "Office", "Layering"], moods: ["Clean", "Elegant"],
    ingredients: "Cruelty-free musk accord, fragrance oils, French-grade alcohol base.",
    description: "The ultimate skin scent — soft, clean white musk that smells like freshly laundered luxury. Beautiful on its own or layered.",
    rating: 4.8, reviews: 264, bestSeller: true,
  },
  {
    id: "p-temptation", slug: "temptation", name: "Temptation", tagline: "Impossible to resist",
    price: 749, compareAt: 1099, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 749, compareAt: 1099 }, "20ml": { price: 299, compareAt: 349 }, "50ml": { price: 499, compareAt: 749 } },
    featuredVolume: "100ml",
    // Both temptation shots are labeled 100 ml (different bottle styles) — kept as extra
    // shots after the new dedicated per-size studio photos below (Product Gallery
    // folder, Jul 2026).
    image: galleryImagesFor("temptation", "100 ml")[0] ?? img("temptation"),
    gallery: [...galleryImagesFor("temptation", "100 ml"), img("temptation-real"), img("temptation")],
    galleryByVolume: {
      "20ml": galleryImagesFor("temptation", "20 ml").length ? galleryImagesFor("temptation", "20 ml") : [img("temptation")],
      "50ml": galleryImagesFor("temptation", "50 ml").length ? galleryImagesFor("temptation", "50 ml") : [img("temptation")],
      "100ml": [...galleryImagesFor("temptation", "100 ml"), img("temptation-real"), img("temptation")],
    },
    notes: { top: ["Black Currant", "Raspberry"], heart: ["Orchid", "Rose"], base: ["Vanilla", "Praline", "Musk"] },
    longevity: "8-10 hours", projection: "Strong",
    occasions: ["Date Night", "Evening", "Parties"], moods: ["Romantic", "Bold"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "A sweet, fruity-gourmand seduction — Temptation is bold, addictive and made for nights you want to be remembered.",
    rating: 4.7, reviews: 198, trending: true,
  },
  {
    id: "p-rose-petals", slug: "rose-petals", name: "Rose Petals", tagline: "A garden in bloom",
    price: 649, compareAt: 849, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 649, compareAt: 849 }, "50ml": { price: 499, compareAt: 749 } },
    featuredVolume: "100ml",
    // Both rose-petals shots are labeled 100 ml (different bottle styles) — kept as extra
    // shots after the new dedicated per-size studio photos below ("Rose Petel" Product
    // Gallery folder, Jul 2026). That folder also has a "20 ml" set, but Rose Petals only
    // sells 50ml/100ml today, so it isn't wired to a size — flag to Jatin if 20ml is wanted.
    image: galleryImagesFor("Rose Petel", "100 ml")[0] ?? img("rose-petals-real"),
    gallery: [...galleryImagesFor("Rose Petel", "100 ml"), img("rose-petals-real"), img("rose-petals")],
    galleryByVolume: {
      "50ml": [...galleryImagesFor("Rose Petel", "50 ml"), img("rose-petals")],
      "100ml": [...galleryImagesFor("Rose Petel", "100 ml"), img("rose-petals-real")],
    },
    notes: { top: ["Rose Petals", "Lychee"], heart: ["Turkish Rose", "Peony"], base: ["White Musk", "Sandalwood"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Weddings", "Gifting"], moods: ["Feminine", "Joyful"],
    ingredients: "Natural rose accord, fragrance oils, French-grade alcohol base.",
    description: "A luminous, true-to-life rose — fresh petals over soft musk. Romantic, timeless and effortlessly elegant.",
    rating: 4.7, reviews: 142, newArrival: true,
  },
  {
    id: "p-legend", slug: "legend", name: "Legend", tagline: "Wear your story",
    price: 649, compareAt: 849, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 649, compareAt: 849 }, "20ml": { price: 299, compareAt: 349 }, "50ml": { price: 499, compareAt: 749 } },
    featuredVolume: "100ml",
    // Both legend shots are labeled 100 ml (different bottle styles) — kept as extra shots
    // after the new dedicated per-size studio photos below (Product Gallery folder, Jul 2026).
    image: galleryImagesFor("legend", "100 ML")[0] ?? img("legend"),
    gallery: [...galleryImagesFor("legend", "100 ML"), img("legend-real"), img("legend")],
    galleryByVolume: {
      "20ml": galleryImagesFor("legend", "20 ML").length ? galleryImagesFor("legend", "20 ML") : [img("legend")],
      "50ml": galleryImagesFor("legend", "50 ML").length ? galleryImagesFor("legend", "50 ML") : [img("legend")],
      "100ml": [...galleryImagesFor("legend", "100 ML"), img("legend-real"), img("legend")],
    },
    notes: { top: ["Lavender", "Mint"], heart: ["Sage", "Geranium"], base: ["Cedar", "Tonka", "Amber"] },
    longevity: "8-10 hours", projection: "Strong",
    occasions: ["Office", "Evening", "Formal"], moods: ["Confident", "Classic"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "A fresh fougère with a warm woody heart — Legend is the dependable, sharp-dressed scent every man should own.",
    rating: 4.8, reviews: 176, bestSeller: true,
  },

  // ─────────────── ATTARS ───────────────
  {
    id: "a-royal-oud", slug: "royal-oud", name: "Royal Oud", tagline: "The king of attars",
    price: 899, compareAt: 1199, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads; original photo kept as a fallback shot.
    image: newGalleryImagesFor("Royal Oud Attar")[0] ?? img("attar-royal-oud"),
    gallery: [...newGalleryImagesFor("Royal Oud Attar"), img("attar-royal-oud")],
    notes: { top: ["Smoke"], heart: ["Aged Oud", "Agarwood"], base: ["Amber", "Musk", "Resin"] },
    longevity: "14+ hours", projection: "Strong",
    occasions: ["Formal", "Special Occasions", "Winter"], moods: ["Regal", "Mysterious"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Deep, smoky aged oud in its purest oil form. One drop of Royal Oud lasts all day and announces pure luxury.",
    rating: 4.9, reviews: 241, badge: "Bestseller", bestSeller: true,
  },
  {
    id: "a-shahi-gulab", slug: "shahi-gulab", name: "Shahi Gulab", tagline: "Royal rose, bottled",
    price: 699, category: "Attar", gender: "Women", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads; original photos kept after.
    image: newGalleryImagesFor("Shahi Gulab Attar")[0] ?? img("attar-shahi-gulab-1"),
    gallery: [...newGalleryImagesFor("Shahi Gulab Attar"), img("attar-shahi-gulab-1"), img("attar-shahi-gulab-2")],
    notes: { top: ["Rose Petals"], heart: ["Turkish Rose", "Saffron"], base: ["Sandalwood", "Musk"] },
    longevity: "10-12 hours", projection: "Intimate",
    occasions: ["Festive", "Daily Wear", "Gifting"], moods: ["Feminine", "Timeless"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Hand-distilled royal rose — rich, velvety and warm. Shahi Gulab is the soul of a Mughal rose garden in a single drop.",
    rating: 4.8, reviews: 203, bestSeller: true,
  },
  {
    id: "a-mogra-gold", slug: "mogra-gold", name: "Mogra Gold", tagline: "Jasmine's golden hour",
    price: 649, category: "Attar", gender: "Women", volume: ATTAR_VOL,
    image: productGallery2ImagesFor("Mogra Gold")[0] ?? img("attar-mogra-gold"),
    gallery: productGallery2ImagesFor("Mogra Gold").length ? productGallery2ImagesFor("Mogra Gold") : [img("attar-mogra-gold")],
    notes: { top: ["Mogra Buds"], heart: ["Jasmine Sambac", "Tuberose"], base: ["White Musk", "Sandalwood"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Daily Wear", "Festive", "Pooja"], moods: ["Joyful", "Pure"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Intoxicating Indian jasmine captured at dawn. Mogra Gold is heady, sweet and unmistakably festive.",
    rating: 4.8, reviews: 167, trending: true,
  },
  {
    id: "a-rooh-chandan", slug: "rooh-chandan", name: "Rooh Chandan", tagline: "Sacred sandalwood",
    price: 749, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: productGallery2ImagesFor("Rooh Chandan")[0] ?? img("attar-rooh-chandan"),
    gallery: productGallery2ImagesFor("Rooh Chandan").length ? productGallery2ImagesFor("Rooh Chandan") : [img("attar-rooh-chandan")],
    notes: { top: ["Cardamom"], heart: ["Sandalwood", "Rose"], base: ["Cream", "Amber", "Vanilla"] },
    longevity: "12+ hours", projection: "Intimate",
    occasions: ["Meditation", "Daily Wear", "Festive"], moods: ["Calm", "Grounded"],
    ingredients: "100% alcohol-free premium sandalwood attar oil.",
    description: "Pure, creamy sandalwood distilled the traditional way. Rooh Chandan is meditation in a bottle — sacred and eternal.",
    rating: 4.9, reviews: 198,
  },
  {
    id: "a-jannat-firdaus", slug: "jannat-firdaus", name: "Jannat Firdaus", tagline: "A taste of paradise",
    price: 649, compareAt: 1099, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // Folder is "janat firdos" on disk (as dropped by the shoot batch) — kept as-is rather
    // than renamed, so the glob path below matches exactly.
    // "Jannat Firdaus Lifestyle" (Aug 2026) is a newer courtyard/lantern lifestyle reshoot
    // of the same bottle, found in a later export batch — leads ahead of the older plain
    // studio shots since it matches the site's dark-theme-leads convention.
    image: productGallery3ImagesFor("Jannat Firdaus Lifestyle")[0] ?? productGallery2ImagesFor("janat firdos")[0] ?? img("attar-jannat-firdaus"),
    gallery: [...productGallery3ImagesFor("Jannat Firdaus Lifestyle"), ...productGallery2ImagesFor("janat firdos")].length
      ? [...productGallery3ImagesFor("Jannat Firdaus Lifestyle"), ...productGallery2ImagesFor("janat firdos")]
      : [img("attar-jannat-firdaus")],
    notes: { top: ["Honey", "Fruit"], heart: ["Rose", "Oud"], base: ["Amber", "Musk", "Vanilla"] },
    longevity: "12 hours", projection: "Moderate",
    occasions: ["Festive", "Special Occasions", "Gifting"], moods: ["Opulent", "Warm"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "A rich, sweet oriental blend — honeyed rose and oud over warm amber. Jannat Firdaus is heaven's own fragrance.",
    rating: 4.9, reviews: 152, badge: "Heritage", newArrival: true,
  },
  {
    id: "a-amber", slug: "amber", name: "Amber", tagline: "Liquid warmth",
    price: 699, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Amber")[0] ?? img("attar-amber"),
    gallery: productGallery3ImagesFor("Amber").length ? productGallery3ImagesFor("Amber") : [img("attar-amber-real")],
    notes: { top: ["Benzoin"], heart: ["Amber Resin", "Labdanum"], base: ["Vanilla", "Musk"] },
    longevity: "12 hours", projection: "Intimate",
    occasions: ["Winter", "Evening", "Daily Wear"], moods: ["Warm", "Cozy"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Golden, resinous amber with a soft vanilla heart. Amber is a warm hug of a fragrance, perfect for cooler days.",
    rating: 4.7, reviews: 121,
  },
  {
    id: "a-rajnigandha", slug: "rajnigandha", name: "Rajnigandha", tagline: "Night-blooming tuberose",
    price: 599, category: "Attar", gender: "Women", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Rajnigandha")[0] ?? img("attar-rajnigandha"),
    gallery: productGallery3ImagesFor("Rajnigandha").length ? productGallery3ImagesFor("Rajnigandha") : [img("attar-rajnigandha")],
    notes: { top: ["Green Leaves"], heart: ["Tuberose", "Jasmine"], base: ["Sandalwood", "Musk"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Festive", "Pooja", "Daily Wear"], moods: ["Serene", "Feminine"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Creamy, narcotic tuberose that blooms at night. Rajnigandha is a classic Indian floral, pure and devotional.",
    rating: 4.7, reviews: 109,
  },
  {
    id: "a-lavender", slug: "lavender", name: "Lavender", tagline: "Fields of calm",
    price: 549, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Lavender")[0] ?? img("attar-lavender"),
    gallery: productGallery3ImagesFor("Lavender").length ? productGallery3ImagesFor("Lavender") : [img("attar-lavender")],
    notes: { top: ["Lavender"], heart: ["Herbs", "Geranium"], base: ["Cedar", "Musk"] },
    longevity: "8-10 hours", projection: "Soft",
    occasions: ["Daily Wear", "Relaxation", "Office"], moods: ["Calm", "Fresh"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Soothing, herbal lavender oil — clean and calming. A timeless aroma that relaxes the mind instantly.",
    rating: 4.6, reviews: 98, newArrival: true,
  },
  {
    id: "a-tulsi", slug: "tulsi", name: "Tulsi", tagline: "Sacred basil",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Tulsi")[0] ?? img("attar-tulsi"),
    gallery: [...newGalleryImagesFor("Tulsi"), img("attar-tulsi-real")],
    notes: { top: ["Holy Basil"], heart: ["Green Herbs", "Clove"], base: ["Woods", "Musk"] },
    longevity: "8 hours", projection: "Intimate",
    occasions: ["Pooja", "Meditation", "Daily Wear"], moods: ["Pure", "Grounded"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Fresh, green and sacred — Tulsi is a devotional herbal attar prized for its purity and calming spirit.",
    rating: 4.6, reviews: 84,
  },
  {
    id: "a-ruh-kewra", slug: "ruh-kewra", name: "Ruh Kewra", tagline: "Royal pandanus",
    price: 2199, compareAt: 2599, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Ruh Kewra")[0] ?? img("attar-ruh-kewra"),
    gallery: [...newGalleryImagesFor("Ruh Kewra"), img("attar-ruh-kewra")],
    notes: { top: ["Kewra Flower"], heart: ["Pandanus", "Honey"], base: ["Sandalwood", "Musk"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Festive", "Daily Wear", "Pooja"], moods: ["Refreshing", "Regal"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Sweet, fruity-floral kewra distilled from pandanus blossoms — a refreshing classic of Indian perfumery.",
    rating: 4.7, reviews: 91,
  },
  {
    id: "a-shyam-shringar", slug: "shyam-shringar", name: "Shyam Shringar", tagline: "Devotion, distilled",
    price: 649, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Shyam Shringar")[0] ?? img("attar-shyam-shringar"),
    gallery: [...newGalleryImagesFor("Shyam Shringar"), img("attar-shyam-shringar")],
    notes: { top: ["Florals"], heart: ["Rose", "Jasmine", "Saffron"], base: ["Sandalwood", "Amber", "Musk"] },
    longevity: "12 hours", projection: "Moderate",
    occasions: ["Festive", "Pooja", "Special Occasions"], moods: ["Devotional", "Warm"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "A rich devotional bouquet of rose, jasmine and saffron over sandalwood. Shyam Shringar is festive and soulful.",
    rating: 4.8, reviews: 113, trending: true,
  },
  {
    id: "a-inayat", slug: "inayat-attar", name: "Inayat Attar", tagline: "Grace in oil",
    price: 549, compareAt: 999, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // attar-inayat-gallery-1..5 are the new lifestyle/mood shoot added to the gallery
    // (July 2026). Dark/moody shots lead; gallery-5 (white background — clashes with
    // the site's dark theme) is kept last.
    image: img("attar-inayat"),
    gallery: [
      img("attar-inayat"),
      img("attar-inayat-gallery-1"),
      img("attar-inayat-gallery-2"),
      img("attar-inayat-gallery-3"),
      img("attar-inayat-gallery-4"),
      img("attar-inayat-gallery-5"),
    ],
    notes: { top: ["Saffron"], heart: ["Rose", "Oud"], base: ["Amber", "Sandalwood", "Musk"] },
    longevity: "12+ hours", projection: "Moderate",
    occasions: ["Festive", "Special Occasions", "Evening"], moods: ["Opulent", "Elegant"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "The alcohol-free attar version of our signature Inayat — saffron, rose and oud in concentrated, long-lasting oil.",
    rating: 4.9, reviews: 128, badge: "Signature",
  },
  {
    id: "a-aseel", slug: "aseel", name: "Aseel", tagline: "Pure & noble",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Aseel")[0] ?? img("attar-aseel"),
    gallery: productGallery3ImagesFor("Aseel").length ? productGallery3ImagesFor("Aseel") : [img("aseel")],
    notes: { top: ["Spices"], heart: ["Oud", "Leather"], base: ["Amber", "Musk", "Woods"] },
    longevity: "12+ hours", projection: "Moderate",
    occasions: ["Formal", "Evening", "Gifting"], moods: ["Bold", "Refined"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "A noble, spicy-woody attar with oud and leather — Aseel comes gift-ready and makes a distinguished present.",
    rating: 4.8, reviews: 96, badge: "Gift Ready",
  },

  // ─────────────── GIFT SETS ───────────────
  // Merged Aug 2026: this was two separate listings (Signature Discovery Set + Secret
  // Crush Octet Gift Set) for what is really one product with two fragrance lineups to
  // choose from — now a single "Pack of 8" product with a variant selector (mirrors how
  // Pack of 4 works below). Kept the original id/slug so the existing bestseller URL
  // keeps working. "Pack of 8/Variant 2" in the shoot folder is a reshoot of the exact
  // same Variant 1 lineup already live here — per Jatin, kept the original Discovery Set
  // photos rather than swapping to the reshoot.
  // Variant labels renamed to "Variant 1"/"Variant 2" (was "Signature"/"Secret Crush") per
  // Jatin — the descriptive scent list still shows via contentByVolume's tagline/description
  // right below the picker, so nothing is lost, only the pill/thumbnail caption changed.
  {
    id: "g-discovery", slug: "discovery-set", name: "Pack of 8 Gift Set", tagline: "Pack of 8 — pick your favourite 8-scent lineup",
    price: 699, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Variant 1", "Variant 2"],
    featuredVolume: "Variant 1", variantLabel: "Choose Your Set",
    // New mockup shoot (July 2026) — Wild, Smoke, Touch, Temptation, White Musk, Chemistry,
    // Legend, Inayat (8ml each). Confirmed with Jatin as the correct lineup for this set.
    // discovery-set-1 has a white background (clashes with the site's dark theme) so it's
    // kept later in the gallery; the two darker mockups lead.
    image: img("discovery-set-2"),
    gallery: [img("discovery-set-2"), img("discovery-set-3"), img("discovery-set-1"), img("giftset-discovery")],
    galleryByVolume: {
      "Variant 1": [img("discovery-set-2"), img("discovery-set-3"), img("discovery-set-1"), img("giftset-discovery")],
      "Variant 2": packGalleryFor("Pack of 8/variant 1"),
    },
    contentByVolume: {
      "Variant 1": {
        tagline: "Eight scents, one box",
        description: "Eight of our most-loved fragrances in a beautiful gift box — the perfect way to discover your signature or gift someone the whole world of Itrawala.",
        ingredients: "Eight 2ml premium fragrance testers in a luxury gift box.",
      },
      "Variant 2": {
        tagline: "Pack of 8 — Secret Crush, Impression, Sukoon, Honeymoon, Feel Good, Ocean Water, Celebrity & Choco Blast, 8ml each",
        description: "Eight fan favourites — Secret Crush, Impression, Sukoon, Honeymoon, Feel Good, Ocean Water, Celebrity and Choco Blast — presented together in a signature gift box.",
        ingredients: "Eight 8ml premium eau de parfum sprays in a luxury gift box.",
      },
    },
    notes: { top: ["Assorted"], heart: ["8 Signature Blends"], base: ["Perfume Testers"] },
    longevity: "Varies", projection: "Varies",
    occasions: ["Gifting", "Try Before You Buy", "Festive"], moods: ["Curious", "Generous"],
    ingredients: "Eight premium fragrances in a luxury gift box.",
    description: "Choose from two curated 8-scent lineups — the Signature Discovery Set or the Secret Crush Octet — eight of our most-loved fragrances together in one beautiful gift box.",
    rating: 4.9, reviews: 142, badge: "Best Gift", bestSeller: true,
  },
  {
    id: "g-aqua-duo", slug: "aqua-duo-gift-set", name: "Aqua Duo Gift Set", tagline: "Frozen Blue & Ocean Water",
    price: 599, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-frozenblue-oceanwater"), gallery: [img("giftset-frozenblue-oceanwater-real")],
    notes: { top: ["Marine", "Citrus"], heart: ["Aromatic Herbs"], base: ["Woods", "Musk"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Gifting", "Summer", "Daily Wear"], moods: ["Fresh", "Energetic"],
    ingredients: "Two fragrances presented in a luxury gift box.",
    description: "Our two freshest aquatics — Frozen Blue and Ocean Water — paired in one gift-ready box. Cool, crisp and effortlessly modern.",
    rating: 4.7, reviews: 78, newArrival: true,
  },
  {
    id: "g-attar-duo", slug: "attar-duo-gift-set", name: "Premium Attar Duo", tagline: "Lavender & Rajnigandha",
    price: 499, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-attar-duo"),
    gallery: [
      img("giftset-attar-duo-real"),
      ...productGallery3ImagesFor("Lavender").slice(0, 1),
      ...productGallery3ImagesFor("Rajnigandha").slice(0, 1),
    ],
    notes: { top: ["Lavender", "Green Leaves"], heart: ["Tuberose", "Herbs"], base: ["Sandalwood", "Musk"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Gifting", "Festive", "Daily Wear"], moods: ["Calm", "Feminine"],
    ingredients: "Two premium alcohol-free attars in a luxury gift box.",
    description: "A gift-ready duo of our calming Lavender and devotional Rajnigandha attars — traditional, pure and beautifully boxed.",
    rating: 4.8, reviews: 64,
  },

  // ─────────────── NEW PERFUMES (added from price sheet import) ───────────────
  {
    id: "p-million", slug: "million", name: "Million", tagline: "Feel the fortune",
    price: 749, compareAt: 1099, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 749, compareAt: 1099 }, "50ml": { price: 489, compareAt: 1799 } },
    featuredVolume: "100ml",
    // New per-size studio photography from the "Product Gallery" folder (Jul 2026).
    // A "20 ml" folder also exists there, but Million only sells 50ml/100ml today, so
    // it isn't wired to a size — flag to Jatin if a 20ml size should be added for sale.
    image: galleryImagesFor("Million", "100 ml")[0] ?? img("million"),
    gallery: galleryImagesFor("Million", "100 ml").length ? galleryImagesFor("Million", "100 ml") : [img("million")],
    galleryByVolume: {
      "50ml": galleryImagesFor("Million", "50 ml").length ? galleryImagesFor("Million", "50 ml") : [img("million")],
      "100ml": galleryImagesFor("Million", "100 ml").length ? galleryImagesFor("Million", "100 ml") : [img("million")],
    },
    notes: { top: ["Bergamot", "Mandarin"], heart: ["Cinnamon", "Rose"], base: ["Amber", "Patchouli", "Leather"] },
    longevity: "8-10 hours", projection: "Strong",
    occasions: ["Evening", "Parties", "Special Occasions"], moods: ["Bold", "Magnetic"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Million is a warm, spiced-amber statement scent — bold and gold, made for the nights you want to be remembered.",
    rating: 4.6, reviews: 58, newArrival: true,
  },
  {
    id: "p-smoke", slug: "smoke", name: "Smoke", tagline: "Dark, magnetic, unforgettable",
    price: 749, compareAt: 1099, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "50ml": { price: 449, compareAt: 649 }, "100ml": { price: 749, compareAt: 1099 } },
    featuredVolume: "100ml",
    // Shoot batch also included a 20ml lineup, but Smoke isn't sold in 20ml on this site
    // (no price for it) — those photos are left unused rather than wired into a size that
    // isn't purchasable.
    image: newGalleryImagesFor("Smoke/100 ml")[0] ?? img("smoke"),
    gallery: [...newGalleryImagesFor("Smoke/100 ml"), img("smoke")],
    galleryByVolume: {
      "50ml": [...newGalleryImagesFor("Smoke/50 ml"), img("smoke")],
      "100ml": [...newGalleryImagesFor("Smoke/100 ml"), img("smoke")],
    },
    notes: { top: ["Smoke Accord", "Black Pepper"], heart: ["Leather", "Oud"], base: ["Vetiver", "Amber"] },
    longevity: "10-12 hours", projection: "Strong",
    occasions: ["Evening", "Winter", "Formal"], moods: ["Mysterious", "Bold"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Smoke is a dark, woody-leather composition with a smoky trail that lingers — brooding, magnetic, unforgettable.",
    rating: 4.6, reviews: 47, newArrival: true,
  },
  {
    id: "p-dubai-fame", slug: "dubai-fame", name: "Dubai Fame", tagline: "Exotic Gulf glamour",
    price: 549, compareAt: 999, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "50ml": { price: 349, compareAt: 749 }, "100ml": { price: 549, compareAt: 999 } },
    featuredVolume: "100ml",
    // New per-size studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Dubai Fame/100 ml")[0] ?? img("dubai-fame"),
    gallery: productGallery3ImagesFor("Dubai Fame/100 ml").length ? productGallery3ImagesFor("Dubai Fame/100 ml") : [img("dubai-fame")],
    galleryByVolume: {
      "50ml": productGallery3ImagesFor("Dubai Fame/50 ml").length ? productGallery3ImagesFor("Dubai Fame/50 ml") : [img("dubai-fame")],
      "100ml": productGallery3ImagesFor("Dubai Fame/100 ml").length ? productGallery3ImagesFor("Dubai Fame/100 ml") : [img("dubai-fame")],
    },
    notes: { top: ["Saffron", "Dates"], heart: ["Oud", "Rose"], base: ["Amber", "Musk"] },
    longevity: "10+ hours", projection: "Strong",
    occasions: ["Evening", "Festive", "Special Occasions"], moods: ["Opulent", "Exotic"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Inspired by the glamour of the Gulf — Dubai Fame layers saffron and rose over deep oud and amber for an exotic, long-lasting trail.",
    rating: 4.7, reviews: 63, newArrival: true,
  },
  {
    id: "p-valentine", slug: "valentine", name: "Valentine", tagline: "Easy to fall for",
    price: 749, compareAt: 1099, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 749, compareAt: 1099 }, "50ml": { price: 499, compareAt: 1799 } },
    featuredVolume: "100ml",
    // New per-size studio photography from the "Product Gallery" folder (Jul 2026).
    // A "20 ml" folder also exists there, but Valentine only sells 50ml/100ml today, so
    // it isn't wired to a size — flag to Jatin if a 20ml size should be added for sale.
    image: galleryImagesFor("Valentine", "100 ml")[0] ?? img("valentine"),
    gallery: galleryImagesFor("Valentine", "100 ml").length ? galleryImagesFor("Valentine", "100 ml") : [img("valentine")],
    galleryByVolume: {
      "50ml": galleryImagesFor("Valentine", "50 ml").length ? galleryImagesFor("Valentine", "50 ml") : [img("valentine")],
      "100ml": galleryImagesFor("Valentine", "100 ml").length ? galleryImagesFor("Valentine", "100 ml") : [img("valentine")],
    },
    notes: { top: ["Red Berries", "Pink Pepper"], heart: ["Rose", "Peony"], base: ["Musk", "Vanilla"] },
    longevity: "8-10 hours", projection: "Moderate",
    occasions: ["Date Night", "Evening", "Celebrations"], moods: ["Romantic", "Playful"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Valentine is a sweet, romantic floral-musk built for the moments that matter — soft, memorable, and easy to fall for.",
    rating: 4.7, reviews: 71, newArrival: true,
  },
  {
    id: "p-aura", slug: "aura", name: "Aura", tagline: "Quiet luxury, worn daily",
    price: 949, compareAt: 1299, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 949, compareAt: 1299 }, "50ml": { price: 649, compareAt: 1099 } },
    featuredVolume: "100ml",
    // New per-size studio photography from the "Product Gallery" folder (Jul 2026).
    image: galleryImagesFor("aura", "100 ml")[0] ?? img("aura"),
    gallery: galleryImagesFor("aura", "100 ml").length ? galleryImagesFor("aura", "100 ml") : [img("aura")],
    galleryByVolume: {
      "50ml": galleryImagesFor("aura", "50 ml").length ? galleryImagesFor("aura", "50 ml") : [img("aura")],
      "100ml": galleryImagesFor("aura", "100 ml").length ? galleryImagesFor("aura", "100 ml") : [img("aura")],
    },
    notes: { top: ["Bergamot", "Iris"], heart: ["Woody Florals"], base: ["Sandalwood", "Amber", "Musk"] },
    longevity: "8-10 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Office", "Evening"], moods: ["Elegant", "Grounded"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Aura is a rich woody-floral that wraps the skin like a second signature — quiet luxury for daily wear and special occasions alike.",
    rating: 4.6, reviews: 39, newArrival: true,
  },
  {
    id: "p-melody", slug: "melody", name: "Melody", tagline: "Sweet & enchanting",
    price: 549, compareAt: 999, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 549, compareAt: 999 }, "50ml": { price: 349, compareAt: 749 } },
    featuredVolume: "100ml",
    // New per-size studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Melody/100 ml")[0] ?? img("melody"),
    gallery: productGallery3ImagesFor("Melody/100 ml").length ? productGallery3ImagesFor("Melody/100 ml") : [img("melody")],
    galleryByVolume: {
      "50ml": productGallery3ImagesFor("Melody/50 ml").length ? productGallery3ImagesFor("Melody/50 ml") : [img("melody")],
      "100ml": productGallery3ImagesFor("Melody/100 ml").length ? productGallery3ImagesFor("Melody/100 ml") : [img("melody")],
    },
    notes: { top: ["Pear", "Bergamot"], heart: ["Jasmine", "Violet"], base: ["Musk", "Tonka"] },
    longevity: "6-8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Brunch", "Casual"], moods: ["Fresh", "Joyful"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Melody is a light, musical floral — playful top notes over a soft musky base, perfect for everyday wear.",
    rating: 4.5, reviews: 34, newArrival: true,
  },
  {
    id: "p-choco-blast", slug: "choco-blast", name: "Choco Blast", tagline: "Sweet, cozy, addictive",
    price: 749, compareAt: 1099, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 749, compareAt: 1099 }, "20ml": { price: 299, compareAt: 349 }, "50ml": { price: 489, compareAt: 999 } },
    featuredVolume: "100ml",
    // New per-size studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Choco Blast/100 ml")[0] ?? img("choco-blast"),
    gallery: productGallery3ImagesFor("Choco Blast/100 ml").length ? productGallery3ImagesFor("Choco Blast/100 ml") : [img("choco-blast")],
    galleryByVolume: {
      "20ml": productGallery3ImagesFor("Choco Blast/20 ml").length ? productGallery3ImagesFor("Choco Blast/20 ml") : [img("choco-blast")],
      "50ml": productGallery3ImagesFor("Choco Blast/50 ml").length ? productGallery3ImagesFor("Choco Blast/50 ml") : [img("choco-blast")],
      "100ml": productGallery3ImagesFor("Choco Blast/100 ml").length ? productGallery3ImagesFor("Choco Blast/100 ml") : [img("choco-blast")],
    },
    notes: { top: ["Cocoa", "Orange"], heart: ["Praline", "Vanilla"], base: ["Musk", "Tonka"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Date Night", "Winter"], moods: ["Sweet", "Cozy"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Choco Blast is a gourmand treat — rich cocoa and praline warmed by vanilla and musk. Sweet, comforting, addictive.",
    rating: 4.5, reviews: 28, newArrival: true,
  },
  {
    id: "p-honeymoon", slug: "honeymoon", name: "Honeymoon", tagline: "Made for beginnings",
    price: 649, compareAt: 849, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 649, compareAt: 849 }, "50ml": { price: 499, compareAt: 749 } },
    featuredVolume: "100ml",
    // The shoot batch also included a 20ml lineup (product-gallery-2/Honey moon/20 ml),
    // but Honeymoon isn't sold in 20ml on this site (no price for it) — those photos are
    // left unused rather than wired into a size that isn't purchasable.
    image: productGallery2ImagesFor("Honey moon/100 ml")[0] ?? img("honeymoon"),
    gallery: productGallery2ImagesFor("Honey moon/100 ml").length ? productGallery2ImagesFor("Honey moon/100 ml") : [img("honeymoon")],
    galleryByVolume: {
      "50ml": productGallery2ImagesFor("Honey moon/50 ml").length ? productGallery2ImagesFor("Honey moon/50 ml") : [img("honeymoon")],
      "100ml": productGallery2ImagesFor("Honey moon/100 ml").length ? productGallery2ImagesFor("Honey moon/100 ml") : [img("honeymoon")],
    },
    notes: { top: ["Peach", "Bergamot"], heart: ["Jasmine", "Orchid"], base: ["Vanilla", "Musk", "Amber"] },
    longevity: "8-10 hours", projection: "Moderate",
    occasions: ["Date Night", "Festive", "Celebrations"], moods: ["Romantic", "Sweet"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Honeymoon is a soft, sweet floral-oriental made for beginnings — fruity top notes settling into warm vanilla and musk.",
    rating: 4.6, reviews: 41, newArrival: true,
  },
  {
    id: "p-blue-ice", slug: "blue-ice", name: "Blue Ice", tagline: "Refreshingly cool",
    price: 549, compareAt: 999, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 549, compareAt: 999 }, "50ml": { price: 349, compareAt: 749 } },
    featuredVolume: "100ml",
    // New per-size studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Blue Ice/100 ml")[0] ?? img("blue-ice"),
    gallery: productGallery3ImagesFor("Blue Ice/100 ml").length ? productGallery3ImagesFor("Blue Ice/100 ml") : [img("blue-ice")],
    galleryByVolume: {
      "50ml": productGallery3ImagesFor("Blue Ice/50 ml").length ? productGallery3ImagesFor("Blue Ice/50 ml") : [img("blue-ice")],
      "100ml": productGallery3ImagesFor("Blue Ice/100 ml").length ? productGallery3ImagesFor("Blue Ice/100 ml") : [img("blue-ice")],
    },
    notes: { top: ["Marine Accord", "Mint"], heart: ["Lavender", "Sage"], base: ["Musk", "Driftwood"] },
    longevity: "6-8 hours", projection: "Moderate",
    occasions: ["Office", "Casual", "Summer"], moods: ["Fresh", "Energetic"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Blue Ice is a crisp, icy-fresh aquatic — clean and invigorating, built for warm days and long hours.",
    rating: 4.5, reviews: 36, newArrival: true,
  },

  // ─────────────── NEW ATTARS (added from price sheet import) ───────────────
  {
    id: "a-sukoon", slug: "sukoon-attar", name: "Sukoon Attar", tagline: "Peace, in oil",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Sukoon Attar")[0] ?? img("attar-sukoon"),
    gallery: [...newGalleryImagesFor("Sukoon Attar"), img("attar-sukoon")],
    notes: { top: ["Lavender"], heart: ["Cedar", "Iris"], base: ["Amber", "Musk"] },
    longevity: "12+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Meditation", "Relaxation"], moods: ["Calm", "Grounded"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "The alcohol-free attar version of our calming Sukoon — a soothing, woody-aromatic oil that feels like a deep breath.",
    rating: 4.7, reviews: 52, newArrival: true,
  },
  {
    id: "a-oud-wood", slug: "oud-wood-attar", name: "Oud Wood Attar", tagline: "Aged oud, concentrated",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Oud Wood Attar")[0] ?? img("attar-oud-wood"),
    gallery: productGallery3ImagesFor("Oud Wood Attar").length ? productGallery3ImagesFor("Oud Wood Attar") : [img("attar-oud-wood")],
    notes: { top: ["Smoke"], heart: ["Aged Oud", "Leather"], base: ["Sandalwood", "Amber"] },
    longevity: "12+ hours", projection: "Strong",
    occasions: ["Formal", "Evening", "Winter"], moods: ["Bold", "Mysterious"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Deep, smoky aged oud in concentrated oil form — the attar rendition of our signature Oud Wood.",
    rating: 4.7, reviews: 45, newArrival: true,
  },
  {
    id: "a-honeymoon", slug: "honeymoon-attar", name: "Honeymoon Attar", tagline: "Sweet beginnings, in oil",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Honeymoon Attar")[0] ?? img("attar-honeymoon"),
    gallery: productGallery3ImagesFor("Honeymoon Attar").length ? productGallery3ImagesFor("Honeymoon Attar") : [img("attar-honeymoon")],
    notes: { top: ["Peach"], heart: ["Jasmine", "Rose"], base: ["Vanilla", "Musk", "Amber"] },
    longevity: "10-12 hours", projection: "Moderate",
    occasions: ["Festive", "Gifting", "Special Occasions"], moods: ["Romantic", "Sweet"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "A sweet, floral-oriental attar made for new beginnings — honeyed and warm.",
    rating: 4.6, reviews: 33, newArrival: true,
  },
  {
    id: "a-lotus", slug: "lotus", name: "Lotus", tagline: "Water's first bloom",
    price: 699, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Lotus")[0] ?? img("attar-lotus"),
    gallery: productGallery3ImagesFor("Lotus").length ? productGallery3ImagesFor("Lotus") : [img("attar-lotus")],
    notes: { top: ["Lotus Petals"], heart: ["White Florals"], base: ["Sandalwood", "Musk"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Pooja", "Daily Wear", "Festive"], moods: ["Serene", "Pure"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "A soft, aquatic-floral attar inspired by the lotus in bloom — serene and devotional.",
    rating: 4.6, reviews: 29, newArrival: true,
  },
  {
    id: "a-maati", slug: "maati", name: "Maati", tagline: "Scent of the earth",
    price: 1099, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Maati")[0] ?? img("attar-maati"),
    gallery: productGallery3ImagesFor("Maati").length ? productGallery3ImagesFor("Maati") : [img("attar-maati")],
    notes: { top: ["Earthy Petrichor"], heart: ["Vetiver", "Patchouli"], base: ["Sandalwood", "Musk"] },
    longevity: "10-12 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Monsoon", "Meditation"], moods: ["Grounded", "Nostalgic"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Maati captures the scent of rain on parched earth — grounding, earthy, and deeply Indian.",
    rating: 4.7, reviews: 31, newArrival: true,
  },
  {
    id: "a-ruh-heena", slug: "ruh-heena", name: "Ruh Heena", tagline: "Heena's deepest note",
    price: 1399, compareAt: 1599, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Ruh Heena")[0] ?? img("attar-ruh-heena"),
    gallery: [...newGalleryImagesFor("Ruh Heena"), img("attar-ruh-heena")],
    notes: { top: ["Herbal Green"], heart: ["Heena Flower", "Musk"], base: ["Amber", "Woods"] },
    longevity: "14+ hours", projection: "Strong",
    occasions: ["Festive", "Special Occasions", "Winter"], moods: ["Regal", "Traditional"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Ruh Heena captures the deep, herbal-musky note of pure heena oil — traditional and long-lasting.",
    rating: 4.8, reviews: 27, newArrival: true,
  },
  {
    id: "a-ruh-khus", slug: "ruh-khus", name: "Ruh Khus", tagline: "Cooling roots of khus",
    price: 1999, compareAt: 2499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Ruh Khus")[0] ?? img("attar-ruh-khus"),
    gallery: [...newGalleryImagesFor("Ruh Khus"), img("attar-ruh-khus")],
    notes: { top: ["Khus Root"], heart: ["Green Herbs"], base: ["Woods", "Musk"] },
    longevity: "10-12 hours", projection: "Moderate",
    occasions: ["Summer", "Daily Wear", "Relaxation"], moods: ["Fresh", "Grounded"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Distilled from cooling khus roots, Ruh Khus is earthy, green and refreshing — a summer classic of Indian perfumery.",
    rating: 4.7, reviews: 22, newArrival: true,
  },
  {
    id: "a-ruh-mogra", slug: "ruh-mogra", name: "Ruh Mogra", tagline: "Jasmine's purest oil",
    price: 1599, compareAt: 2499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: img("attar-ruh-mogra"), gallery: [img("attar-ruh-mogra")],
    notes: { top: ["Mogra Buds"], heart: ["Jasmine Sambac"], base: ["White Musk", "Sandalwood"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Festive", "Daily Wear", "Pooja"], moods: ["Joyful", "Pure"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Pure mogra distilled at its peak — heady, sweet jasmine in concentrated oil form.",
    rating: 4.7, reviews: 24, newArrival: true,
  },

  // ─────────────── NEW GIFT SETS (added from price sheet import) ───────────────
  // Merged Aug 2026: this was four separate listings (Signature/Legend/Secret Crush/
  // Honeymoon Quad Gift Sets) for what is really one product with four fragrance lineups
  // to choose from — now a single "Pack of 4" product with a variant selector. Variant
  // labels renamed to "Variant 1".."Variant 4" (was Signature/Legend/Secret Crush/
  // Honeymoon) per Jatin — the descriptive scent list still shows via contentByVolume's
  // tagline/description right below the picker, so nothing is lost, only the
  // pill/thumbnail caption changed.
  // "pack of 4/variant 5" turned out to be a reshoot of the same Honeymoon lineup
  // (identical 4 scents, different flat-lay composition) — per Jatin, swapped Variant 4's
  // gallery to these newer photos rather than listing it as a separate 5th option
  // ("variant 4" folder was a byte-for-byte duplicate of variant 3, so it was never a
  // real distinct lineup either — still just these 4 total).
  {
    id: "g-pack-of-4", slug: "pack-of-4-gift-set", name: "Pack of 4 Gift Set", tagline: "Pack of 4 — pick your favourite fragrance lineup, 20ml each",
    price: 699, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Variant 1", "Variant 2", "Variant 3", "Variant 4"],
    featuredVolume: "Variant 1", variantLabel: "Choose Your Set",
    image: img("giftset-signature-quad"),
    gallery: [
      img("giftset-signature-quad"),
      img("giftset-signature-quad-2"),
      img("giftset-signature-quad-4"),
      img("giftset-signature-quad-3"),
      img("giftset-signature-quad-lifestyle"),
    ],
    galleryByVolume: {
      "Variant 1": [
        img("giftset-signature-quad"),
        img("giftset-signature-quad-2"),
        img("giftset-signature-quad-4"),
        img("giftset-signature-quad-3"),
        img("giftset-signature-quad-lifestyle"),
      ],
      "Variant 2": packGalleryFor("pack of 4/variant 1"),
      "Variant 3": packGalleryFor("pack of 4/variant 2"),
      "Variant 4": packGalleryFor("pack of 4/variant 5"),
    },
    contentByVolume: {
      "Variant 1": {
        tagline: "Pack of 4 — Touch, Wild, Temptation & Smoke, 20ml each",
        description: "Four of our most-loved fragrances — Touch, Wild, Temptation and Smoke — presented together in a signature gift box.",
      },
      "Variant 2": {
        tagline: "Pack of 4 — Legend, Sukoon, Choco Blast & Ocean Water, 20ml each",
        description: "Four fan favourites — Legend, Sukoon, Choco Blast and Ocean Water — presented together in a signature gift box.",
      },
      "Variant 3": {
        tagline: "Pack of 4 — Secret Crush, Valentine, Chemistry & White Musk, 20ml each",
        description: "A romantic quartet — Secret Crush, Valentine, Chemistry and White Musk — presented together in a signature gift box.",
      },
      "Variant 4": {
        tagline: "Pack of 4 — Honeymoon, Ocean Water, Choco Blast & Sukoon, 20ml each",
        description: "Four fan favourites — Honeymoon, Ocean Water, Choco Blast and Sukoon — presented together in a signature gift box.",
      },
    },
    notes: { top: ["Assorted"], heart: ["4 Signature Blends"], base: ["Perfume Testers"] },
    longevity: "Varies", projection: "Varies",
    occasions: ["Gifting", "Try Before You Buy", "Festive"], moods: ["Curious", "Generous"],
    ingredients: "Four 20ml premium eau de parfum sprays in a luxury gift box.",
    description: "Choose from four curated 4-scent lineups — all 20ml eau de parfum sprays presented together in a signature gift box.",
    rating: 4.8, reviews: 22, newArrival: true,
  },
  {
    id: "g-rooh-chandan-duo", slug: "rooh-chandan-duo-gift-set", name: "Rooh Chandan Duo", tagline: "Two bottles, one sacred sandalwood",
    price: 499, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-rooh-chandan-duo"),
    gallery: [img("giftset-rooh-chandan-duo"), ...productGallery2ImagesFor("Rooh Chandan").slice(0, 2)],
    notes: { top: ["Cardamom"], heart: ["Sandalwood", "Rose"], base: ["Cream", "Amber", "Vanilla"] },
    longevity: "12+ hours", projection: "Intimate",
    occasions: ["Gifting", "Festive", "Meditation"], moods: ["Calm", "Devotional"],
    ingredients: "Two alcohol-free Rooh Chandan attars presented in a luxury gift box.",
    description: "Our meditative sandalwood attar, gifted in pairs — Rooh Chandan Duo is ready to share or keep both for yourself.",
    rating: 4.8, reviews: 19, newArrival: true,
  },

  // ─────────────── ADDED FROM "New Price sheet .xlsx" (photo + live price confirmed) ───────────────
  {
    id: "p-black-gold", slug: "black-gold", name: "Black Gold", tagline: "Dark, luxurious, unforgettable",
    price: 549, compareAt: 999, category: "Perfume", gender: "Unisex", volume: ["100ml"],
    // New studio photography (Aug 2026) replaces the old single generic photo. A "50 ml"
    // folder also exists there, but Black Gold only sells 100ml today, so it isn't wired
    // to a size — flag to Jatin if a 50ml size should be added for sale.
    image: productGallery3ImagesFor("Black Gold/100 ml")[0] ?? img("black-gold"),
    gallery: productGallery3ImagesFor("Black Gold/100 ml").length ? productGallery3ImagesFor("Black Gold/100 ml") : [img("black-gold")],
    notes: { top: ["Bergamot", "Black Pepper"], heart: ["Oud", "Leather"], base: ["Amber", "Musk", "Vanilla"] },
    longevity: "8-10 hours", projection: "Strong",
    occasions: ["Evening", "Celebrations", "Formal"], moods: ["Bold", "Mysterious"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Black Gold is dark amber and warm leather wrapped in gold — a bold, magnetic signature for evenings that matter.",
    rating: 4.7, reviews: 38, newArrival: true,
  },
  {
    id: "a-famous", slug: "famous", name: "Famous", tagline: "Command the room",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Famous")[0] ?? img("famous"),
    gallery: productGallery3ImagesFor("Famous").length ? productGallery3ImagesFor("Famous") : [img("famous")],
    notes: { top: ["Saffron", "Bergamot"], heart: ["Oud", "Rose"], base: ["Amber", "Musk"] },
    longevity: "10+ hours", projection: "Strong",
    occasions: ["Evening", "Special Occasions", "Formal"], moods: ["Confident", "Magnetic"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "A concentrated blend of saffron, oud and amber — Famous is built to be remembered.",
    rating: 4.7, reviews: 29, newArrival: true,
  },
  {
    id: "a-feel-good", slug: "feel-good", name: "Feel Good", tagline: "Effortless everyday joy",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Feel Good Attar")[0] ?? img("attar-feel-good"),
    gallery: productGallery3ImagesFor("Feel Good Attar").length ? productGallery3ImagesFor("Feel Good Attar") : [img("feel-good")],
    notes: { top: ["Citrus", "Green Notes"], heart: ["Mixed Florals"], base: ["White Musk", "Woods"] },
    longevity: "8-10 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Office", "Brunch"], moods: ["Fresh", "Joyful"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Bright citrus and soft florals for a scent that lifts the mood the moment it's on.",
    rating: 4.6, reviews: 22, newArrival: true,
  },
  {
    id: "a-guldasta", slug: "guldasta", name: "Guldasta", tagline: "A bouquet in a bottle",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Guldasta")[0] ?? img("guldasta"),
    gallery: newGalleryImagesFor("Guldasta").length ? newGalleryImagesFor("Guldasta") : [img("guldasta")],
    notes: { top: ["Rose", "Jasmine"], heart: ["Mixed Florals"], base: ["Sandalwood", "Musk"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Daily Wear", "Festive", "Pooja"], moods: ["Joyful", "Pure"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Guldasta — Hindi for 'bouquet' — layers rose, jasmine and mixed florals into one traditional, garden-fresh attar.",
    rating: 4.7, reviews: 31, newArrival: true,
  },
  {
    id: "a-kesar-gulab", slug: "kesar-gulab", name: "Kesar Gulab", tagline: "Saffron-kissed rose",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Kesar Gulab")[0] ?? img("kesar-gulab"),
    gallery: productGallery3ImagesFor("Kesar Gulab").length ? productGallery3ImagesFor("Kesar Gulab") : [img("kesar-gulab")],
    notes: { top: ["Saffron"], heart: ["Turkish Rose", "Rose Petals"], base: ["Sandalwood", "Musk"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Special Occasions", "Festive", "Gifting"], moods: ["Regal", "Romantic"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Luxurious saffron threaded through full-bloom rose — Kesar Gulab is a special-occasion attar built for memory-making.",
    rating: 4.8, reviews: 27, newArrival: true,
  },
  {
    id: "g-whiteoud-blackoud-duo", slug: "whiteoud-blackoud-gift-set", name: "White Oud & Black Oud Duo", tagline: "White Oud & Black Oud",
    price: 999, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-whiteoud-blackoud"), gallery: [img("giftset-whiteoud-blackoud")],
    notes: { top: ["Smoke", "Woods"], heart: ["Aged Oud", "Spices"], base: ["Amber", "Musk", "Resin"] },
    longevity: "12+ hours", projection: "Strong",
    occasions: ["Gifting", "Formal", "Winter"], moods: ["Regal", "Mysterious"],
    ingredients: "Two alcohol-free oud attars presented in a luxury gift box.",
    description: "Two sides of oud, paired — the bright clarity of White Oud and the smoky depth of Black Oud, boxed together for gifting.",
    rating: 4.7, reviews: 16, newArrival: true,
  },
  {
    id: "g-mogragold-shahigulab-duo", slug: "mogragold-shahigulab-gift-set", name: "Mogra Gold & Shahi Gulab Duo", tagline: "Mogra Gold & Shahi Gulab",
    price: 499, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-mogragold-shahigulab"),
    gallery: [
      img("giftset-mogragold-shahigulab"),
      ...productGallery2ImagesFor("Mogra Gold").slice(0, 1),
      ...newGalleryImagesFor("Shahi Gulab Attar").slice(0, 1),
    ],
    notes: { top: ["Mogra Buds", "Rose Petals"], heart: ["Jasmine Sambac", "Turkish Rose"], base: ["White Musk", "Sandalwood"] },
    longevity: "10 hours", projection: "Intimate",
    occasions: ["Gifting", "Festive", "Pooja"], moods: ["Joyful", "Romantic"],
    ingredients: "Two alcohol-free attars presented in a luxury gift box.",
    description: "Our two best-loved florals, boxed together — golden jasmine Mogra Gold and royal rose Shahi Gulab.",
    rating: 4.8, reviews: 21, newArrival: true,
  },
  {
    id: "g-royaloud-shyamshringar-duo", slug: "royaloud-shyamshringar-gift-set", name: "Royal Oud & Shyam Shringar Duo", tagline: "Royal Oud & Shyam Shringar",
    price: 499, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-royaloud-shyamshringar"),
    gallery: [
      img("giftset-royaloud-shyamshringar"),
      ...newGalleryImagesFor("Royal Oud Attar").slice(0, 1),
      ...newGalleryImagesFor("Shyam Shringar").slice(0, 1),
    ],
    notes: { top: ["Smoke", "Florals"], heart: ["Aged Oud", "Rose", "Jasmine", "Saffron"], base: ["Sandalwood", "Amber", "Musk", "Woods"] },
    longevity: "12+ hours", projection: "Strong",
    occasions: ["Gifting", "Special Occasions", "Devotional"], moods: ["Regal", "Devotional"],
    ingredients: "Two alcohol-free attars presented in a luxury gift box.",
    description: "The king of attars meets our devotional favorite — Royal Oud and Shyam Shringar, paired in one gift-ready box.",
    rating: 4.8, reviews: 18, newArrival: true,
  },
  {
    id: "ce-shabd", slug: "shabd", name: "Shabd", tagline: "The first word of every story",
    price: 1999, compareAt: 2999, category: "Collector's Edition", gender: "Unisex", volume: ["100ml"],
    image: img("collector-shabd-1"), gallery: [img("collector-shabd-1"), img("collector-shabd-2"), img("collector-shabd-3"), img("collector-shabd-4"), img("collector-shabd-5"), img("collector-shabd-6"), img("collector-shabd-7")],
    notes: { top: ["Bergamot", "Black Pepper"], heart: ["Saffron", "Aged Oud"], base: ["Amber", "Musk", "Sandalwood"] },
    longevity: "10-12 hours", projection: "Strong",
    occasions: ["Gifting", "Weddings", "Anniversaries", "Festive"], moods: ["Bold", "Timeless"],
    ingredients: "High-concentration Extrait de Parfum oils, French-grade alcohol base.",
    description: "Shabd — the word — opens our Collector's Edition trilogy. A rich, French-inspired Extrait de Parfum with spiced bergamot and saffron over aged oud, amber and musk, built to last up to 24 hours. Presented in a hand-finished 100ml bottle with luxury gift packaging.",
    // Taken from this product's Amazon listing (ASIN B0H7T53GC5) so both storefronts
    // state the same specs.
    //
    // Two rows from that listing are deliberately NOT copied here because they contradict
    // what this site already says about the product, and publishing both would put two
    // conflicting claims in front of the same shopper:
    //   - "Material Type Free: Alcohol Free" vs. the `ingredients` line above, which
    //     states a French-grade alcohol base. An Extrait de Parfum normally is
    //     alcohol-based, so the Amazon row looks like the wrong one — needs confirming.
    //   - "Scent Duration: 8 Hours" vs. `longevity: "10-12 hours"` here and "up to 24
    //     hours" in the Amazon bullet copy — three different numbers for one product.
    // Resolve those upstream, then add the rows back.
    highlights: [
      "Premium long-lasting fragrance — a luxurious scent that stays fresh with a rich, elegant character.",
      "Extrait de Parfum concentration — a high concentration of premium fragrance oils for a stronger, longer-lasting aroma.",
      "Perfect for every occasion — office, parties, weddings, festivals, date nights and everyday wear.",
      "Elegant unisex perfume — designed for both men and women who appreciate sophisticated, premium fragrances.",
      "Premium gift choice — a luxury bottle and packaging that make it ideal for birthdays, anniversaries, weddings and festive gifting.",
    ],
    specs: {
      Brand: "Itra Wala",
      "Model Name": "Luxury Extrait De Parfum 100ml for Men & Women",
      "Item Form": "Liquid",
      Scent: "Luxury Oriental Woody",
      "Fragrance Concentration": "Perfume Oil",
      "Special Feature": "Long Lasting",
      "Application Mode": "Direct Application, Spray",
      Theme: "Artisan, Collector's Edition, Cultural Poetry, Emotions, Indian Heritage, Luxury Gifting",
      "Age Range": "Adult",
      "Net Quantity": "100.0 millilitres",
      "Item Volume": "100 millilitres",
      "Item Weight": "100 g",
      "Product Dimensions": "11 × 7 × 4 cm",
      "Number of Items": "1",
      "Generic Name": "Perfume",
      "Country of Origin": "India",
      Manufacturer: "Itra Wala",
      Packer: "Itra Wala",
    },
    rating: 4.9, reviews: 24, badge: "Collector's Edition", newArrival: true,
  },
  {
    id: "ce-kahani", slug: "kahani", name: "Kahani", tagline: "A story worth keeping",
    price: 1999, compareAt: 2999, category: "Collector's Edition", gender: "Unisex", volume: ["100ml"],
    image: img("collector-kahani-6"), gallery: [img("collector-kahani-6"), img("collector-kahani-2"), img("collector-kahani-4"), img("collector-kahani-1"), img("collector-kahani-3"), img("collector-kahani-5"), img("collector-kahani-7")],
    notes: { top: ["Cardamom", "Pink Pepper"], heart: ["Rose", "Leather"], base: ["Vanilla", "Amber", "Oud"] },
    longevity: "10-12 hours", projection: "Strong",
    occasions: ["Gifting", "Weddings", "Anniversaries", "Festive"], moods: ["Warm", "Narrative"],
    ingredients: "High-concentration Extrait de Parfum oils, French-grade alcohol base.",
    description: "Kahani — the story — layers spiced cardamom and rose over leather, vanilla, amber and oud. A rich, French-inspired Extrait de Parfum built to last up to 24 hours, presented in a hand-finished 100ml bottle with luxury gift packaging.",
    rating: 5.0, reviews: 19, badge: "Collector's Edition", newArrival: true,
  },
  {
    id: "ce-ehsaas", slug: "ehsaas", name: "Ehsaas", tagline: "A feeling that stays",
    price: 1999, compareAt: 2999, category: "Collector's Edition", gender: "Unisex", volume: ["100ml"],
    image: img("collector-ehsaas-1"), gallery: [img("collector-ehsaas-1"), img("collector-ehsaas-2"), img("collector-ehsaas-3"), img("collector-ehsaas-4"), img("collector-ehsaas-5"), img("collector-ehsaas-6")],
    notes: { top: ["Bergamot", "Saffron"], heart: ["Jasmine", "Oud"], base: ["Musk", "Sandalwood", "Amber"] },
    longevity: "10-12 hours", projection: "Strong",
    occasions: ["Gifting", "Weddings", "Anniversaries", "Festive"], moods: ["Sensual", "Intimate"],
    ingredients: "High-concentration Extrait de Parfum oils, French-grade alcohol base.",
    description: "Ehsaas — the feeling — closes the trilogy as a luxury oriental woody Extrait de Parfum, layering jasmine and oud over saffron, musk and sandalwood. A high-concentration formula built to stay fresh for up to 24 hours, elegant enough for the office and warm enough for date nights, weddings and festive occasions. Designed unisex, and presented in a hand-finished 100ml bottle with premium gift packaging — a perfect gift for birthdays, anniversaries and celebrations.",
    rating: 4.9, reviews: 22, badge: "Collector's Edition", newArrival: true,
  },

  //─────────────── IMPORTED FROM "new price list.xlsx" ───────────────
  {
    id: "a-celebrity", slug: "celebrity-attar", name: "Celebrity Attar", tagline: "Discover this fragrance",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads. The old pre-photoshoot fallback shot
    // used to be appended as a 6th gallery image — dropped per Jatin, since the 5 new
    // studio photos fully replace it and it read as a redundant, lower-quality repeat.
    image: newGalleryImagesFor("Celebrity Attar")[0] ?? img("attar-celebrity"),
    gallery: newGalleryImagesFor("Celebrity Attar").length ? newGalleryImagesFor("Celebrity Attar") : [img("attar-celebrity")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Celebrity Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-wild", slug: "wild", name: "Wild", tagline: "Discover this fragrance",
    price: 899, compareAt: 1799, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 899, compareAt: 1799 }, "50ml": { price: 449, compareAt: 1299 } },
    featuredVolume: "100ml",
    image: newGalleryImagesFor("Wild/100 ml")[0] ?? img("wild"),
    gallery: [...newGalleryImagesFor("Wild/100 ml"), img("wild")],
    galleryByVolume: {
      "50ml": [...newGalleryImagesFor("Wild/50 ml"), img("wild")],
      "100ml": [...newGalleryImagesFor("Wild/100 ml"), img("wild")],
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Wild — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-saffron-sandal", slug: "saffron-sandal", name: "Saffron Sandal", tagline: "Discover this fragrance",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Saffron Sandal")[0] ?? img("saffron-sandal"),
    gallery: [...newGalleryImagesFor("Saffron Sandal"), img("saffron-sandal")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Saffron Sandal — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-feel-good", slug: "feel-good-new", name: "Feel Good", tagline: "Discover this fragrance",
    price: 1499, compareAt: 1499, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 1499, compareAt: 1499 }, "50ml": { price: 489, compareAt: 1499 } },
    featuredVolume: "100ml",
    // New per-size studio photography (Aug 2026) replaces the old single generic photo. A
    // "20 ml" folder also exists there, but Feel Good only sells 50ml/100ml today, so it
    // isn't wired to a size — flag to Jatin if a 20ml size should be added for sale.
    image: productGallery3ImagesFor("Feel Good/100 ml")[0] ?? img("feel-good"),
    gallery: productGallery3ImagesFor("Feel Good/100 ml").length ? productGallery3ImagesFor("Feel Good/100 ml") : [img("feel-good")],
    galleryByVolume: {
      "50ml": productGallery3ImagesFor("Feel Good/50 ml").length ? productGallery3ImagesFor("Feel Good/50 ml") : [img("feel-good")],
      "100ml": productGallery3ImagesFor("Feel Good/100 ml").length ? productGallery3ImagesFor("Feel Good/100 ml") : [img("feel-good")],
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Feel Good — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-impression", slug: "impression-attar", name: "Impression Attar", tagline: "Discover this fragrance",
    price: 499, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Impression Attar")[0] ?? img("attar-impression"),
    gallery: productGallery3ImagesFor("Impression Attar").length ? productGallery3ImagesFor("Impression Attar") : [img("attar-impression")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Impression Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-choco-blast", slug: "choco-blast-attar", name: "Choco Blast Attar", tagline: "Discover this fragrance",
    price: 599, compareAt: 999, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads; original photo kept as a fallback shot.
    image: newGalleryImagesFor("Chocoblast Attar")[0] ?? img("attar-choco-blast"),
    gallery: [...newGalleryImagesFor("Chocoblast Attar"), img("attar-choco-blast")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Choco Blast Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-chemistry", slug: "chemistry", name: "Chemistry", tagline: "Discover this fragrance",
    price: 799, compareAt: 1299, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 799, compareAt: 1299 }, "20ml": { price: 249, compareAt: 699 }, "50ml": { price: 499, compareAt: 899 } },
    featuredVolume: "100ml",
    // New studio + lifestyle shoot (July 2026) verified per bottle size — replaces the old
    // single generic photo. Dark/moody lifestyle shots lead each list (site theme is dark)
    // with the white-background studio shots kept later in the gallery for detail views.
    // "chemistry-100ml-lifestyle-1" is actually the "Fragrance Notes" infographic collage
    // (misnamed by the shoot import) — it doesn't work as the hero/default photo, so
    // lifestyle-2 (the outdoor bottle shot) leads instead and the collage is kept later
    // in the gallery, still viewable but not the default.
    image: img("chemistry-100ml-lifestyle-2"),
    gallery: [img("chemistry-100ml-lifestyle-2"), img("chemistry-100ml-studio-2"), img("chemistry-100ml-studio-1"), img("chemistry-100ml-lifestyle-3"), img("chemistry-100ml-lifestyle-1")],
    galleryByVolume: {
      "20ml": [img("chemistry-20ml-lifestyle-4"), img("chemistry-20ml-lifestyle-5"), img("chemistry-20ml-lifestyle-2"), img("chemistry-20ml-lifestyle-3"), img("chemistry-20ml-studio-2"), img("chemistry-20ml-studio-1"), img("chemistry-20ml-lifestyle-1")],
      "50ml": [img("chemistry-50ml-lifestyle-1"), img("chemistry-50ml-lifestyle-2"), img("chemistry-50ml-studio-2"), img("chemistry-50ml-studio-1"), img("chemistry-50ml-lifestyle-3"), img("chemistry-50ml-lifestyle-4")],
      "100ml": [img("chemistry-100ml-lifestyle-2"), img("chemistry-100ml-studio-2"), img("chemistry-100ml-studio-1"), img("chemistry-100ml-lifestyle-3"), img("chemistry-100ml-lifestyle-1")],
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Chemistry — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-shanaya", slug: "shanaya", name: "Shanaya", tagline: "Discover this fragrance",
    price: 569, compareAt: 1699, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Shanaya")[0] ?? img("shanaya"),
    gallery: [...newGalleryImagesFor("Shanaya"), img("shanaya")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Shanaya — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-khawab", slug: "khawab", name: "Khwaab", tagline: "Discover this fragrance",
    price: 1354, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Khwaab")[0] ?? img("khawab"),
    gallery: productGallery3ImagesFor("Khwaab").length ? productGallery3ImagesFor("Khwaab") : [img("khawab")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Khwaab — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-million", slug: "million-attar", name: "Million Attar", tagline: "Discover this fragrance",
    price: 949, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads; original photo kept as a fallback shot.
    image: newGalleryImagesFor("Million Attar")[0] ?? img("attar-million"),
    gallery: [...newGalleryImagesFor("Million Attar"), img("attar-million")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Million Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-noor-jahan", slug: "noor-jahan", name: "Noor Jahan", tagline: "Discover this fragrance",
    price: 994, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Noor Jahan")[0] ?? img("noor-jahan"),
    gallery: productGallery3ImagesFor("Noor Jahan").length ? productGallery3ImagesFor("Noor Jahan") : [img("noor-jahan")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Noor Jahan — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-fitoor", slug: "fitoor", name: "Fitoor", tagline: "Discover this fragrance",
    price: 549, compareAt: 1699, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) replaces the old single generic photo.
    image: productGallery3ImagesFor("Fitoor")[0] ?? img("fitoor"),
    gallery: productGallery3ImagesFor("Fitoor").length ? productGallery3ImagesFor("Fitoor") : [img("fitoor")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Fitoor — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-poetry", slug: "poetry", name: "Poetry", tagline: "Discover this fragrance",
    price: 999, compareAt: 1299, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 999, compareAt: 1299 }, "50ml": { price: 649, compareAt: 1099 } },
    featuredVolume: "100ml",
    // A real per-size product photo now leads each list (Aug 2026 Drive export): the
    // previous lead was "poetry-hero-crop.jpg", a crop of a text-heavy Fragrance Profile
    // card made when no plain bottle shot existed for this product. These are that
    // missing shot, so the crop is no longer needed up front.
    image: productGallery3ImagesFor("Poetry/100 ml")[0] ?? img("poetry"),
    gallery: [...productGallery3ImagesFor("Poetry/100 ml"), ...galleryImagesFor("Poetry", "100 ml")],
    galleryByVolume: {
      "50ml": [...productGallery3ImagesFor("Poetry/50 ml"), ...galleryImagesFor("Poetry", "50 ml")],
      "100ml": [...productGallery3ImagesFor("Poetry/100 ml"), ...galleryImagesFor("Poetry", "100 ml")],
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Poetry — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-rebel", slug: "rebel", name: "Rebel", tagline: "Discover this fragrance",
    price: 999, compareAt: 1299, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 999, compareAt: 1299 }, "50ml": { price: 649, compareAt: 1099 } },
    featuredVolume: "100ml",
    // Same as Poetry above — a real per-size bottle shot (Aug 2026 Drive export) now leads
    // instead of "rebel-hero-crop.jpg", the Fragrance Profile card crop used as a stand-in.
    image: productGallery3ImagesFor("Rebel/100 ml")[0] ?? img("rebel"),
    gallery: [...productGallery3ImagesFor("Rebel/100 ml"), ...galleryImagesFor("Rebel", "100 ml")],
    galleryByVolume: {
      "50ml": [...productGallery3ImagesFor("Rebel/50 ml"), ...galleryImagesFor("Rebel", "50 ml")],
      "100ml": [...productGallery3ImagesFor("Rebel/100 ml"), ...galleryImagesFor("Rebel", "100 ml")],
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Rebel — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "g-royal-oud", slug: "royal-oud-duo-gift-set", name: "Royal Oud Duo", tagline: "Discover this fragrance",
    price: 499, compareAt: 1299, category: "Gift Set", gender: "Unisex", volume: ["Gift Box"],
    image: img("giftset-royal-oud-duo"),
    gallery: [img("giftset-royal-oud-duo"), ...newGalleryImagesFor("Royal Oud Attar").slice(0, 2)],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "Varies", projection: "Moderate",
    occasions: ["Gifting", "Festive"], moods: ["Confident"],
    ingredients: "Premium gift set assortment.",
    description: "Royal Oud Duo — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-smoke", slug: "smoke-attar", name: "Smoke Attar", tagline: "Discover this fragrance",
    price: 949, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads; original photo kept as a fallback shot.
    image: newGalleryImagesFor("Smoke Attar")[0] ?? img("attar-smoke"),
    gallery: [...newGalleryImagesFor("Smoke Attar"), img("attar-smoke")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Smoke Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-dargah", slug: "dargah", name: "Dargah", tagline: "Discover this fragrance",
    price: 549, compareAt: 1699, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026, filed under "Dagrah" in the source export) replaces
    // the old single generic photo.
    image: productGallery3ImagesFor("Dargah")[0] ?? img("dargah"),
    gallery: productGallery3ImagesFor("Dargah").length ? productGallery3ImagesFor("Dargah") : [img("dargah")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Dargah — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-touch", slug: "touch-attar", name: "Touch Attar", tagline: "Discover this fragrance",
    price: 949, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    // New studio photography (Aug 2026) leads. The old pre-photoshoot fallback shot
    // used to be appended as a 6th gallery image — dropped per Jatin, since the 5 new
    // studio photos fully replace it and it read as a redundant, lower-quality repeat.
    image: newGalleryImagesFor("Touch Attar")[0] ?? img("attar-touch"),
    gallery: newGalleryImagesFor("Touch Attar").length ? newGalleryImagesFor("Touch Attar") : [img("attar-touch")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Touch Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-white-oud", slug: "white-oud-attar", name: "White Oud Attar", tagline: "Discover this fragrance",
    price: 949, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("White Oud Attar")[0] ?? img("white-oud"),
    gallery: [...newGalleryImagesFor("White Oud Attar"), img("white-oud")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "White Oud Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-wild", slug: "wild-attar", name: "Wild Attar", tagline: "Discover this fragrance",
    price: 949, compareAt: 1499, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Wild Attar")[0] ?? img("attar-wild"),
    gallery: [...newGalleryImagesFor("Wild Attar"), img("attar-wild")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Wild Attar — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-wanted", slug: "wanted", name: "Wanted", tagline: "Discover this fragrance",
    price: 899, compareAt: 1499, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL,
    priceByVolume: { "100ml": { price: 899, compareAt: 1499 }, "50ml": { price: 649, compareAt: 1099 } },
    featuredVolume: "100ml",
    // Same as Poetry/Rebel — a real per-size bottle shot (Aug 2026 Drive export) now leads
    // instead of "wanted-hero-crop.jpg", the Fragrance Profile card crop used as a stand-in.
    image: productGallery3ImagesFor("Wanted/100 ml")[0] ?? img("wanted"),
    gallery: [...productGallery3ImagesFor("Wanted/100 ml"), ...galleryImagesFor("Wanted", "100 ml")],
    galleryByVolume: {
      "50ml": [...productGallery3ImagesFor("Wanted/50 ml"), ...galleryImagesFor("Wanted", "50 ml")],
      "100ml": [...productGallery3ImagesFor("Wanted/100 ml"), ...galleryImagesFor("Wanted", "100 ml")],
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Wanted — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "a-zannat", slug: "zannat", name: "Zannat", tagline: "Discover this fragrance",
    price: 999, compareAt: 1299, category: "Attar", gender: "Unisex", volume: ATTAR_VOL,
    image: newGalleryImagesFor("Zannat")[0] ?? img("zannat"),
    gallery: [...newGalleryImagesFor("Zannat"), img("zannat")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Intimate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "100% alcohol-free premium attar oil.",
    description: "Zannat — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  // ─────────────── FOUND IN AUG 2026 PHOTO EXPORT, NOT YET IN ANY PRICE SHEET ───────────────
  // Flora and Oud Forest are real, fully-branded Itra Wala bottles (studio photography
  // confirms the labels/sizes) that don't appear in any price sheet or prior catalog entry.
  // Added as draft listings with placeholder pricing mirrored from comparable existing
  // perfumes (Chemistry) — flag to Jatin to confirm real price/MRP and notes before promoting
  // out of "newArrival"/draft status.
  {
    id: "p-flora", slug: "flora", name: "Flora", tagline: "Discover this fragrance",
    price: 799, compareAt: 1299, category: "Perfume", gender: "Unisex", volume: PERFUME_VOL_20,
    priceByVolume: { "100ml": { price: 799, compareAt: 1299 }, "20ml": { price: 249, compareAt: 699 }, "50ml": { price: 499, compareAt: 899 } },
    featuredVolume: "100ml",
    image: productGallery3ImagesFor("Flora/100 ml")[0] ?? PLACEHOLDER_IMG,
    gallery: productGallery3ImagesFor("Flora/100 ml"),
    galleryByVolume: {
      "20ml": productGallery3ImagesFor("Flora/20 ml"),
      "50ml": productGallery3ImagesFor("Flora/50 ml"),
      "100ml": productGallery3ImagesFor("Flora/100 ml"),
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "8 hours", projection: "Moderate",
    occasions: ["Daily Wear", "Special Occasions"], moods: ["Confident"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Flora — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },
  {
    id: "p-oud-forest", slug: "oud-forest", name: "Oud Forest", tagline: "Discover this fragrance",
    price: 799, compareAt: 1299, category: "Perfume", gender: "Unisex", volume: ["20ml", "100ml"],
    priceByVolume: { "100ml": { price: 799, compareAt: 1299 }, "20ml": { price: 249, compareAt: 699 } },
    featuredVolume: "100ml",
    image: productGallery3ImagesFor("Oud Forest/100 ml")[0] ?? PLACEHOLDER_IMG,
    gallery: productGallery3ImagesFor("Oud Forest/100 ml"),
    galleryByVolume: {
      "20ml": productGallery3ImagesFor("Oud Forest/20 ml"),
      "100ml": productGallery3ImagesFor("Oud Forest/100 ml"),
    },
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "10+ hours", projection: "Strong",
    occasions: ["Evening", "Special Occasions"], moods: ["Bold"],
    ingredients: "Premium fragrance oils, French-grade alcohol base.",
    description: "Oud Forest — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  },

];

export const getProduct = (slug: string) => products.find(p => p.slug === slug);
export const amazonChoiceProducts = products.filter(p => p.amazonChoice);
export const volumesFor = (p: Product) => p.volume && p.volume.length ? p.volume : defaultVolumes;

/** Size used on shop/listing cards and as the product-page default. Prefer the
 *  volume that matches the bottle photo (`featuredVolume` or a galleryByVolume
 *  entry), falling back to the first sellable size. */
export const listingVolume = (p: Product) => {
  if (p.featuredVolume && volumesFor(p).includes(p.featuredVolume)) return p.featuredVolume;
  const vols = volumesFor(p);
  const withPhoto = vols.find(v => p.galleryByVolume?.[v]?.[0]);
  return withPhoto ?? vols[0];
};

export const galleryFor = (p: Product, volume?: string) =>
  p.galleryByVolume?.[volume ?? ""] ?? p.gallery;

export const imageFor = (p: Product, volume?: string) =>
  galleryFor(p, volume)?.[0] ?? p.image;

/** Descriptive alt text for a product image, category-aware ("Attar" for Attar
 *  products, "Perfume" for everything else — Perfume, Gift Set, Collector's Edition). */
export const imageAltFor = (p: Product) =>
  `${p.name} Premium ${p.category === "Attar" ? "Attar" : "Perfume"} - Itrawala`;

/** Resolves { price, compareAt } for a given size. Falls back to the product's flat
 *  price/compareAt when that size has no dedicated entry in priceByVolume. */
export const priceFor = (p: Product, volume?: string): { price: number; compareAt?: number } => {
  const base = (volume && p.priceByVolume?.[volume]) ? p.priceByVolume[volume] : { price: p.price, compareAt: p.compareAt };
  // Independence Day Freedom Sale — flat 25% off every product's original base price
  // (compareAt — the pre-existing "MRP" struck-through price), not off the already
  // marked-down `price`, so today's discount doesn't stack on top of a standing sale.
  // Falls back to `price` when a product has no compareAt to begin with. See
  // src/lib/independenceDaySale.ts.
  if (isIndependenceDaySaleActive()) {
    const original = base.compareAt ?? base.price;
    return { price: independenceDayPrice(original), compareAt: original };
  }
  return base;
};

/** Resolves { tagline, description, ingredients } for a given variant, falling back to
 *  the product's flat fields when that variant has no dedicated entry in contentByVolume. */
export const contentFor = (p: Product, volume?: string) => {
  const override = volume ? p.contentByVolume?.[volume] : undefined;
  return {
    tagline: override?.tagline ?? p.tagline,
    description: override?.description ?? p.description,
    ingredients: override?.ingredients ?? p.ingredients,
  };
};
