/**
 * Runtime catalogue — the database-backed replacement for the hardcoded arrays in
 * src/data/products.ts.
 *
 * HOW THIS FITS TOGETHER
 *   src/data/products.ts  is now the SNAPSHOT: it still ships in the bundle, still
 *                         exports the same Product type and pure helpers, and is what
 *                         renders on first paint.
 *   this file             fetches the live catalogue from Supabase and maps rows back
 *                         into that identical Product shape.
 *   useCatalog()          hands components whichever is freshest (see catalog.tsx).
 *
 * Why keep the snapshot at all, rather than fetching everything:
 *   • First paint has no network round trip — this site's traffic arrives from paid
 *     social straight onto product pages, where a fetch waterfall costs conversions.
 *   • A Supabase outage degrades to yesterday's catalogue instead of an empty shop.
 *   • Search engines and link unfurlers see real content without executing a fetch.
 *
 * The mapping below is the contract between the two. Anything added to the Product
 * type needs a column in admin-schema.sql and a line in rowToProduct(), or it will
 * silently vanish the moment live data replaces the snapshot.
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Product } from "@/data/products";
import { resolveImage, type ImageRef, PLACEHOLDER_IMG } from "@/lib/imageSource";

/** products.video_url set to this means "this product has no video", as opposed to an
 *  empty column, which means "nothing chosen — use the clip bundled for this product if
 *  the site ships one". Without the distinction there is no way to switch a bundled clip
 *  off from the admin. */
export const VIDEO_HIDDEN = "none";

export type Collection = {
  key: string;
  title: string;
  blurb: string;
  sub: string[];
  image?: string;
};

