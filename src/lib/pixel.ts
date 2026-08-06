/**
 * Meta (Facebook) Pixel — ecommerce event tracking.
 *
 * Activates only when VITE_META_PIXEL_ID is set (same "drop a value to go live"
 * pattern as Supabase/PayU/Resend elsewhere in this codebase). With no ID every
 * function here is a silent no-op, so local dev and previews never pollute your
 * real Meta data and nothing breaks if the env var is missing.
 *
 * ⚠️ The Content-Security-Policy in vercel.json MUST allow Facebook, or the browser
 * blocks the pixel script and every event silently fails (console error only, no
 * visible breakage). The required entries are already in vercel.json:
 *   script-src  … https://connect.facebook.net
 *   connect-src … https://www.facebook.com https://connect.facebook.net
 *   img-src     … https:  (covers the tracking-pixel image fallback)
 */

import { site, isSet } from "@/config/site";

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { callMethod?: (...args: any[]) => void; queue?: any[]; loaded?: boolean; version?: string; push?: any };
    _fbq?: unknown;
  }
}

const CURRENCY = "INR";

export const isPixelConfigured = () => isSet(site.metaPixelId);

/** Loads the Meta base script once and fires the initial PageView. */
export function initPixel() {
  if (typeof window === "undefined" || !isPixelConfigured() || window.fbq) return;

  /* eslint-disable */
  // Meta's official base snippet, transcribed. It defines the fbq() queue immediately
  // so events fired before the remote script finishes loading are buffered, not lost.
  (function (f: any, b: Document, e: string, v: string) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */

  window.fbq?.("init", site.metaPixelId);
  window.fbq?.("track", "PageView");
}

/** Fire a standard Meta event. `eventID` lets the server-side Conversions API
 *  de-duplicate the same conversion if you add CAPI later. */
function track(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (!isPixelConfigured() || typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventID ? { eventID } : undefined);
}

/** SPA route change — Meta only auto-fires PageView on first load, so every
 *  client-side navigation needs this or you undercount traffic massively. */
export const trackPageView = () => track("PageView");

export const trackViewContent = (p: { id: string; name: string; category: string; price: number }) =>
  track("ViewContent", {
    content_ids: [p.id],
    content_name: p.name,
    content_category: p.category,
    content_type: "product",
    value: p.price,
    currency: CURRENCY,
  });

export const trackAddToCart = (p: { id: string; name: string; category: string; price: number; qty: number }) =>
  track("AddToCart", {
    content_ids: [p.id],
    content_name: p.name,
    content_category: p.category,
    content_type: "product",
    contents: [{ id: p.id, quantity: p.qty, item_price: p.price }],
    value: p.price * p.qty,
    currency: CURRENCY,
  });

export const trackInitiateCheckout = (o: {
  items: { id: string; qty: number; price: number }[];
  value: number;
}) =>
  track("InitiateCheckout", {
    content_ids: o.items.map((i) => i.id),
    contents: o.items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
    content_type: "product",
    num_items: o.items.reduce((s, i) => s + i.qty, 0),
    value: o.value,
    currency: CURRENCY,
  });

/**
 * Purchase — the money event. Guarded so a page refresh or a back-navigation to
 * /order/success can't report the same sale twice and inflate your ROAS.
 * `txnid` doubles as the Meta eventID, which is exactly what CAPI de-dup expects.
 */
const PURCHASE_LOG_KEY = "itr_fired_purchases";

export function trackPurchase(o: {
  txnid: string;
  items: { id: string; qty: number; price: number }[];
  value: number;
}) {
  if (!isPixelConfigured() || !o.txnid) return;

  let fired: string[] = [];
  try {
    fired = JSON.parse(localStorage.getItem(PURCHASE_LOG_KEY) || "[]");
  } catch {
    fired = [];
  }
  if (fired.includes(o.txnid)) return;

  track(
    "Purchase",
    {
      content_ids: o.items.map((i) => i.id),
      contents: o.items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
      content_type: "product",
      num_items: o.items.reduce((s, i) => s + i.qty, 0),
      value: o.value,
      currency: CURRENCY,
    },
    o.txnid
  );

  try {
    // Keep the log small — the last 50 orders is plenty to stop repeat fires.
    localStorage.setItem(PURCHASE_LOG_KEY, JSON.stringify([...fired, o.txnid].slice(-50)));
  } catch {
    /* storage full or blocked — the event already fired, which is what matters */
  }
}
