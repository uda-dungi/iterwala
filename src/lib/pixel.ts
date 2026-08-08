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
 *
 * Conversions API (server-side backup): PageView, AddToCart and InitiateCheckout are
 * also relayed to our own /api/track/event, which forwards them to Meta's Conversions
 * API from the server (api/_lib/metaCapi.ts) — see sendServerEvent() below. That call
 * carries the same event ID as the Pixel fire, so Meta de-dupes the two into one
 * conversion; the CAPI copy is what survives ad blockers and Safari/iOS tracking
 * prevention, which only ever block the direct call to connect.facebook.net. Purchase
 * is intentionally NOT relayed from here — see trackPurchase() below.
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

/* ─────────────── Match-quality signals (fbc / fbp / external_id / identity) ───────────────
 *
 * Event Match Quality is Meta's score for how well it can tie a server event to a real
 * person. It only counts the identifiers actually present on the event, so the job here
 * is making sure fbc/fbp/external_id/em/ph are populated *before* an event is sent.
 *
 * Two things used to leave PageView with almost nothing to match on:
 *
 *  1. fbevents.js is loaded async, and it's what writes the _fbp/_fbc cookies. The first
 *     PageView was relayed to CAPI synchronously right after injecting that script, so on
 *     a first visit the cookies did not exist yet and the server read nothing. PageView is
 *     mostly first-visits, which is why it scored far below the other events.
 *  2. _fbc only ever exists if fbevents.js ran. Ad blockers and iOS tracking prevention
 *     block it — exactly the traffic CAPI is supposed to recover — so the click ID, the
 *     single strongest attribution signal, was lost on those visits.
 *
 * Both are fixed by writing the cookies ourselves, in Meta's documented first-party
 * format, before anything fires. Meta's own script honours a pre-existing _fbp/_fbc, so
 * this cooperates with the Pixel rather than fighting it.
 */

const FBC_COOKIE = "_fbc";
const FBP_COOKIE = "_fbp";
const EXTERNAL_ID_KEY = "itr_ext_id";
const IDENTITY_KEY = "itr_identity";
/** Meta attributes clicks for 90 days — match the cookie lifetime to that window. */
const COOKIE_DAYS = 90;

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return undefined;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/** Writes _fbc/_fbp in Meta's documented format when they're missing, so every event —
 *  including the very first PageView, and visits where fbevents.js is blocked — carries
 *  them. Formats: _fbc = `fb.1.<ms>.<fbclid>`, _fbp = `fb.1.<ms>.<random>`. */
function ensureFbCookies() {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (fbclid) {
      // A fresh click must win over a stale one, so only keep the existing cookie when
      // it already carries this same fbclid (otherwise re-visits keep the old attribution).
      const current = readCookie(FBC_COOKIE);
      if (!current || !current.endsWith(`.${fbclid}`)) writeCookie(FBC_COOKIE, `fb.1.${Date.now()}.${fbclid}`);
    }
    if (!readCookie(FBP_COOKIE)) {
      writeCookie(FBP_COOKIE, `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`);
    }
  } catch {
    /* cookies disabled — events still send, just with fewer match signals */
  }
}

/** Stable per-browser id. Meta counts external_id as a match parameter, and it also ties
 *  a visitor's events together across sessions even when they never log in. */
