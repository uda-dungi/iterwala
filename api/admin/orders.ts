import { getSupabaseAdmin, isSupabaseAdminConfigured, isAdminEmail } from "../_lib/supabaseAdmin.js";
import { sendShippedEmail } from "../_lib/email.js";
import { generateInvoicePdf, getSellerDetails, type InvoiceOrder } from "../_lib/invoice.js";

function unauthorized(res: any) {
  res.status(401).json({ error: "Unauthorized" });
}

function forbidden(res: any) {
  res.status(403).json({ error: "Forbidden" });
}

function methodNotAllowed(res: any) {
  res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    methodNotAllowed(res);
    return;
  }

  const authHeader = String(req.headers?.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    unauthorized(res);
    return;
  }

  if (!isSupabaseAdminConfigured()) {
    res.status(503).json({ error: "Server is not configured for Supabase admin access." });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    res.status(503).json({ error: "Could not create Supabase admin client." });
    return;
  }

  const { data: sessionUser, error: userError } = await admin.auth.getUser(token);
  if (userError || !sessionUser?.user?.email) {
    unauthorized(res);
    return;
  }

  const email = String(sessionUser.user.email).toLowerCase();
  if (!isAdminEmail(email)) {
    forbidden(res);
    return;
  }

  /* ── save dispatch tracking ─────────────────────────────────────────────── */
  if (req.method === "PATCH") {
    const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
    const txnid = String(body.txnid || "").trim();
    const trackingId = String(body.tracking_id || "").trim();
    const carrier = String(body.carrier || "").trim() || null;
    const trackingUrl = String(body.tracking_url || "").trim() || null;

    if (!txnid) {
      res.status(400).json({ error: "txnid is required" });
      return;
    }
    if (!trackingId) {
      res.status(400).json({ error: "Tracking ID is required" });
      return;
    }
    if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
      res.status(400).json({ error: "Tracking URL must start with http:// or https://" });
      return;
    }

    const { data: order, error: readErr } = await admin
      .from("orders")
      .select("txnid, email, name, phone, address, items, subtotal, shipping, gift_wrap, total, status, created_at, invoice_no, invoice_date, payu_txn_id, shipped_email_sent_at")
      .eq("txnid", txnid)
      .maybeSingle();

    if (readErr && /does not exist|schema cache/i.test(readErr.message || "")) {
      // Distinguish "migration not run" from "no such order" — otherwise this reports a
      // missing order for one that is sitting right there in the dashboard.
      res.status(503).json({
        error: "Tracking isn't set up yet — run migration-order-tracking.sql in Supabase, then try again.",
      });
      return;
    }
    if (readErr || !order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    // Dispatching something that was never paid for would send a shipping confirmation
    // for an order that does not exist commercially.
    if (order.status !== "paid") {
      res.status(409).json({ error: `Only paid orders can be dispatched (this one is "${order.status}").` });
      return;
    }

    const { error: updErr } = await admin
      .from("orders")
      .update({
        tracking_id: trackingId,
        carrier,
        tracking_url: trackingUrl,
        dispatched_at: new Date().toISOString(),
      })
      .eq("txnid", txnid);

    if (updErr) {
      console.error("api/admin/orders: tracking update failed", updErr.message);
      if (/does not exist|schema cache/i.test(updErr.message || "")) {
        res.status(503).json({
          error: "Tracking isn't set up yet — run migration-order-tracking.sql in Supabase, then try again.",
        });
        return;
      }
      res.status(500).json({ error: "Could not save tracking details." });
      return;
    }

    // Email the customer once. Re-saving to correct a typo updates the record but does
    // not re-send: a second "your order has shipped" reads as a second parcel. The
    // response says which happened so the dashboard can be honest about it.
    let emailed = false;
    if (!order.shipped_email_sent_at) {
      try {
        const invoicePdf = await generateInvoicePdf(
          { ...(order as InvoiceOrder), txnid },
          getSellerDetails()
        );
        await sendShippedEmail({
          email: order.email,
          name: order.name ?? undefined,
          txnid,
          trackingId,
          carrier,
          trackingUrl,
          items: Array.isArray(order.items) ? order.items : [],
          total: Number(order.total) || 0,
          attachments: [
            { filename: `${(order.invoice_no || txnid).replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`, content: invoicePdf },
          ],
        });
        await admin
          .from("orders")
          .update({ shipped_email_sent_at: new Date().toISOString() })
          .eq("txnid", txnid);
        emailed = true;
      } catch (err) {
        // Tracking is already saved, so this is recoverable — the admin can re-save to
        // retry rather than losing the courier reference.
        console.error("api/admin/orders: shipped email failed", err);
      }
    }

    res.status(200).json({ ok: true, emailed, alreadyEmailed: Boolean(order.shipped_email_sent_at) });
    return;
  }

  // The dispatch columns arrive with migration-order-tracking.sql. Selecting them
  // before that migration has run makes Postgres reject the whole query, which would
  // take the entire orders dashboard down — not just the tracking feature — for anyone
  // who deploys the code before running the SQL. So try the full projection, and fall
  // back to the base one if those columns aren't there yet.
  const BASE_COLUMNS =
    "id, txnid, created_at, updated_at, user_id, email, phone, name, address, items, subtotal, shipping, gift_wrap, total, status, payu_txn_id, payu_mode, invoice_no, invoice_date";
  const DISPATCH_COLUMNS = "tracking_id, carrier, tracking_url, dispatched_at, shipped_email_sent_at";

  let { data, error } = await admin
    .from("orders")
    .select(`${BASE_COLUMNS}, ${DISPATCH_COLUMNS}`)
    .order("created_at", { ascending: false });

  let dispatchReady = !error;
  if (error && /does not exist|schema cache/i.test(error.message || "")) {
    console.warn(
      "api/admin/orders: dispatch columns missing — run migration-order-tracking.sql. Serving orders without tracking."
    );
    ({ data, error } = await admin
      .from("orders")
      .select(BASE_COLUMNS)
      .order("created_at", { ascending: false }));
    dispatchReady = false;
  }

  if (error) {
    console.error("api/admin/orders: failed to fetch orders", error.message, error.details);
    res.status(500).json({
      error: "Failed to load orders.",
      details: error.message || error.details || "Unknown database error.",
    });
    return;
  }

  res.status(200).json({ orders: data || [], dispatchReady });
}

function safeJson(raw: string): Record<string, any> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
