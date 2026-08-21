import { createHash } from "crypto";

/**
 * Meta Conversions API (CAPI) — server-side mirror of the browser Pixel events in
 * src/lib/pixel.ts. Sends the *same* event_id as the matching browser event so Meta
 * de-dupes the two into a single conversion instead of double-counting.
 *
 * Why this exists alongside the Pixel: the browser Pixel call to connect.facebook.net
 * is exactly what ad blockers and Safari/iOS tracking prevention block. A server call
 * from Vercel to graph.facebook.com isn't affected by any of that, so CAPI recovers
 * conversions the Pixel alone would silently lose — and Meta uses the extra match
 * signals (hashed email/phone, IP, user agent, fbp/fbc cookies) to improve ad
 * attribution even when both copies land fine.
 *
 * Activates only when META_CAPI_ACCESS_TOKEN is set (plus a pixel ID — same
 * VITE_META_PIXEL_ID that lights up the browser Pixel; CAPI and the Pixel must report
 * to the same pixel for Meta to de-dupe them). Same "drop a value to go live" pattern
 * as PayU/Resend/Supabase elsewhere in this repo — blank token = fully off, no
 * requests fired, nothing breaks.
 *
 * Get the token from Events Manager → Data Sources → your pixel → Settings →
 * Conversions API → "Generate access token".
 */

const GRAPH_VERSION = "v21.0";

function getPixelId(): string {
  return (process.env.VITE_META_PIXEL_ID as string) || (process.env.META_PIXEL_ID as string) || "";
}

export function isCapiConfigured(): boolean {
  return Boolean(getPixelId() && process.env.META_CAPI_ACCESS_TOKEN);
}

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Meta requires em/ph as lowercase-trimmed SHA-256. */
export const hashEmail = (email?: string): string | undefined =>
  email && email.trim() ? sha256(email.trim().toLowerCase()) : undefined;

export const hashPhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  // Digits only — matches the udf1 phone format already used for PayU (api/checkout/initiate.ts).
  const digits = phone.replace(/\D/g, "");
  return digits ? sha256(digits) : undefined;
};

/* ─────────────── fbc (the click id) ───────────────
 *
 * fbc is the single strongest attribution signal Meta accepts, and it was present on
 * far too few of our server events. Three things fix that, all in this file:
 *
 *  1. Malformed values are dropped rather than forwarded. Meta discards an fbc that
 *     isn't exactly `fb.<subdomainIndex>.<creationMs>.<fbclid>`, so a mangled one is
 *     worth no more than none — but it hides the problem by looking present locally.
 *  2. When no usable fbc arrives, it is rebuilt from the click id on the event's own
 *     page URL. That URL is already sent as event_source_url, so this costs nothing and
 *     recovers every landing-page event where the browser could not store a cookie at
 *     all (Safari private mode, in-app browsers, cookies blocked outright).
 *  3. A click id on the event's own URL beats a stored one: it is by definition the
 *     click that produced this pageview, so a stale cookie from an older click can no
 *     longer misattribute a fresh visit.
 *
 * The durability half of the problem is handled by MIRROR_COOKIES below.
 */

/** Meta's documented format — anything else is discarded on their side. */
const FBC_FORMAT = /^fb\.\d+\.\d+\..+$/;

const normalizeFbc = (fbc?: string): string | undefined => {
  const v = fbc?.trim();
  return v && FBC_FORMAT.test(v) ? v : undefined;
};

/** `fb.1.<creationMs>.<fbclid>` — subdomain index 1 matches the registrable-domain
 *  scope both fbevents.js and src/lib/pixel.ts write the cookie at. */
const fbcFromFbclid = (fbclid?: string): string | undefined => {
  const id = fbclid?.trim();
  return id ? `fb.1.${Date.now()}.${id}` : undefined;
};

const fbclidFromUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).searchParams.get("fbclid")?.trim() || undefined;
  } catch {
    return undefined;
  }
};

/** Best fbc we can produce for an event, preferring a fresh click over a stored one. */
export function resolveFbc(suppliedFbc?: string, eventSourceUrl?: string): string | undefined {
  const supplied = normalizeFbc(suppliedFbc);
  const urlFbclid = fbclidFromUrl(eventSourceUrl);
  if (urlFbclid && !supplied?.endsWith(`.${urlFbclid}`)) return fbcFromFbclid(urlFbclid);
  return supplied;
}

/* First-party, server-set mirrors of _fbc/_fbp.
 *
 * Safari's ITP caps any cookie written by JavaScript at 7 days, and evicts script-
 * writable storage (so our localStorage backups too) after a week of no interaction.
 * That is why fbc coverage decayed with time-since-click on exactly the iOS traffic CAPI
 * is meant to recover: the click is attributable for 90 days, but the cookie recording it
 * was gone after 7. A cookie set by the SERVER in a response header is not subject to
 * that cap, so every relayed event re-stamps these, and they are read back as the
 * fallback when Meta's own _fbc/_fbp have expired. HttpOnly since only the server ever
 * reads them — that also keeps them out of reach of anything running in the page. */
export const FBC_MIRROR_COOKIE = "_itr_fbc";
export const FBP_MIRROR_COOKIE = "_itr_fbp";
/** Meta attributes clicks for 90 days — match that, not the 7 days ITP would allow. */
const MIRROR_COOKIE_MAX_AGE = 90 * 24 * 60 * 60;

/** `Set-Cookie` values re-stamping whichever signals this event actually carried.
 *  Returns [] when there is nothing worth persisting, so callers can set unconditionally. */
