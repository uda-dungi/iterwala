import { verifyPayuResponseHash } from "../_lib/payu.js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../_lib/supabaseAdmin.js";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "../_lib/email.js";
import { generateInvoicePdf, getSellerDetails, getAdminNotifyEmail, type InvoiceOrder } from "../_lib/invoice.js";
import { generateShippingLabelPdf } from "../_lib/shippingLabel.js";
import { sendCapiEvent } from "../_lib/metaCapi.js";
import { createShiprocketOrder } from "../_lib/shiprocket.js";

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

// Vercel Node.js serverless function — POST /api/payu/callback
// PayU posts the payment result here (both success and failure land on the same URL;
// the `status` field tells them apart). We verify the response hash, update the order,
// then redirect the customer's browser to a friendly confirmation page.

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host;
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(String(host || ""));
  const proto = (req.headers["x-forwarded-proto"] as string) || (isLocal ? "http" : "https");
  const origin = process.env.SITE_URL || `${proto}://${host}`;

  try {
    const body = parseRequestBody(req.body);
    const {
      txnid = "",
      status = "",
      amount = "",
      productinfo = "",
      firstname = "",
      email = "",
      hash = "",
      mihpayid = "",
      error_Message = "",
      error_message = "",
    } = body;

    const salt = process.env.PAYU_SALT as string;
    const key = process.env.PAYU_MERCHANT_KEY as string;
    const udf1 = body.udf1 || "";

    const validHash = salt && key && txnid
      ? verifyPayuResponseHash({ key, txnid, amount, productinfo, firstname, email, udf1, status, hash }, salt)
      : false;

    const paid = validHash && status === "success";

    if (isSupabaseAdminConfigured() && txnid) {
      const admin = getSupabaseAdmin();
      if (admin) {
        const { data: updated } = await admin
          .from("orders")
          .update({
            status: paid ? "paid" : "failed",
            payu_txn_id: mihpayid || null,
            payu_mode: body.mode || null,
            updated_at: new Date().toISOString(),
          })
          .eq("txnid", txnid)
          // The Meta match signals MUST be in this list. They were missing, so every
          // `updated.fbp` / `.fbc` / `.client_ip` / `.client_ua` / `.external_id` read
          // below silently came back undefined and the Purchase — the one event that
          // actually drives attribution — reached Meta with nothing but a hashed email
          // and phone. The columns exist (supabase-tables.sql) and checkout/initiate.ts
          // populates them; only the projection was short.
          .select("email, phone, name, address, items, subtotal, shipping, gift_wrap, total, status, payu_txn_id, created_at, invoice_no, invoice_date, admin_notified_at, fbp, fbc, client_ip, client_ua, external_id")
          .maybeSingle();

        // Awaited (not fire-and-forget): serverless functions can be frozen/killed the
        // moment the response is sent, so a detached promise here might never actually
        // send. sendOrderConfirmationEmail() and sendCapiEvent() both swallow their own
        // errors and no-op if unconfigured, so neither throws or blocks the redirect.
        // Assign the sequential GST invoice number now that the payment is confirmed —
        // never for failed orders, since GST numbering must not have gaps for sales that
        // never happened. The RPC is idempotent, so a repeated PayU callback is harmless.
        if (paid) {
          const { error: invoiceError } = await admin.rpc("assign_invoice_number", { p_txnid: txnid });
          if (invoiceError) console.error("payu/callback: invoice number assignment failed", invoiceError.message);
        }

        if (paid && updated?.email) {
          // Best-effort — a failed/unconfigured Shiprocket call must never block the
          // customer's redirect (see api/_lib/shiprocket.ts). Stored on the row when it
          // works, same as the COD path in api/checkout/cod.ts.
          const shiprocket = await createShiprocketOrder({
            txnid,
            createdAt: updated.created_at,
            customerName: updated.name ?? "",
            email: updated.email,
            phone: updated.phone ?? "",
            address: updated.address,
            items: Array.isArray(updated.items) ? updated.items : [],
            subtotal: Number(updated.subtotal) || 0,
            total: Number(updated.total) || 0,
            paymentMethod: "payu",
          });
          if (shiprocket.orderId || shiprocket.shipmentId) {
            const { error: shiprocketUpdateError } = await admin
              .from("orders")
              .update({ shiprocket_order_id: shiprocket.orderId, shiprocket_shipment_id: shiprocket.shipmentId })
              .eq("txnid", txnid);
            if (shiprocketUpdateError) console.error("payu/callback: failed to store shiprocket ids", shiprocketUpdateError.message);
          }

          await sendOrderConfirmationEmail({
            email: updated.email,
            name: updated.name ?? undefined,
            txnid,
            items: Array.isArray(updated.items) ? updated.items : [],
            total: Number(updated.total) || 0,
          });

          // Internal dispatch alert, with the invoice and shipping label attached so
          // fulfilment can print both straight from the mail.
          //
          // Guarded on admin_notified_at because PayU can post this callback more than
          // once for the same order. The whole block is wrapped: PDF generation is the
          // only thing in this handler that can throw on malformed order data, and a
          // notification failing must not stop the customer's redirect.
          const notifyTo = getAdminNotifyEmail();
          if (notifyTo && !updated.admin_notified_at) {
            try {
              // Re-read to pick up the invoice number the RPC just assigned.
              const { data: withInvoice } = await admin
                .from("orders")
                .select("invoice_no, invoice_date")
                .eq("txnid", txnid)
                .maybeSingle();

              const full = { ...updated, txnid, ...(withInvoice ?? {}) } as InvoiceOrder;
              const seller = getSellerDetails();
              const [invoicePdf, labelPdf] = await Promise.all([
                generateInvoicePdf(full, seller),
                generateShippingLabelPdf(full, seller),
              ]);

              await sendAdminOrderNotification({
                to: notifyTo,
                txnid,
                invoiceNo: withInvoice?.invoice_no ?? null,
                name: updated.name ?? undefined,
                email: updated.email,
                phone: updated.phone ?? undefined,
                address: (updated.address as Record<string, any>) ?? null,
                items: Array.isArray(updated.items) ? updated.items : [],
                total: Number(updated.total) || 0,
                attachments: [
                  { filename: `${(withInvoice?.invoice_no || txnid).replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`, content: invoicePdf },
                  { filename: `label-${txnid.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`, content: labelPdf },
                ],
              });

              // Stamped only after a successful send, so a failure retries next callback
              // rather than silently marking the shop as notified.
              await admin.from("orders").update({ admin_notified_at: new Date().toISOString() }).eq("txnid", txnid);
            } catch (err) {
              console.error("payu/callback: admin notification failed", err);
            }
          }

          // Meta Conversions API — the server-verified Purchase, sent with the same
          // txnid as the browser Pixel's eventID (src/lib/pixel.ts trackPurchase) so
          // Meta de-dupes the two into one conversion. This is the copy that still
          // lands when the shopper's browser blocks the direct call to Facebook.
          const items = Array.isArray(updated.items) ? updated.items : [];
          await sendCapiEvent({
            eventName: "Purchase",
            eventId: txnid,
            eventSourceUrl: `${origin}/order/success?txnid=${encodeURIComponent(txnid)}`,
            // Signals come from the order row, captured at checkout from the shopper's own
            // browser (api/checkout/initiate.ts). Reading them off `req` here would report
            // PayU's server IP/user-agent and no cookies — a wrong match is worse for Event
            // Match Quality than a missing one.
            user: {
              email: updated.email,
              phone: updated.phone ?? undefined,
              ip: updated.client_ip ?? undefined,
              userAgent: updated.client_ua ?? undefined,
              fbp: updated.fbp ?? undefined,
              fbc: updated.fbc ?? undefined,
              externalId: updated.external_id ?? undefined,
            },
            customData: {
              content_ids: items.map((i: any) => i.id),
              contents: items.map((i: any) => ({ id: i.id, quantity: i.qty, item_price: i.price })),
              content_type: "product",
              num_items: items.reduce((s: number, i: any) => s + (Number(i.qty) || 0), 0),
              value: Number(updated.total) || 0,
              currency: "INR",
            },
          });
        }
      }
    }

    if (!validHash) {
      console.error("payu/callback: hash verification failed for txnid", txnid);
    }

    // Without this, a payment that PayU reported as "success" but whose hash didn't
    // verify redirected to /order/failed?reason=success — a confusing message for the
    // customer and useless for debugging.
    const reason = !validHash
      ? "verification_failed"
      : error_Message || error_message || (status && status !== "success" ? status : "payment_failed");

    const redirectUrl = paid
      ? `${origin}/order/success?txnid=${encodeURIComponent(txnid || "")}`
      : `${origin}/order/failed?txnid=${encodeURIComponent(txnid || "")}&reason=${encodeURIComponent(reason)}`;

    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } catch (err) {
    console.error("payu/callback: unexpected error", err);
    res.writeHead(302, { Location: `${origin}/order/failed` });
    res.end();
  }
}