function getExternalId(): string | undefined {
  try {
    let id = localStorage.getItem(EXTERNAL_ID_KEY);
    if (!id) {
      id = genEventId();
      localStorage.setItem(EXTERNAL_ID_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** The match signals this browser can supply, for callers that POST to our own API and
 *  need to persist them (checkout stores these on the order so the Purchase event, which
 *  is sent from PayU's server-to-server callback, can still report the real shopper). */
export function getPixelSignals(): { fbp?: string; fbc?: string; externalId?: string } {
  if (typeof window === "undefined") return {};
  ensureFbCookies();
  return { fbp: readCookie(FBP_COOKIE), fbc: readCookie(FBC_COOKIE), externalId: getExternalId() };
}

type Identity = { email?: string; phone?: string };

/** Remembers who this visitor is so later events (PageView, AddToCart, …) can carry
 *  hashed em/ph — by far the heaviest-weighted match signals. Called from checkout when
 *  the form is submitted and on sign-in. The values are hashed server-side before they
 *  ever reach Meta (api/_lib/metaCapi.ts); nothing identifying is sent to Meta in clear. */
export function setPixelIdentity(identity: Identity) {
  try {
    const merged = { ...getIdentity(), ...identity };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(merged));
  } catch {
    /* storage blocked — events simply go without em/ph */
  }
}

function getIdentity(): Identity {
  try {
    return JSON.parse(localStorage.getItem(IDENTITY_KEY) || "{}");
  } catch {
    return {};
  }
}

/** Loads the Meta base script once and fires the initial PageView. */
export function initPixel() {
  if (typeof window === "undefined" || !isPixelConfigured() || window.fbq) return;

  // Before anything fires — the first PageView below depends on these existing.
  ensureFbCookies();

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
  const eventID = genEventId();
  window.fbq?.("track", "PageView", {}, { eventID });
  sendServerEvent("PageView", eventID);
}

/** Fire a standard Meta event. `eventID` lets the server-side Conversions API
 *  de-duplicate the same conversion. */
function track(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (!isPixelConfigured() || typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventID ? { eventID } : undefined);
}

const genEventId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** POSTs the same event to our own backend (api/track/event.ts), which forwards it to
 *  Meta's Conversions API from the server. Uses sendBeacon when available so the call
 *  survives the page unloading right after (a route change, a redirect to PayU) — a
 *  plain fetch can get cancelled mid-flight when the page it belongs to goes away. */
function sendServerEvent(eventName: string, eventId: string, customData?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    // A late-arriving fbclid (or a cookie cleared mid-session) should still be picked up,
    // so re-check rather than relying on what existed at init.
    ensureFbCookies();
    const identity = getIdentity();
    const body = JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      customData,
      // Sent explicitly rather than left to the request's Cookie header: sendBeacon fires
      // during unload, and these are the values this page actually saw.
      fbc: readCookie(FBC_COOKIE),
      fbp: readCookie(FBP_COOKIE),
      externalId: getExternalId(),
      email: identity.email,
      phone: identity.phone,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track/event", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track/event", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* best-effort only — a tracking hiccup must never break the page */
  }
}

/** Fires the browser Pixel event and relays the same event to Conversions API via our
 *  backend, both tagged with the same eventID so Meta treats them as one conversion. */
function trackAndRelay(event: string, params: Record<string, unknown> | undefined, eventID: string) {
  if (!isPixelConfigured()) return;
  track(event, params, eventID);
  sendServerEvent(event, eventID, params);
}

/** SPA route change — Meta only auto-fires PageView on first load, so every
 *  client-side navigation needs this or you undercount traffic massively. */
export const trackPageView = () => trackAndRelay("PageView", undefined, genEventId());

export const trackViewContent = (p: { id: string; name: string; category: string; price: number }) =>
  trackAndRelay(
    "ViewContent",
    {
      content_ids: [p.id],
      content_name: p.name,
      content_category: p.category,
      content_type: "product",
      value: p.price,
      currency: CURRENCY,
    },
    genEventId()
  );

export const trackAddToCart = (p: { id: string; name: string; category: string; price: number; qty: number }) =>
  trackAndRelay(
    "AddToCart",
    {
      content_ids: [p.id],
      content_name: p.name,
      content_category: p.category,
      content_type: "product",
      contents: [{ id: p.id, quantity: p.qty, item_price: p.price }],
      value: p.price * p.qty,
      currency: CURRENCY,
    },
    genEventId()
  );

export const trackInitiateCheckout = (o: {
  items: { id: string; qty: number; price: number }[];
  value: number;
}) =>
  trackAndRelay(
    "InitiateCheckout",
    {
      content_ids: o.items.map((i) => i.id),
      contents: o.items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
      content_type: "product",
      num_items: o.items.reduce((s, i) => s + i.qty, 0),
      value: o.value,
      currency: CURRENCY,
    },
    genEventId()
  );

/**
 * Purchase — the money event. Guarded so a page refresh or a back-navigation to
 * /order/success can't report the same sale twice and inflate your ROAS.
 * `txnid` doubles as the Meta eventID, which is exactly what CAPI de-dup expects.
 *
 * Not relayed to /api/track/event like the other events above — the server already
 * sends its own Purchase to Conversions API from api/payu/callback.ts, using the same
 * txnid as the eventID, once PayU confirms the payment actually succeeded and using
 * the order's real email/phone from the database. Relaying this client-side call too
 * would mean trusting an unverified browser POST for the money event, so it's left as
 * Pixel-only here on purpose.
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
