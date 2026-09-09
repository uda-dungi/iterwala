/**
 * The built-in hero slides, expressed as database rows.
 *
 * The homepage carousel treats live banners as a REPLACEMENT, not an addition: one row
 * in the `banners` table and the compiled slides stop rendering entirely. That is the
 * right behaviour — an admin managing the carousel should own all of it — but it made
 * the Hero Banners tab a trap. Adding a single banner silently removed the other three,
 * so the safe move was to never touch the tab, which is exactly what happened.
 *
 * This list is what the "Import built-in banners" button writes, so the table starts as
 * a copy of what the site already shows. From there, editing and reordering do what an
 * admin expects, because there is no longer a hidden set to lose.
 *
 * Images are storage keys (paths below src/assets/), never imported URLs — Vite
 * content-hashes those at build time, so a stored URL would break on the next deploy.
 * Every key here must stay inside the repo glob in src/lib/imageSource.ts.
 *
 * Keep in sync with fallbackSlides / fallbackMobileSlides in
 * src/components/home/HeroCarousel.tsx.
 */
export type DefaultBanner = {
  storage_key: string;
  mobile_storage_key: string;
  /** Mobile artwork that is not 9:16 gets letterboxed rather than cropped ~30% away. */
  mobile_fit: "cover" | "contain";
  eyebrow: string;
  headline: string;
  highlight: string;
  subtext: string;
  cta_label: string;
  cta_href: string;
};

export const DEFAULT_BANNERS: DefaultBanner[] = [
  {
    storage_key: "brand/banner-collectors-pc.jpg",
    mobile_storage_key: "brand/banner-collectors-mobile.jpg",
    mobile_fit: "cover",
    eyebrow: "Where Every Bottle Tells a Story",
    headline: "Collector's Edition",
    highlight: "Buy 2 Get 1 Free",
    subtext: "Shabd, Kahani and Ehsaas — our 100ml Extrait de Parfum trilogy. Mix and match any three you love.",
    cta_label: "Shop Trilogy",
    cta_href: "/product/shabd",
  },
  {
    storage_key: "brand/banner-giftset-pc.jpg",
    mobile_storage_key: "brand/banner-giftset-mobile.jpg",
    mobile_fit: "cover",
    eyebrow: "A Fragrance For Every Mood",
    headline: "Perfume Gift Sets",
    highlight: "Buy 1 Get 1 Free",
    subtext: "Pack of 4 or Pack of 8, boxed and ready to give — add two and pay just ₹999 for both.",
    cta_label: "Shop Gift Sets",
    cta_href: "/shop?category=Gift Set",
  },
  {
    storage_key: "brand/banner-1.jpg",
    mobile_storage_key: "brand/mobile-banner-celebrity-full.jpg",
    mobile_fit: "contain",
    eyebrow: "Red-Carpet Ready",
    headline: "Celebrity",
    highlight: "Eau de Parfum",
    subtext: "Made to be noticed — a luminous, spicy-sweet signature of bergamot, jasmine and amber that leaves a trail of compliments wherever you go.",
    cta_label: "Shop Celebrity",
    cta_href: "/product/celebrity",
  },
  {
    storage_key: "brand/banner-2.jpg",
    mobile_storage_key: "brand/mobile-banner-attar-full.jpg",
    mobile_fit: "contain",
    eyebrow: "The Full Line",
    headline: "The Attar",
    highlight: "Collection",
    subtext: "Firdaus, Tulsi, Ruh-Kewra, Mogra Gold, Inayat and more — pure, alcohol-free attars hand-distilled in Kannauj for a scent that lasts all day.",
    cta_label: "Shop the Attar Collection",
    cta_href: "/shop?category=Attar",
  },
];
