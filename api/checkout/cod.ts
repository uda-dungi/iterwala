import { generateTxnId } from "../_lib/payu.js";
import { ensureCustomerAccount, getSupabaseAdmin, isSupabaseAdminConfigured } from "../_lib/supabaseAdmin.js";
import { priceForServerAsync, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GIFT_WRAP_FEE } from "../_lib/priceSource.js";
import { computeOffers } from "../_lib/offers.js";
import { extractRequestSignals, sendCapiEvent } from "../_lib/metaCapi.js";
import { computeCoupon, hasPreviousPaidOrder } from "../_lib/coupons.js";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "../_lib/email.js";
import { generateInvoicePdf, getSellerDetails, getAdminNotifyEmail, type InvoiceOrder } from "../_lib/invoice.js";
import { generateShippingLabelPdf } from "../_lib/shippingLabel.js";
import { createShiprocketOrder } from "../_lib/shiprocket.js";

// Flat Cash on Delivery handling fee, added on top of what PayU checkout would charge
// for the same cart — never trusted from the client (src/pages/Checkout.tsx mirrors
// this constant for display only; this is what actually gets charged/recorded).
const COD_FEE = 49;

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

/**
 * Vercel Node.js serverless function — POST /api/checkout/cod
 * Body: same shape as /api/checkout/initiate (customer, address, items, amounts, gift, coupon).
 * Returns: { txnid, total } — the frontend stashes this and navigates straight to
 * /order/success. Unlike PayU there's no external gateway to hand off to, so this is
 * the terminal step of the checkout request rather than a redirect setup.
 *
 * Requires Supabase to be configured (unlike PayU, which can still process a payment
 * with no order history if Supabase is down) — the database row IS the order for COD,
 * there's no external payment gateway holding the "real" record.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!isSupabaseAdminConfigured()) {
    res.status(503).json({ error: "Cash on Delivery isn't available right now — please try prepaid checkout instead." });
    return;
  }
  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: "Cash on Delivery isn't available right now — please try prepaid checkout instead." });
    return;
  }

  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(String(host || ""));
  const proto = (req.headers["x-forwarded-proto"] as string) || (isLocal ? "http" : "https");
  const origin = process.env.SITE_URL || `${proto}://${host}`;

  try {
    const body = parseRequestBody(req.body);
    const { customer, address, items, amounts } = body;

    if (!customer?.email || !customer?.firstName || !customer?.phone) {
      res.status(400).json({ error: "Missing required contact details." });
      return;
    }
    if (!address?.line1 || !address?.city || !address?.state || !address?.pin) {
      res.status(400).json({ error: "A complete shipping address is required for Cash on Delivery." });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty." });
      return;
    }

    // Security: same server-side recomputation PayU checkout uses (api/checkout/initiate.ts)
    // — never trust a client-supplied total for what the courier collects on delivery.
    let subtotal = 0;
    const offerLines: { id: string; qty: number; unitPrice: number }[] = [];
    for (const line of items) {
      const qty = Number(line?.qty);
      if (!line?.id || !Number.isFinite(qty) || qty <= 0 || qty > 50) {
        res.status(400).json({ error: "Invalid item in cart. Please refresh and try again." });
        return;
      }
      const unitPrice = await priceForServerAsync(String(line.id), line.volume ? String(line.volume) : undefined);
      if (unitPrice == null) {
        res.status(400).json({ error: "One of the items in your cart is no longer available." });
        return;
      }
      subtotal += unitPrice * qty;
      offerLines.push({ id: String(line.id), qty, unitPrice });
    }

    const { discount } = computeOffers(offerLines);
    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const gift = Boolean(amounts?.gift);

    const email = String(customer.email).trim().toLowerCase();
    let couponDiscount = 0;
    const couponCheck = computeCoupon(body?.coupon, discountedSubtotal, discount);
    if (couponCheck.valid) {
      const usedAlready = await hasPreviousPaidOrder(admin, email);
      if (!usedAlready) couponDiscount = couponCheck.discount;
    }

    const total = Math.max(0, discountedSubtotal - couponDiscount) + shipping + (gift ? GIFT_WRAP_FEE : 0) + COD_FEE;
    if (!total || total <= 0) {
      res.status(400).json({ error: "Invalid order total." });
      return;
    }

    const phone = String(customer.phone).replace(/\D/g, "").slice(0, 15);
    const fullName = `${customer.firstName} ${customer.lastName || ""}`.trim();
    const txnid = generateTxnId();
    const createdAt = new Date().toISOString();

    const userId = await ensureCustomerAccount(admin, email, fullName);
    const signals = extractRequestSignals(req);

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
      payment_method: "cod",
      fbp: body.fbp || signals.fbp || null,
      fbc: body.fbc || signals.fbc || null,
      client_ip: signals.ip || null,
      client_ua: signals.userAgent || null,
      external_id: body.externalId || null,
    });

    if (insertError) {
      console.error("checkout/cod: order insert failed", insertError.message);
      res.status(500).json({ error: "Couldn't place your order. Please try again." });
      return;
    }

    // Assign the sequential GST invoice number now — a COD order is a confirmed sale the
    // moment it's placed (there's no separate "payment cleared" event to wait for, the way
    // PayU has), so it gets its invoice number immediately rather than waiting for dispatch.
    const { error: invoiceError } = await admin.rpc("assign_invoice_number", { p_txnid: txnid });
    if (invoiceError) console.error("checkout/cod: invoice number assignment failed", invoiceError.message);

    const { data: withInvoice } = await admin
      .from("orders")
      .select("invoice_no, invoice_date")
      .eq("txnid", txnid)
      .maybeSingle();

    // Best-effort — a failed/unconfigured Shiprocket call must never block the order
    // actually being placed (see api/_lib/shiprocket.ts). Stored on the row when it works.
    const shiprocket = await createShiprocketOrder({
      txnid, createdAt, customerName: fullName, email, phone, address, items, subtotal, total, paymentMethod: "cod",
    });
    if (shiprocket.orderId || shiprocket.shipmentId) {
      const { error: shiprocketUpdateError } = await admin
        .from("orders")
        .update({ shiprocket_order_id: shiprocket.orderId, shiprocket_shipment_id: shiprocket.shipmentId })
        .eq("txnid", txnid);
      if (shiprocketUpdateError) console.error("checkout/cod: failed to store shiprocket ids", shiprocketUpdateError.message);
    }

    // Confirmation email to the customer — same as a paid PayU order gets from
    // api/payu/callback.ts. Best-effort, never throws.
    await sendOrderConfirmationEmail({ email, name: fullName, txnid, items, total });

    // Internal dispatch alert with the invoice and shipping label attached, matching
    // api/payu/callback.ts's admin notification for a paid PayU order — a COD order needs
    // fulfilment's attention just as urgently, and has no PayU dashboard to fall back on.
    const notifyTo = getAdminNotifyEmail();
    if (notifyTo) {
      try {
        const full = {
          txnid, email, phone, name: fullName, address, items, subtotal, shipping,
          gift_wrap: gift, total, payment_method: "cod",
          invoice_no: withInvoice?.invoice_no ?? null, invoice_date: withInvoice?.invoice_date ?? null,
          created_at: createdAt,
        } as InvoiceOrder;
        const seller = getSellerDetails();
        const [invoicePdf, labelPdf] = await Promise.all([
          generateInvoicePdf(full, seller),
          generateShippingLabelPdf(full, seller),
        ]);

        await sendAdminOrderNotification({
          to: notifyTo,
          txnid,
          invoiceNo: withInvoice?.invoice_no ?? null,
          name: fullName,
          email,
          phone,
          address,
          items,
          total,
          attachments: [
            { filename: `${(withInvoice?.invoice_no || txnid).replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`, content: invoicePdf },
            { filename: `label-${txnid.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`, content: labelPdf },
          ],
        });

        await admin.from("orders").update({ admin_notified_at: new Date().toISOString() }).eq("txnid", txnid);
      } catch (err) {
        console.error("checkout/cod: admin notification failed", err);
      }
    }

    // Meta Conversions API — the server-side Purchase, sent with the same txnid as the
    // browser Pixel's eventID (src/lib/pixel.ts trackPurchase) so Meta de-dupes the two.
    await sendCapiEvent({
      eventName: "Purchase",
      eventId: txnid,
      eventSourceUrl: `${origin}/order/success?txnid=${encodeURIComponent(txnid)}`,
      user: {
        email,
        phone,
        ip: signals.ip || undefined,
        userAgent: signals.userAgent || undefined,
        fbp: body.fbp || signals.fbp || undefined,
        fbc: body.fbc || signals.fbc || undefined,
        externalId: body.externalId || undefined,
      },
      customData: {
        content_ids: items.map((i: any) => i.id),
        contents: items.map((i: any) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
        content_type: "product",
        num_items: items.reduce((s: number, i: any) => s + (Number(i.qty) || 0), 0),
        value: total,
        currency: "INR",
      },
    });

    res.status(200).json({ txnid, total });
  } catch (err) {
    console.error("checkout/cod: unexpected error", err);
    res.status(500).json({ error: "Something went wrong while placing your order. Please try again." });
  }
}
