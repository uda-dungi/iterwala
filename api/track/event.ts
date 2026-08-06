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

const ALLOWED_EVENTS = new Set(["PageView", "AddToCart", "InitiateCheckout"]);

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
        eventName: eventName as "PageView" | "AddToCart" | "InitiateCheckout",
        eventId: typeof body.eventId === "string" ? body.eventId : undefined,
        eventSourceUrl: typeof body.eventSourceUrl === "string" ? body.eventSourceUrl : undefined,
        user: signals,
        customData: body.customData && typeof body.customData === "object" ? body.customData : undefined,
      });
    }
  } catch (err) {
    console.error("track/event: unexpected error", err);
  }

  res.status(204).end();
}
