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

/** Pulls Meta's own browser-set cookies + connection info out of a Vercel request so
 *  server events carry the same signals the browser Pixel would. This is most of what
 *  makes CAPI match quality good instead of a shot in the dark. */
export function extractRequestSignals(req: any): {
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
} {
  const forwarded = (req.headers?.["x-forwarded-for"] as string) || "";
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
  return { ip, userAgent, fbp: cookies["_fbp"], fbc: cookies["_fbc"] };
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
  eventName: "Purchase" | "InitiateCheckout" | "AddToCart" | "PageView";
  /** Must match the browser Pixel's eventID for the same action so Meta de-dupes. */
  eventId?: string;
  eventSourceUrl?: string;
  user: CapiUserData;
  customData?: Record<string, unknown>;
};

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
  if (event.user.fbc) user_data.fbc = event.user.fbc;
  // Meta hashes external_id itself if sent raw, but hashing here keeps it consistent with
  // em/ph and means no raw identifier ever leaves our server.
  if (event.user.externalId) user_data.external_id = [sha256(event.user.externalId)];

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
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

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("metaCapi: send failed", event.eventName, res.status, text.slice(0, 500));
    }
  } catch (err) {
    console.error("metaCapi: unexpected error", event.eventName, err);
  }
}
