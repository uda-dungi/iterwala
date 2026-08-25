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
 *
 * ⚠️ Every browser fire MUST carry an eventID or Meta counts it separately from the CAPI
 * copy. That means never calling fbq('track', …) without one, and keeping autoConfig off
 * in initPixel() so Meta's own auto-detected (untagged) events stay disabled — see the
 * comment there for the coverage numbers that forced it.
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

/** Meta's documented _fbc format: `fb.<subdomainIndex>.<creationMs>.<fbclid>`. */
const FBC_FORMAT = /^fb\.\d+\.(\d+)\..+$/;

/** EVERY value the jar holds for `name`, not just the first.
 *
 *  Plural on purpose. The jar can legitimately hold two `_fbc` cookies at once — one
 *  host-only (what this file used to write) and one scoped to the registrable domain
 *  (what fbevents.js writes) — and `document.cookie` exposes no domain or creation
 *  date to tell them apart. Returning the first match meant a months-old click id
 *  could shadow the one from the ad the shopper *just* clicked, so every event went
 *  to Meta attributed to the wrong click. The caller picks; see pickSignalCookie. */
function readCookies(name: string): string[] {
  if (typeof document === "undefined") return [];
  const out: string[] = [];
  for (const part of document.cookie.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    const raw = part.slice(idx + 1).trim();
    if (raw) out.push(decodeURIComponent(raw));
  }
  return out;
}

/* The widest domain this browser will actually accept a cookie for, with `www.`
 * stripped — so what we write is the SAME cookie fbevents.js writes (it scopes to the
 * registrable domain) rather than a second host-only copy shadowing it.
 *
 * Probed by writing and reading back rather than assumed: a Domain attribute is
 * silently rejected for IP literals, single-label hosts and (in some browsers)
 * localhost, and a silently-rejected cookie means no fbc at all on that visit — worse
 * than the host-only cookie it replaced. Resolved once and cached for the page. */
let cookieDomain: string | null | undefined;
const DOMAIN_PROBE = "itr_cd";

function resolveCookieDomain(): string | null {
  if (cookieDomain !== undefined) return cookieDomain;
  cookieDomain = null;
  try {
    const host = window.location.hostname;
    // Bare hostname with at least two labels, and not an IPv4 literal.
    if (!host.includes(".") || /^[\d.]+$/.test(host) || !/^[a-z0-9.-]+$/i.test(host)) return cookieDomain;
    const candidate = host.replace(/^www\./i, "");
    document.cookie = `${DOMAIN_PROBE}=1; Domain=.${candidate}; Path=/; SameSite=Lax`;
    if (readCookies(DOMAIN_PROBE).length) {
      cookieDomain = `.${candidate}`;
      document.cookie = `${DOMAIN_PROBE}=; Domain=.${candidate}; Path=/; Max-Age=0; SameSite=Lax`;
    }
  } catch {
    /* cookies disabled — host-only write below will no-op too, storage tiers cover it */
  }
  return cookieDomain;
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const domain = resolveCookieDomain();
  document.cookie =
    `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}` +
    (domain ? `; Domain=${domain}` : "");
}

/** Resolves the duplicate-cookie case: for _fbc the freshest well-formed click wins
 *  (that is the click Meta attributes the conversion to), for _fbp any value will do. */
function pickSignalCookie(name: string, key: SignalKey): string | undefined {
  const values = readCookies(name);
  if (values.length < 2 || key === "fbp") return values[0];
  let best: string | undefined;
  let bestAt = -1;
  for (const v of values) {
    const at = Number(FBC_FORMAT.exec(v)?.[1] ?? -1);
    if (at > bestAt) {
      bestAt = at;
      best = v;
    }
  }
  return best ?? values[0];
}

/* Cookies are the format Meta's own script reads, but they are the least durable place to
 * keep these: Safari's ITP caps script-written cookies at 7 days and some browsers block
 * them outright — exactly the privacy-restricted traffic CAPI exists to recover. So both
 * values are mirrored into localStorage and read back from there when the cookie is gone,
 * which stops fbc/fbp quietly dropping out of the server event's user_data. */
const FBC_BACKUP_KEY = "itr_fbc";
const FBP_BACKUP_KEY = "itr_fbp";

function backupSignal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked — the cookie is still the primary copy */
  }
}