export function mirrorCookieHeaders(signals: { fbc?: string; fbp?: string }): string[] {
  const out: string[] = [];
  const attrs = `Max-Age=${MIRROR_COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  if (signals.fbc) out.push(`${FBC_MIRROR_COOKIE}=${encodeURIComponent(signals.fbc)}; ${attrs}`);
  if (signals.fbp) out.push(`${FBP_MIRROR_COOKIE}=${encodeURIComponent(signals.fbp)}; ${attrs}`);
  return out;
}

/** Pulls Meta's own browser-set cookies + connection info out of a Vercel request so
 *  server events carry the same signals the browser Pixel would. This is most of what
 *  makes CAPI match quality good instead of a shot in the dark. */
export function extractRequestSignals(req: any): {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
} {
  // x-forwarded-for is what Vercel normally sets, but fall through the other proxy
  // headers too — an event that reaches Meta with no client_ip_address at all is treated
  // as unmatchable, so a fallback is always worth more than a blank.
  const forwarded =
    (req.headers?.["x-forwarded-for"] as string) ||
    (req.headers?.["x-vercel-forwarded-for"] as string) ||
    (req.headers?.["x-real-ip"] as string) ||
    "";
  const ip = forwarded.split(",")[0]?.trim() || req.socket?.remoteAddress || undefined;
  const userAgent = (req.headers?.["user-agent"] as string) || undefined;

  const cookieHeader = (req.headers?.cookie as string) || "";
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) cookies[k] = decodeURIComponent(v);
  }
  // Meta's own cookies first; our durable server-set mirrors when ITP has expired them.
  return {
    ip,
    userAgent,
    fbp: cookies["_fbp"] || cookies[FBP_MIRROR_COOKIE],
    fbc: cookies["_fbc"] || cookies[FBC_MIRROR_COOKIE],
  };
}

export type CapiUserData = {
  email?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  /** Stable per-browser id (see getExternalId in src/lib/pixel.ts). Counts toward Meta's
   *  Event Match Quality and links a visitor's events together across sessions. */
  externalId?: string;
};

export type CapiEvent = {
  /** ViewContent is relayed from the browser like PageView/AddToCart/InitiateCheckout
   *  (see api/track/event.ts); Purchase is sent from api/payu/callback.ts instead. */
  eventName: "Purchase" | "InitiateCheckout" | "AddToCart" | "PageView" | "ViewContent";
  /** Must match the browser Pixel's eventID for the same action so Meta de-dupes. */
  eventId?: string;
  /** Unix seconds for when the shopper actually acted. Supply it whenever the send can
   *  be delayed — the browser relay retries failed events on a later page view, and an
   *  event stamped at delivery instead of at the action no longer lines up with the
   *  browser Pixel copy Meta is trying to de-dupe it against. Defaults to now. */
  eventTime?: number;
  eventSourceUrl?: string;
  user: CapiUserData;
  customData?: Record<string, unknown>;
};

/** Meta rejects events dated in the future or more than 7 days old, and rejecting is
 *  silent from our side, so a bad client clock or a stale queued retry would just
 *  disappear. Anything outside the window falls back to now. */
function resolveEventTime(supplied?: number): number {
  const now = Math.floor(Date.now() / 1000);
  const t = Number(supplied);
  return Number.isFinite(t) && t <= now && t > now - 7 * 24 * 60 * 60 ? Math.floor(t) : now;
}

/** Sends one event to Meta. Never throws — a tracking failure must never break
 *  checkout, cart, or navigation, so every error is caught and logged, matching how
 *  email sending and the other best-effort integrations behave in this codebase. */
export async function sendCapiEvent(event: CapiEvent): Promise<void> {
  if (!isCapiConfigured()) return;

  const pixelId = getPixelId();
  const token = process.env.META_CAPI_ACCESS_TOKEN as string;

  const user_data: Record<string, unknown> = {};
  const em = hashEmail(event.user.email);
  const ph = hashPhone(event.user.phone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (event.user.ip) user_data.client_ip_address = event.user.ip;
  if (event.user.userAgent) user_data.client_user_agent = event.user.userAgent;
  if (event.user.fbp) user_data.fbp = event.user.fbp;
  // Validated, and rebuilt from the click id on the event's own URL when the browser
  // could not supply one — see the fbc section above.
  const fbc = resolveFbc(event.user.fbc, event.eventSourceUrl);
  if (fbc) user_data.fbc = fbc;
  // Meta hashes external_id itself if sent raw, but hashing here keeps it consistent with
  // em/ph and means no raw identifier ever leaves our server.
  if (event.user.externalId) user_data.external_id = [sha256(event.user.externalId)];

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: resolveEventTime(event.eventTime),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data,
        custom_data: event.customData,
      },
    ],
  };
  // Events Manager → Test Events tab → paste the code shown there while verifying,
  // then clear it before going live. See .env.example.
  if (process.env.META_TEST_EVENT_CODE) payload.test_event_code = process.env.META_TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`;
  const body = JSON.stringify(payload);

  // Two attempts. A blip reaching graph.facebook.com — a dropped connection, a 429, a
  // 5xx — used to drop the event permanently, which shows up as missing coverage rather
  // than as an error anywhere a shopper or we would notice. A 4xx other than 429 is our
  // own bad payload and will fail identically on a retry, so it isn't retried.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (res.ok) return;
      const text = await res.text().catch(() => "");
      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === 1) {
        console.error("metaCapi: send failed", event.eventName, res.status, text.slice(0, 500));
        return;
      }
    } catch (err) {
      if (attempt === 1) {
        console.error("metaCapi: unexpected error", event.eventName, err);
        return;
      }
    }
    // Brief pause so an overloaded endpoint gets a moment; short enough to stay well
    // inside the function's execution budget, since the caller awaits this.
    await new Promise((r) => setTimeout(r, 250));
  }
}
