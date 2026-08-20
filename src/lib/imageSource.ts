/**
 * Resolves a stored image reference to a URL the browser can load.
 *
 * Two hosting sources coexist by design:
 *
 *   'repo'       The 851 photos already committed under src/assets/. Vite rewrites
 *                these at build time into /assets/<name>-<contenthash>.jpg, so the
 *                final URL is build-specific and can never be stored in the database.
 *                What IS stable is the path below src/assets/, which the glob map
 *                below turns back into the built URL at runtime.
 *
 *   'cloudinary' Anything uploaded through the admin dashboard. Absolute URL, used
 *                as-is.
 *
 * Keeping both means the existing photography needs no migration and keeps being
 * served free from Vercel's CDN, while new uploads work instantly. Adding a third
 * host later means one more case here — callers never learn where an image lives.
 */

// Eager glob over the product-photo directories only. This is what pulls the images
// into the build, so the pattern doubles as the "which assets ship" decision —
// widening it to ../assets/** would also bundle brand art, hero stills and the
// collector-story panels that are already imported directly where they're used.
const repoModules = import.meta.glob(
  [
    "../assets/products/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
    "../assets/Product Gallery/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
    "../assets/new Product Gallery/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
    "../assets/product-gallery-2/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
    "../assets/product-gallery-3/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
    "../assets/Pack of 4 and 8/**/*.{png,jpg,jpeg,PNG,JPG,JPEG}",
  ],
  { eager: true, import: "default" }
) as Record<string, string>;

/** 1x1 transparent PNG. Shown when a key no longer resolves, so one renamed file
 *  degrades to a blank tile instead of a broken-image icon or a thrown render. */
export const PLACEHOLDER_IMG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export type ImageSource = "repo" | "cloudinary";

export type ImageRef = {
  source: ImageSource;
  /** source='repo': path below src/assets/, e.g. "product-gallery-3/Maati/321.jpg" */
  storageKey?: string | null;
  /** source='cloudinary': absolute URL */
  url?: string | null;
  alt?: string | null;
};

/** Every repo image key that resolves today — the admin's picker lists these, so it
 *  can only ever offer images that actually shipped in this build. */
export const repoImageKeys: string[] = Object.keys(repoModules)
  .map((k) => k.replace("../assets/", ""))
  .sort((a, b) => a.localeCompare(b));

/** Built URL for a repo-hosted image, or undefined when the key no longer resolves. */
export function resolveRepoImage(storageKey: string): string | undefined {
  return repoModules[`../assets/${storageKey}`];
}

/**
 * URL for any stored image reference. Never throws and never returns empty: a bad
 * reference yields the placeholder, because these run inside render and a missing
 * photo must not be able to blank the page.
 */
export function resolveImage(ref: ImageRef | null | undefined): string {
  if (!ref) return PLACEHOLDER_IMG;

  if (ref.source === "cloudinary") {
    return ref.url || PLACEHOLDER_IMG;
  }

  if (!ref.storageKey) return PLACEHOLDER_IMG;
  const hit = resolveRepoImage(ref.storageKey);
  if (!hit) {
    // Loud in dev, silent-ish in prod — a renamed asset should be obvious while
    // working but must never spam a customer's console.
    if (import.meta.env.DEV) {
      console.warn(`[imageSource] Unresolved repo image: ${ref.storageKey}`);
    }
    return PLACEHOLDER_IMG;
  }
  return hit;
}

/**
 * Cloudinary delivery options, applied by rewriting the URL's transformation
 * segment. Cloudinary serves WebP/AVIF automatically via f_auto and picks a
 * quality via q_auto, which is most of why uploads are worth routing through it
 * rather than committing them.
 *
 * A no-op for repo images: those are pre-compressed at import time and served
 * straight off the CDN.
 */
export function resolveImageSized(
  ref: ImageRef | null | undefined,
  width?: number
): string {
  const url = resolveImage(ref);
  if (!ref || ref.source !== "cloudinary" || !url.includes("/upload/")) return url;

  const transform = ["f_auto", "q_auto", width ? `w_${width}` : "", "c_limit"]
    .filter(Boolean)
    .join(",");
  return url.replace("/upload/", `/upload/${transform}/`);
}
