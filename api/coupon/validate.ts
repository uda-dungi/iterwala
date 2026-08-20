import { computeCoupon, hasPreviousPaidOrder, normalizeCode } from "../_lib/coupons.js";
import { computeOffers } from "../_lib/offers.js";
import { priceForServerAsync } from "../_lib/priceSource.js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../_lib/supabaseAdmin.js";

/**
 * Vercel Node.js serverless function — POST /api/coupon/validate
 *
 * Body: { code, email, items: [{ id, volume, qty }] }
 * Returns: { valid, discount, reason? }
 *
 * Lets checkout confirm a promo code the moment an email is entered, so the shopper finds
 * out there and then rather than at the payment step. This endpoint is a convenience for
 * the UI only — /api/checkout/initiate performs the identical check again and is what
 * actually decides the charged amount, so a forged response here buys nothing.
 *
 * Prices are recomputed from the server's own table rather than trusting the posted cart,
 * for the same reason initiate.ts does it.
 */

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
    const code = normalizeCode(body?.code);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const items = Array.isArray(body?.items) ? body.items : [];

    if (!code) {
      res.status(200).json({ valid: false, discount: 0 });
      return;
    }

    let subtotal = 0;
    const lines: { id: string; qty: number; unitPrice: number }[] = [];
    for (const line of items) {
      const qty = Number(line?.qty);
      if (!line?.id || !Number.isFinite(qty) || qty <= 0) continue;
      const unitPrice = await priceForServerAsync(String(line.id), line.volume ? String(line.volume) : undefined);
      if (unitPrice == null) continue;
      subtotal += unitPrice * qty;
      lines.push({ id: String(line.id), qty, unitPrice });
    }

    const { discount: offerDiscount } = computeOffers(lines);
    const discountedSubtotal = Math.max(0, subtotal - offerDiscount);

    const result = computeCoupon(code, discountedSubtotal, offerDiscount);
    if (!result.valid) {
      res.status(200).json(result);
      return;
    }

    if (email && isSupabaseAdminConfigured()) {
      const admin = getSupabaseAdmin();
      if (await hasPreviousPaidOrder(admin, email)) {
        res.status(200).json({
          valid: false,
          discount: 0,
          reason: "This code is for first orders only, and this email has ordered before.",
        });
        return;
      }
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("coupon/validate: unexpected error", err);
    // Fail closed on the *display* path — the shopper simply doesn't see a discount rather
    // than seeing one that checkout would then strip off.
    res.status(200).json({ valid: false, discount: 0 });
  }
}