/* Last-resort in-memory copies, held for the life of the page.
 *
 * Cookies and localStorage are BOTH unavailable in Safari private mode and in several
 * in-app browsers — which is a large slice of ad traffic. When that happened every match
 * key dropped out at once (no fbp, no fbc, no external_id, and no em/ph before checkout),
 * so the server event reached Meta carrying nothing but client_ip_address and
 * client_user_agent. Meta does not count those two as identifying: its "Send missing user
 * data parameters" diagnostic needs at least one of fbp/fbc/external_id/em/ph, and without
 * one the event can't be used for attribution or optimisation at all.
 *
 * Keeping the values in memory doesn't survive a reload, but it keeps every event in a
 * session tied together and always carries one real key. */
const memory: { fbp?: string; fbc?: string; externalId?: string } = {};

type SignalKey = "fbp" | "fbc";

/** Writes a signal to every store that will take it. Memory first — it cannot fail. */
function persistSignal(cookieName: string, backupKey: string, key: SignalKey, value: string) {
  memory[key] = value;
  writeCookie(cookieName, value);
  backupSignal(backupKey, value);
}

/** Cookie first, then the localStorage mirror, then memory. A value recovered from a
 *  lower tier is written back up so Meta's own script picks it up again on this page. */
function readSignal(cookieName: string, backupKey: string, key: SignalKey): string | undefined {
  const fromCookie = pickSignalCookie(cookieName, key);
  if (fromCookie) {
    memory[key] = fromCookie;
    backupSignal(backupKey, fromCookie);
    return fromCookie;
  }
  try {
    const stored = localStorage.getItem(backupKey) || undefined;
    if (stored) {
      memory[key] = stored;
      writeCookie(cookieName, stored);
      return stored;
    }
  } catch {
    /* storage blocked — fall through to memory */
  }
  return memory[key];
}

/** Writes _fbc/_fbp in Meta's documented format when they're missing, so every event —
 *  including the very first PageView, and visits where fbevents.js is blocked — carries
 *  them. Formats: _fbc = `fb.1.<ms>.<fbclid>`, _fbp = `fb.1.<ms>.<random>`. */
function ensureFbCookies() {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(window.location.search).get("fbclid");
    if (fbclid) {
      // A fresh click must win over a stale one, so only keep the existing value when
      // it already carries this same fbclid (otherwise re-visits keep the old attribution).
      const current = readSignal(FBC_COOKIE, FBC_BACKUP_KEY, "fbc");
      if (!current || !current.endsWith(`.${fbclid}`)) {
        persistSignal(FBC_COOKIE, FBC_BACKUP_KEY, "fbc", `fb.1.${Date.now()}.${fbclid}`);
      }
    }
    if (!readSignal(FBP_COOKIE, FBP_BACKUP_KEY, "fbp")) {
      persistSignal(FBP_COOKIE, FBP_BACKUP_KEY, "fbp", `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`);
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
    memory.externalId = id;
    return id;
  } catch {
    // Storage blocked. Returning undefined here used to be the last straw: with fbp/fbc
    // also unavailable in these browsers, the event went to Meta with no match key at all.
    // A per-page id is worth far more than nothing — it still ties this session's events
    // together, which is what external_id is for.
    if (!memory.externalId) memory.externalId = genEventId();
    return memory.externalId;
  }
}

/** The match signals this browser can supply, for callers that POST to our own API and
 *  need to persist them (checkout stores these on the order so the Purchase event, which
 *  is sent from PayU's server-to-server callback, can still report the real shopper). */
export function getPixelSignals(): { fbp?: string; fbc?: string; externalId?: string } {
  if (typeof window === "undefined") return {};
  ensureFbCookies();
  return {
    fbp: readSignal(FBP_COOKIE, FBP_BACKUP_KEY, "fbp"),
    fbc: readSignal(FBC_COOKIE, FBC_BACKUP_KEY, "fbc"),
    externalId: getExternalId(),
  };
}

type Identity = { email?: string; phone?: string; firstName?: string; lastName?: string };

/** Same normalisation as hashName() in api/_lib/metaCapi.ts — see the note there on why
 *  the two must stay identical. fbevents.js hashes whatever it is handed, so the value
 *  passed here has to already match what the server hashes for the same person. */
const normaliseName = (name?: string): string | undefined =>
  name?.toLowerCase().replace(/[^\p{L}]/gu, "") || undefined;

/** Remembers who this visitor is so later events (PageView, AddToCart, …) can carry
 *  hashed em/ph — by far the heaviest-weighted match signals. Called from checkout when
 *  the form is submitted and on sign-in. The values are hashed server-side before they
 *  ever reach Meta (api/_lib/metaCapi.ts); nothing identifying is sent to Meta in clear. */
