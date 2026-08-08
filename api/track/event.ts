import { sendCapiEvent, extractRequestSignals } from "../_lib/metaCapi.js";

/**
 * Vercel Node.js serverless function — POST /api/track/event
 *
 * Thin relay the browser calls right alongside a Pixel fire (see sendServerEvent in
 * src/lib/pixel.ts) so the same conversion also reaches Meta via server-to-server
 * Conversions API. Covers the events that only ever happen in the browser — PageView,
 * AddToCart, InitiateCheckout. Purchase is deliberately NOT relayed through here: it's
 * sent from api/payu/callback.ts instead, where the order's real, DB-verified email/
 * phone are available and the payment has actually been confirmed — routing it through
 * this endpoint would mean trusting an unverified client POST for the money event.
 *
 * Always responds fast and never surfaces an error to the caller — sendCapiEvent()
 * already swallows and logs its own failures, and a tracking hiccup must never be
 * visible to the shopper or block the page.
 */

const ALLOWED_EVENTS = new Set(["PageView", "ViewContent", "AddToCart", "InitiateCheckout"]);

/** Only accept a string when it actually carries a value — keeps empty strings out of
 *  user_data, where they'd count as a "present but unmatched" signal. */
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);

function parseRequestBody(rawBody: any) {
  if (!rawBody) return {};
  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch {
      return {};
    }
  }
  return rawBody;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  try {
    const body = parseRequestBody(req.body);
    const eventName = body?.eventName;
    if (typeof eventName === "string" && ALLOWED_EVENTS.has(eventName)) {
      const signals = extractRequestSignals(req);
      // Awaited (not fire-and-forget): Vercel can freeze/kill the function the moment
      // the response is sent, so a detached promise here might never actually send —
      // same reasoning as the email send in api/payu/callback.ts.
      await sendCapiEvent({
        eventName: eventName as "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout",
        eventId: str(body.eventId),
        eventSourceUrl: str(body.eventSourceUrl),
        user: {
          // IP and user agent can only come from the connection itself.
          ip: signals.ip,
          userAgent: signals.userAgent,
          // The browser sends the cookie values it actually saw; the request's own Cookie
          // header is the fallback. The client copy matters because sendBeacon fires during
          // unload and because we write _fbc/_fbp ourselves when Meta's script is blocked.
          fbp: str(body.fbp) || signals.fbp,
          fbc: str(body.fbc) || signals.fbc,
          externalId: str(body.externalId),
          email: str(body.email),
          phone: str(body.phone),
        },
        customData: body.customData && typeof body.customData === "object" ? body.customData : undefined,
      });
    }
  } catch (err) {
    console.error("track/event: unexpected error", err);
  }

  res.status(204).end();
}
