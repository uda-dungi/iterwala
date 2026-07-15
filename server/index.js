import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import {
  generatePayuHash,
  generateTxnId,
  getPayuMode,
  isPayuConfigured,
  verifyPayuResponseHash,
  PAYU_ACTION_URL,
} from "./lib/payu.js";
import { ensureCustomerAccount, getSupabaseAdmin, isSupabaseAdminConfigured } from "./lib/supabaseAdmin.js";

// Loads .env when present (local dev / a Hostinger app that ships its own .env file).
// On Hostinger's hPanel Node.js App screen you can instead set these as real
// environment variables for the app — those already win over anything in .env.
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "..", "dist");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", true); // Hostinger sits behind a proxy — needed for correct req.protocol / host

app.use(express.json({ limit: "1mb" }));
// PayU posts its callback as application/x-www-form-urlencoded, not JSON.
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

function getOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

// ── POST /api/checkout/initiate ──────────────────────────────────────────
app.post("/api/checkout/initiate", async (req, res) => {
  if (!isPayuConfigured()) {
    res.status(503).json({
      error:
        "Payments aren't live yet — add PAYU_MERCHANT_KEY and PAYU_SALT in the server's environment variables to enable checkout.",
    });
    return;
  }

  try {
    const body = req.body || {};
    const { customer, address, items, amounts } = body;

    if (!customer?.email || !customer?.firstName || !customer?.phone) {
      res.status(400).json({ error: "Missing required contact details." });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty." });
      return;
    }
    const total = Number(amounts?.total);
    if (!total || total <= 0) {
      res.status(400).json({ error: "Invalid order total." });
      return;
    }

    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_SALT;
    const mode = getPayuMode();
    const txnid = generateTxnId();
    const amount = total.toFixed(2);
    const productinfo = `Itrawala order — ${items.length} item${items.length > 1 ? "s" : ""}`.slice(0, 100);
    const firstname = String(customer.firstName).slice(0, 60);
    const email = String(customer.email).trim().toLowerCase();
    const phone = String(customer.phone).replace(/\D/g, "").slice(0, 15);

    const callbackUrl = `${getOrigin(req)}/api/payu/callback`;

    // Best-effort: silently create/find an account for this email and persist the order.
    // Checkout still works even if Supabase isn't configured — it just won't have order history.
    let userId = null;
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
          subtotal: amounts?.subtotal ?? null,
          shipping: amounts?.shipping ?? null,
          gift_wrap: Boolean(amounts?.gift),
          total,
          status: "pending",
        });
        if (insertError) console.error("checkout/initiate: order insert failed", insertError.message);
      }
    }

    const hash = generatePayuHash({ key, txnid, amount, productinfo, firstname, email, udf1: phone }, salt);

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
});

// ── POST /api/payu/callback ──────────────────────────────────────────────
// PayU posts the payment result here (both success and failure land on the same URL;
// the `status` field tells them apart). We verify the response hash, update the order,
// then redirect the customer's browser to a friendly confirmation page.
app.post("/api/payu/callback", async (req, res) => {
  const origin = getOrigin(req);

  try {
    const body = req.body || {};
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
    } = body;

    const salt = process.env.PAYU_SALT;
    const key = process.env.PAYU_MERCHANT_KEY;
    const udf1 = body.udf1 || "";

    const validHash = salt && key && txnid
      ? verifyPayuResponseHash({ key, txnid, amount, productinfo, firstname, email, udf1, status, hash }, salt)
      : false;

    const paid = validHash && status === "success";

    if (isSupabaseAdminConfigured() && txnid) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await admin
          .from("orders")
          .update({
            status: paid ? "paid" : "failed",
            payu_txn_id: mihpayid || null,
            payu_mode: body.mode || null,
            updated_at: new Date().toISOString(),
          })
          .eq("txnid", txnid);
      }
    }

    if (!validHash) {
      console.error("payu/callback: hash verification failed for txnid", txnid);
    }

    const redirectUrl = paid
      ? `${origin}/order/success?txnid=${encodeURIComponent(txnid || "")}`
      : `${origin}/order/failed?txnid=${encodeURIComponent(txnid || "")}&reason=${encodeURIComponent(error_Message || status || "payment_failed")}`;

    res.redirect(302, redirectUrl);
  } catch (err) {
    console.error("payu/callback: unexpected error", err);
    res.redirect(302, `${origin}/order/failed`);
  }
});

// Simple health check — useful to confirm the Node app is actually running on Hostinger
// (visit https://your-domain/api/health) and that env vars loaded correctly.
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    payuConfigured: isPayuConfigured(),
    payuMode: getPayuMode(),
    supabaseConfigured: isSupabaseAdminConfigured(),
  });
});

// ── Serve the built frontend (npm run build → dist/) ─────────────────────
app.use(express.static(DIST_DIR));
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(DIST_DIR, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Itrawala server listening on port ${PORT}`);
  console.log(`PayU configured: ${isPayuConfigured()} · mode: ${getPayuMode()}`);
});
