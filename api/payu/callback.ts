import { verifyPayuResponseHash } from "../_lib/payu.js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "../_lib/supabaseAdmin.js";
import { sendOrderConfirmationEmail } from "../_lib/email.js";

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
          .select("email, name, items, total")
          .maybeSingle();

        // Awaited (not fire-and-forget): serverless functions can be frozen/killed the
        // moment the response is sent, so a detached promise here might never actually
        // send. sendOrderConfirmationEmail() swallows its own errors and no-ops if
        // Resend isn't configured, so this never throws or blocks the redirect for long.
        if (paid && updated?.email) {
          await sendOrderConfirmationEmail({
            email: updated.email,
            name: updated.name ?? undefined,
            txnid,
            items: Array.isArray(updated.items) ? updated.items : [],
            total: Number(updated.total) || 0,
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