export type Banner = {
  id: string;
  image: string;
  mobileImage?: string;
  /** How the mobile artwork fills the 9:16 frame. See admin-schema.sql. */
  mobileFit: "cover" | "contain";
  eyebrow?: string;
  headline?: string;
  highlight?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type Catalog = {
  products: Product[];
  collections: Collection[];
  banners: Banner[];
  announcements: string[];
  newLaunchSlugs: string[];
  settings: Record<string, unknown>;
  /** Where this data came from — surfaced in the admin so "my edit isn't showing"
   *  can be diagnosed without guessing. */
  origin: "database" | "snapshot";
};

/* ── row shapes ────────────────────────────────────────────────────────────── */

type ImageRow = {
  product_id: string;
  volume: string | null;
  source: "repo" | "cloudinary";
  storage_key: string | null;
  url: string | null;
  alt: string | null;
  position: number;
};

type ProductRow = Record<string, any>;

const asRef = (r: { source: "repo" | "cloudinary"; storage_key: string | null; url: string | null; alt?: string | null }): ImageRef => ({
  source: r.source,
  storageKey: r.storage_key,
  url: r.url,
  alt: r.alt ?? null,
});

/** Drops null/undefined so an absent column stays *absent* rather than becoming an
 *  explicit undefined — several helpers branch on `in` / truthiness, and an own
 *  property set to undefined behaves differently from a missing one. */
const compact = <T extends Record<string, any>>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as T;

/**
 * One database row (plus its images) back into the Product shape the storefront
 * already renders. Keeping the shape identical is what lets every existing
 * component, helper and offer rule keep working untouched.
 */
export function rowToProduct(row: ProductRow, images: ImageRow[]): Product {
  const mine = images
    .filter((i) => i.product_id === row.id)
    .sort((a, b) => a.position - b.position);

  const general = mine.filter((i) => !i.volume);
  const byVolume: Record<string, string[]> = {};
  for (const img of mine) {
    if (!img.volume) continue;
    (byVolume[img.volume] ??= []).push(resolveImage(asRef(img)));
  }

  // Fall back to the first per-size photo when a product has only size-scoped
  // images, so the shop card is never a blank tile.
  const gallery = general.length
    ? general.map((i) => resolveImage(asRef(i)))
    : Object.values(byVolume)[0] ?? [];

  return compact({
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    ingredients: row.ingredients ?? "",
    category: row.category,
    gender: row.gender ?? "Unisex",

    price: Number(row.price),
    compareAt: row.compare_at != null ? Number(row.compare_at) : undefined,
    priceByVolume: row.price_by_volume ?? undefined,

    image: gallery[0] ?? PLACEHOLDER_IMG,
    gallery,
    galleryByVolume: Object.keys(byVolume).length ? byVolume : undefined,

    volume: row.volumes?.length ? row.volumes : undefined,
    featuredVolume: row.featured_volume ?? undefined,
    variantLabel: row.variant_label ?? undefined,
    contentByVolume: row.content_by_volume ?? undefined,

    notes: row.notes ?? { top: [], heart: [], base: [] },
    longevity: row.longevity ?? "",
    projection: row.projection ?? "",
    occasions: row.occasions ?? [],
    moods: row.moods ?? [],

    rating: Number(row.rating ?? 4.5),
    reviews: Number(row.reviews_count ?? 0),

    badge: row.badge ?? undefined,
    bestSeller: row.best_seller || undefined,
    newArrival: row.new_arrival || undefined,
    trending: row.trending || undefined,
    amazonChoice: row.amazon_choice || undefined,
    amazonUrl: row.amazon_url ?? undefined,
    videoUrl: row.video_url ?? undefined,
    // What the gallery actually renders. An admin-set clip wins; anything else leaves
    // this empty so the bundled fallback in src/store/catalog.tsx can fill it in.
    video: row.video_url && row.video_url !== VIDEO_HIDDEN ? String(row.video_url) : undefined,

    specs: row.specs ?? undefined,
    highlights: row.highlights ?? undefined,
  }) as Product;
}

/* ── fetch ─────────────────────────────────────────────────────────────────── */

/**
 * Pulls the whole catalogue in five parallel queries.
 *
 * Returns null — rather than throwing or returning a half-built catalogue — when
 * Supabase isn't configured or any query fails. The caller keeps the snapshot in
 * that case, which is the entire point of having one.
 */
export async function fetchCatalog(): Promise<Catalog | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const [productsRes, imagesRes, collectionsRes, bannersRes, announcementsRes, settingsRes] =
      await Promise.all([
        supabase.from("products").select("*").eq("archived", false).order("position"),
        supabase.from("product_images").select("*").order("position"),
        supabase.from("collections").select("*").eq("active", true).order("position"),
        supabase.from("banners").select("*").eq("active", true).order("position"),
        supabase.from("announcements").select("*").eq("active", true).order("position"),
        supabase.from("site_settings").select("*"),
      ]);

    const firstError =
      productsRes.error || imagesRes.error || collectionsRes.error ||
      bannersRes.error || announcementsRes.error || settingsRes.error;

    // An empty products table means the seed hasn't been run yet. Treat that as
    // "no live catalogue" and keep the snapshot, rather than blanking the store.
    if (firstError || !productsRes.data?.length) {
      if (firstError) console.warn("[catalog] falling back to snapshot:", firstError.message);
      return null;
    }

    const images = (imagesRes.data ?? []) as ImageRow[];
    const products = productsRes.data.map((row) => rowToProduct(row, images));

    const settings: Record<string, unknown> = {};
    for (const s of settingsRes.data ?? []) settings[s.key] = s.value;

    return {
      products,
      collections: (collectionsRes.data ?? []).map((c) => ({
        key: c.key,
        title: c.title,
        blurb: c.blurb ?? "",
        sub: c.sub ?? [],
        image: c.storage_key || c.url ? resolveImage(asRef(c)) : undefined,
      })),
      banners: (bannersRes.data ?? []).map((b) => ({
        id: b.id,
        image: resolveImage(asRef(b)),
        mobileImage: b.mobile_source
          ? resolveImage({ source: b.mobile_source, storageKey: b.mobile_storage_key, url: b.mobile_url })
          : undefined,
        mobileFit: b.mobile_fit === "contain" ? "contain" : "cover",
        eyebrow: b.eyebrow ?? undefined,
        headline: b.headline ?? undefined,
        highlight: b.highlight ?? undefined,
        subtext: b.subtext ?? undefined,
        ctaLabel: b.cta_label ?? undefined,
        ctaHref: b.cta_href ?? undefined,
      })),
      announcements: (announcementsRes.data ?? []).map((a) => a.text),
      newLaunchSlugs: Array.isArray(settings.new_launch_slugs)
        ? (settings.new_launch_slugs as string[])
        : [],
      settings,
      origin: "database",
    };
  } catch (err) {
    console.warn("[catalog] unexpected error, using snapshot:", err);
    return null;
  }
}
