import { getSupabaseAdmin, isSupabaseAdminConfigured, isAdminEmail } from "../_lib/supabaseAdmin.js";
import { generateInvoicePdf, type InvoiceOrder, type SellerDetails } from "../_lib/invoice.js";

/**
 * Vercel Node.js serverless function — GET /api/admin/invoice?txnid=...
 *
 * Streams back the GST tax invoice PDF for one order. Admin-only: the bearer token is
 * verified server-side and re-checked against the admin allow-list, exactly like
 * api/admin/orders.ts — invoices carry customer names, addresses and phone numbers, so
 * this must never be reachable by a signed-in shopper.
 *
 * The PDF is generated on demand rather than stored: it always reflects current order
 * data, needs no storage bucket, and there's nothing to back up or clean up. The invoice
 * NUMBER is not generated here though — that's assigned once, at payment confirmation,
 * in api/payu/callback.ts, so it stays sequential and stable.
 */

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = String(req.headers?.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
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
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!isAdminEmail(String(sessionUser.user.email).toLowerCase())) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const txnid = String(req.query?.txnid || "").trim();
  if (!txnid) {
    res.status(400).json({ error: "Missing txnid." });
    return;
  }

  try {
    const { data: order, error } = await admin
      .from("orders")
      .select("txnid, invoice_no, invoice_date, created_at, email, phone, name, address, items, subtotal, shipping, gift_wrap, total, status, payu_txn_id")
      .eq("txnid", txnid)
      .maybeSingle();

    if (error || !order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    // A tax invoice records a completed sale — refuse to issue one for an order that was
    // never actually paid, which would put a bogus entry in the GST sequence.
    if (order.status !== "paid") {
      res.status(409).json({ error: `Invoice is only available for paid orders (this one is "${order.status}").` });
      return;
    }

    const seller: SellerDetails = {
      brand: process.env.VITE_BRAND_NAME || "Itrawala",
      address:
        process.env.VITE_BUSINESS_ADDRESS ||
        "Near Agarwal Jain Mandir, 08, Main Market, Sadar Bazar, Deoli, Tonk, Rajasthan, 304804",
      // Same fallback as src/config/site.ts — without it a missing env var would print
      // a blank GSTIN on a legal tax invoice rather than the real one.
      gstin: process.env.VITE_GST || "08ALPPM3755J1ZI",
      email: process.env.VITE_SUPPORT_EMAIL || "itrawalabrand@gmail.com",
      phone: process.env.VITE_SUPPORT_PHONE || "+91 70146 57175",
    };

    // A malformed GSTIN on a tax invoice is a compliance problem — surface it in the logs
    // rather than silently printing an invalid number on a legal document.
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(seller.gstin)) {
      console.warn(`admin/invoice: VITE_GST is not a valid 15-character GSTIN ("${seller.gstin}") — invoices will show an invalid number.`);
    }

    const pdf = await generateInvoicePdf(order as InvoiceOrder, seller);
    const filename = `${(order.invoice_no || order.txnid).replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).end(pdf);
  } catch (err) {
    console.error("admin/invoice: failed to generate invoice", err);
    res.status(500).json({ error: "Could not generate the invoice PDF." });
  }
}