export function setPixelIdentity(identity: Identity) {
  let merged: Identity = identity;
  try {
    merged = { ...getIdentity(), ...identity };
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(merged));
  } catch {
    /* storage blocked — CAPI still gets em/ph via the in-memory value below */
  }
  // Re-arm browser-side Advanced Matching with the identity we now know.
  //
  // initPixel() reads the identity once, at load. On a SPA the shopper usually signs in
  // (or fills the checkout form) LONG after that, so without this re-init every browser
  // event for the rest of the session goes out with no em/ph — the two heaviest-weighted
  // match signals — even though the CAPI copy carries them. Re-calling fbq("init", …) is
  // Meta's documented way to update user data for subsequent events; it does not reload
  // the script or re-fire PageView. fbevents.js SHA-256 hashes these in the browser, so
  // nothing identifying leaves it in clear.
  applyAdvancedMatching(merged);
}

/** Passes hashed-in-browser em/ph/external_id to the Pixel for all subsequent events.
 *
 *  Normalised to exactly what api/_lib/metaCapi.ts hashes (email: trimmed + lowercased,
 *  phone: digits only). fbevents.js hashes whatever it is handed, so passing the raw
 *  "  Shopper@Example.COM " here while the server hashes "shopper@example.com" would
 *  produce two different SHA-256 values for one person — Meta would then fail to match
 *  the browser and CAPI copies to the same user, which is the whole point of sending it. */
function applyAdvancedMatching(identity: Identity) {
  if (typeof window === "undefined" || !isPixelConfigured() || !window.fbq) return;
  const em = identity.email?.trim().toLowerCase();
  const ph = identity.phone?.replace(/\D/g, "");
  const fn = normaliseName(identity.firstName);
  const ln = normaliseName(identity.lastName);
  const externalId = getExternalId();
  window.fbq("init", site.metaPixelId, {
    ...(em ? { em } : {}),
    ...(ph ? { ph } : {}),
    ...(fn ? { fn } : {}),
    ...(ln ? { ln } : {}),
    ...(externalId ? { external_id: externalId } : {}),
  });
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

  // Meta's automatic event detection fires its OWN ViewContent/PageView off page
  // heuristics, and those copies carry no eventID at all — so Meta cannot match them to
  // the CAPI copy and ends up counting both. That is exactly what dropped ViewContent's
  // event-ID coverage to ~26% (55 browser events, only 66% of them tagged) while
  // AddToCart and InitiateCheckout — which Meta never auto-detects, so they only ever
  // fire from the calls below — sat at 100% tagged and ~94% coverage.
  // Must be set BEFORE init, or the auto-detected events are already armed.
  window.fbq?.("set", "autoConfig", false, site.metaPixelId);

  // autoConfig:false also turns off Meta's *automatic* advanced matching, so pass the
  // identifiers explicitly instead — fbevents.js SHA-256 hashes these in the browser
  // before they leave it, so nothing identifying goes to Meta in clear. This keeps Event
  // Match Quality where it was without reintroducing untagged events. setPixelIdentity()
  // calls the same helper again if the shopper signs in later in the session.
  applyAdvancedMatching(getIdentity());

  const eventID = genEventId();
  window.fbq?.("track", "PageView", {}, { eventID });
  sendServerEvent("PageView", eventID);

  // Anything that failed to reach the relay earlier (or on the previous page) goes out
  // now — after this PageView, so a recovery burst never delays the live event.
  flushRelayQueue();
}

/** Fire a standard Meta event. `eventID` lets the server-side Conversions API
 *  de-duplicate the same conversion. */
