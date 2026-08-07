import { getSupabaseAdmin, isSupabaseAdminConfigured, isAdminEmail } from "../_lib/supabaseAdmin.js";
import { generateShippingLabelPdf } from "../_lib/shippingLabel.js";
import type { InvoiceOrder, SellerDetails } from "../_lib/invoice.js";

/**
 * Vercel Node.js serverless function — GET /api/admin/label?txnid=...
 *
 * Returns the 4x6 shipping label PDF for one order. Admin-only, verified the same way as
 * api/admin/invoice.ts — labels carry a customer's full name, address and phone, so this
 * must never be reachable by a signed-in shopper.
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
      .select("txnid, invoice_no, created_at, email, phone, name, address, items, total, status")
      .eq("txnid", txnid)
      .maybeSingle();

    if (error || !order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    // Prepaid-only store: nothing ships until the payment actually cleared, so a label
    // for an unpaid order would only ever be printed by mistake.
    if (order.status !== "paid") {
      res.status(409).json({ error: `Shipping label is only available for paid orders (this one is "${order.status}").` });
      return;
    }

    const seller: SellerDetails = {
      brand: process.env.VITE_BRAND_NAME || "Itrawala",
      address:
        process.env.VITE_BUSINESS_ADDRESS ||
        "Near Agarwal Jain Mandir, 08, Main Market, Sadar Bazar, Deoli, Tonk, Rajasthan, 304804",
      gstin: process.env.VITE_GST || "08ALPPM3755J1ZI",
      email: process.env.VITE_SUPPORT_EMAIL || "itrawalabrand@gmail.com",
      phone: process.env.VITE_SUPPORT_PHONE || "+91 70146 57175",
    };

    const pdf = await generateShippingLabelPdf(order as InvoiceOrder, seller);
    const filename = `label-${order.txnid.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).end(pdf);
  } catch (err) {
    console.error("admin/label: failed to generate shipping label", err);
    res.status(500).json({ error: "Could not generate the shipping label PDF." });
  }
}
