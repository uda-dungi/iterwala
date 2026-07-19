/**
 * Itrawala — single source of truth for business details & integrations.
 *
 * To take an integration LIVE, just replace the placeholder value below (or set the
 * matching VITE_ env var). Every feature is already wired — it activates the moment a
 * real value is present, the same pattern as src/lib/supabase.ts.
 */

const env = import.meta.env;

/** True when a config value has been filled in (not blank / not a placeholder). */
export const isSet = (v?: string) =>
  Boolean(v && v.trim() && !v.trim().toLowerCase().startsWith("placeholder"));

const stripHandle = (value?: string) =>
  value ? value.trim().replace(/^@+/, "") : "";

const adminEmails = ((env.VITE_ADMIN_EMAILS as string) || "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

/** Matches server-side admin check in api/_lib/supabaseAdmin.ts */
export const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const value = email.trim().toLowerCase();
  if (adminEmails.includes(value)) return true;
  return value.endsWith("@itrawala.in");
};

export const site = {
  brand: "Itrawala",
  tagline: "Crafted Fragrances, Timeless Impressions",

  // ── Business / legal (shown in footer, policies, trust sections) ──
  // Defaults below match the registered business (itrawala.in) — override via env if it ever changes.
  gst: (env.VITE_GST as string) || "A08ALPPM3755J",
  address:
    (env.VITE_BUSINESS_ADDRESS as string) ||
    "Near Agarwal Jain Mandir, 08, Main Market, Sadar Bazar, Deoli, Tonk, Rajasthan, 304804",
  email: (env.VITE_SUPPORT_EMAIL as string) || "itrawalabrand@gmail.com",
  phone: (env.VITE_SUPPORT_PHONE as string) || "+91 70146 57175",
  hours: "Mon–Sat · 10am–7pm IST",

  // ── Integrations (drop a real value here to activate) ──
  /** Digits only, country code first, no "+" or spaces — e.g. "919876543210". */
  whatsappNumber: (env.VITE_WHATSAPP_NUMBER as string) || "917014657175",
  amazonStoreUrl: (env.VITE_AMAZON_STORE_URL as string) || "PLACEHOLDER_AMAZON_STORE_URL",
  instagramHandle: stripHandle(env.VITE_INSTAGRAM_HANDLE as string) || "itrawalaa",
  facebookHandle: stripHandle(env.VITE_FACEBOOK_HANDLE as string) || "theitrawala",
  adminEmails,
  /** Public Instagram reel/post permalinks for the home Reels strip. */
  instagramReels: [] as string[],
  /** Background hero video (mp4). Leave blank to use the still hero image. */
  heroVideoUrl: (env.VITE_HERO_VIDEO_URL as string) || "",
  /** PayU merchant key (public half — the salt stays server-side only). When set, checkout is live. */
  payuMerchantKey: (env.VITE_PAYU_MERCHANT_KEY as string) || "",

  // ── Commerce rules ──
  freeShippingThreshold: 499,
  currency: "₹",
  /** Prepaid-only storefront — Cash on Delivery is intentionally not offered. */
  codAvailable: false,
};

/** Pre-built wa.me link with an optional pre-filled message. */
export const whatsappLink = (message?: string) =>
  `https://wa.me/${site.whatsappNumber}${message ? `?text=${encodeURIComponent(message)}` : ""}`;

export const instagramLink = `https://instagram.com/${site.instagramHandle}`;
export const facebookLink = `https://www.facebook.com/${site.facebookHandle}`;

/** Auto-sliding announcement-bar statements. */
export const announcements = [
  "Free Shipping",
  "Amazon's Choice Products Available",
  "100% Money-Back Guarantee",
  "WhatsApp Support — We reply fast",
];
