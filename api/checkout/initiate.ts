import { generatePayuHash, generateTxnId, getPayuMode, isPayuConfigured, PAYU_ACTION_URL } from "../_lib/payu.js";
import { ensureCustomerAccount, getSupabaseAdmin, isSupabaseAdminConfigured } from "../_lib/supabaseAdmin.js";
import { priceForServer, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GIFT_WRAP_FEE } from "../_lib/prices.js";

function parseRequestBody(rawBody: any) {
  if (!rawBody) return {};
  if (typeof rawBody === "string") {
    try {
      return JSON.parse(rawBody);
    } catch {
      return Object.fromEntries(new URLSearchParams(rawBody));
    }
  }
  if (rawBody instanceof URLSearchParams) {
    return Object.fromEntries(rawBody.entries());
  }
  return rawBody;
}

// Vercel Node.js serverless function — POST /api/checkout/initiate
// Body: { customer, address, items, amounts, gift }
// Returns: { action, fields } — the frontend auto-submits a form with `fields` to `action` (PayU hosted page).

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isPayuConfigured()) {
    res.status(503).json({
      error:
        "Payments aren't live yet — add PAYU_MERCHANT_KEY and PAYU_SALT in the project's environment variables to enable checkout.",
    });
    return;
  }

  try {
    const body = parseRequestBody(req.body);
    const { customer, address, items, amounts } = body;

    if (!customer?.email || !customer?.firstName || !customer?.phone) {
      res.status(400).json({ error: "Missing required contact details." });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty." });
      return;
    }

    // Security: never trust a client-supplied total for what actually gets charged.
    // Recompute every line from the server's own price table (api/_lib/prices.ts) so a
    // tampered request (e.g. a hand-edited fetch call) can't pay less than the real
    // cart value — the PayU hash below is generated from `subtotal`/`total`, not from
    // anything the browser sent.
    let subtotal = 0;
    for (const line of items) {
      const qty = Number(line?.qty);
      if (!line?.id || !Number.isFinite(qty) || qty <= 0 || qty > 50) {
        res.status(400).json({ error: "Invalid item in cart. Please refresh and try again." });
        return;
      }
      const unitPrice = priceForServer(String(line.id), line.volume ? String(line.volume) : undefined);
      if (unitPrice == null) {
        res.status(400).json({ error: "One of the items in your cart is no longer available." });
        return;
      }
      subtotal += unitPrice * qty;
    }
    const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const gift = Boolean(amounts?.gift);
    const total = subtotal + shipping + (gift ? GIFT_WRAP_FEE : 0);

    if (!total || total <= 0) {
      res.status(400).json({ error: "Invalid order total." });
      return;
    }

    const key = process.env.PAYU_MERCHANT_KEY as string;
    const salt = process.env.PAYU_SALT as string;
    const mode = getPayuMode();
    const txnid = generateTxnId();
    const amount = total.toFixed(2);
    const productinfo = `Itrawala order — ${items.length} item${items.length > 1 ? "s" : ""}`.slice(0, 100);
    const firstname = String(customer.firstName).slice(0, 60);
    const email = String(customer.email).trim().toLowerCase();
    const phone = String(customer.phone).replace(/\D/g, "").slice(0, 15);

    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
    const origin = process.env.SITE_URL || `${proto}://${host}`;
    const callbackUrl = `${origin}/api/payu/callback`;

    // Best-effort: silently create/find an account for this email and persist the order.
    // Checkout still works even if Supabase isn't configured — it just won't have order history.
    let userId: string | null = null;
    if (isSupabaseAdminConfigured()) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const fullName = `${customer.firstName} ${customer.lastName || ""}`.trim();
        userId = await ensureCustomerAccount(admin, email, fullName);
        const { error: insertError } = await admin.from("orders").insert({
          txnid,
          user_id: userId,
          email,
          phone,
          name: fullName,
          address,
          items,
          subtotal,
          shipping,
          gift_wrap: gift,
          total,
          status: "pending",
        });
        if (insertError) console.error("checkout/initiate: order insert failed", insertError.message);
      }
    }

    const hash = generatePayuHash(
      { key, txnid, amount, productinfo, firstname, email, udf1: phone },
      salt
    );

    res.status(200).json({
      action: PAYU_ACTION_URL[mode],
      fields: {
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl: callbackUrl,
        furl: callbackUrl,
        udf1: phone,
        hash,
      },
    });
  } catch (err) {
    console.error("checkout/initiate: unexpected error", err);
    res.status(500).json({ error: "Something went wrong while starting payment. Please try again." });
  }
}