function track(event: string, params?: Record<string, unknown>, eventID?: string) {
  if (!isPixelConfigured() || typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", event, params ?? {}, eventID ? { eventID } : undefined);
}

const genEventId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/* ─────────────── Relay delivery ───────────────
 *
 * AddToCart's server copy was reaching Meta for far fewer shoppers than the browser
 * Pixel fired it for — that ratio is exactly what Meta reports as server "coverage".
 * Three separate ways a relay POST was being lost, all handled below:
 *
 *  1. navigator.sendBeacon() RETURNS FALSE when the browser declines to queue the
 *     request — its beacon queue is size-bounded and some browsers refuse outright
 *     during an unload. The return value was ignored, so those events vanished
 *     silently. AddToCart is the worst-hit event because it is the one most often
 *     followed by an immediate navigation: "Buy now" calls addToCart() and then
 *     hard-navigates to /checkout in the same tick.
 *  2. Content blockers match request paths, and "/api/track/event" trips the generic
 *     tracker rules on the common lists. A relay whose whole job is recovering the
 *     conversions the Pixel lost to blockers must not be blocked by those same lists,
 *     so the POST goes to a route that reads like nothing in particular.
 *
 *     This has to be the PRIMARY route, not a fallback: a blocker cancels the request
 *     in the network layer, where sendBeacon has already returned true and fetch
 *     resolves or rejects out of our reach. There is no reliable signal to fall back
 *     ON, so the first attempt is the one that has to survive. /api/track/event stays
 *     live behind it — bundles cached in browsers from before this change still POST
 *     there, and it doubles as the second attempt below.
 *  3. Nothing survived a failure. A lost event stayed lost even though the shopper
 *     almost always loads another page moments later — failures now park in
 *     localStorage and flush on the next page view.
 */
const RELAY_PRIMARY = "/api/e";
const RELAY_FALLBACK = "/api/track/event";
const RELAY_QUEUE_KEY = "itr_relay_q";
/** Small on purpose — this is a recovery buffer, not an outbox. */
const RELAY_QUEUE_MAX = 20;

function queueRelay(body: string) {
  try {
    const q: string[] = JSON.parse(localStorage.getItem(RELAY_QUEUE_KEY) || "[]");
    localStorage.setItem(RELAY_QUEUE_KEY, JSON.stringify([...q, body].slice(-RELAY_QUEUE_MAX)));
  } catch {
    /* storage blocked — this one event is genuinely unrecoverable */
  }
}

/** One delivery attempt. Attempt 0 is the primary route (beacon, then keepalive fetch);
 *  attempt 1 retries on the second route; after that the body is parked for the next
 *  page view. */
function deliverRelay(body: string, attempt: 0 | 1 = 0) {
  const url = attempt === 0 ? RELAY_PRIMARY : RELAY_FALLBACK;
  // sendBeacon is still preferred: it is the only transport guaranteed to outlive the
  // page that queued it. It just has to be checked rather than trusted.
  if (attempt === 0 && navigator.sendBeacon?.(url, new Blob([body], { type: "application/json" }))) return;
  fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
    })
    .catch(() => {
      if (attempt === 0) deliverRelay(body, 1);
      else queueRelay(body);
    });
}

/** Re-sends events that failed earlier in the session or on a previous page.
 *
 *  Each queued body carries its ORIGINAL eventId and eventTime, so Meta still de-dupes
 *  the recovered copy against the browser Pixel fire it belongs to and timestamps it
 *  when the shopper actually acted — not when we managed to get it through. */
function flushRelayQueue() {
  let queued: string[] = [];
  try {
    queued = JSON.parse(localStorage.getItem(RELAY_QUEUE_KEY) || "[]");
    if (!queued.length) return;
    // Cleared before resending — a body that fails again re-queues itself below.
    localStorage.removeItem(RELAY_QUEUE_KEY);
  } catch {
    return;
  }
  // Meta rejects events older than 7 days, so stop carrying them forever.
  const cutoff = Math.floor(Date.now() / 1000) - 6 * 24 * 60 * 60;
  for (const body of queued) {
    try {
      if (Number(JSON.parse(body)?.eventTime) >= cutoff) deliverRelay(body);
    } catch {
      /* unparseable leftover — drop it */
    }
  }
}

/** POSTs the same event to our own backend (api/track/event.ts), which forwards it to
 *  Meta's Conversions API from the server. Delivery is handled by deliverRelay above —
 *  beacon first so the call survives the page unloading right after (a route change, a
 *  redirect to PayU), with the fallbacks that keep coverage up when it doesn't. */
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
      // Stamped here, not on the server. A queued retry can land minutes later, and an
      // event Meta timestamps at delivery instead of at the action stops lining up with
      // the browser Pixel copy it is supposed to de-dupe against.
      eventTime: Math.floor(Date.now() / 1000),
      eventSourceUrl: window.location.href,
      customData,
      // Sent explicitly rather than left to the request's Cookie header: sendBeacon fires
      // during unload, and these are the values this page actually saw.
      fbc: readSignal(FBC_COOKIE, FBC_BACKUP_KEY, "fbc"),
      fbp: readSignal(FBP_COOKIE, FBP_BACKUP_KEY, "fbp"),
      externalId: getExternalId(),
      email: identity.email,
      phone: identity.phone,
      firstName: identity.firstName,
      lastName: identity.lastName,
    });
    deliverRelay(body);
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
