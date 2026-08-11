import { verifyPayuResponseHash } from "../_lib/payu.js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../_lib/supabaseAdmin.js";
import { sendOrderConfirmationEmail } from "../_lib/email.js";
import { sendCapiEvent } from "../_lib/metaCapi.js";

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
          .select("email, phone, name, items, total, fbp, fbc, client_ip, client_ua, external_id")
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
          await sendOrderConfirmationEmail({
            email: updated.email,
            name: updated.name ?? undefined,
            txnid,
            items: Array.isArray(updated.items) ? updated.items : [],
            total: Number(updated.total) || 0,
          });

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
