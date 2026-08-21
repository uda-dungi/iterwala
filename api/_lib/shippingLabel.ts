import PDFDocument from "pdfkit";
import type { InvoiceOrder, SellerDetails } from "./invoice.js";

/**
 * Shipping label PDF — the sticker that goes on the parcel for courier pickup.
 *
 * Rendered at 4x6 inch (288x432pt), the standard thermal shipping-label size. It also
 * prints fine on A4: most viewers centre it on the sheet, so a plain office printer works
 * without a label printer.
 *
 * Deliberately carries NO prices or tax detail beyond the one figure a courier actually
 * needs to do their job — a label is read by couriers and handlers, not the buyer's
 * accountant, and printing a full price/tax breakdown on the outside of a parcel invites
 * theft. Full money detail lives on the GST tax invoice (api/_lib/invoice.ts) instead.
 *
 * The banner is not decoration: it tells the courier whether to collect cash. A prepaid
 * order gets "PREPAID - DO NOT COLLECT CASH"; a Cash on Delivery order (order.payment_method
 * === "cod") gets the exact amount to collect instead — the one number that's unavoidable
 * to omit for a COD parcel, industry-standard on every COD shipping label.
 */

const PT = 72; // points per inch
const W = 4 * PT;
const H = 6 * PT;

// PDF's standard Helvetica has no rupee glyph — "Rs." instead of ₹, matching invoice.ts.
const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function generateShippingLabelPdf(order: InvoiceOrder, seller: SellerDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: [W, H], margin: 0 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const M = 14;                  // inner padding
      const CW = W - M * 2;          // content width
      const DARK = "#000000";
      const MUTED = "#555555";

      // Outer cut border
      doc.lineWidth(1).strokeColor(DARK).rect(4, 4, W - 8, H - 8).stroke();

      let y = M + 2;

      // ── FROM ─────────────────────────────────────────────────────────────
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text("FROM", M, y);
      y += 9;
      doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text(seller.brand, M, y, { width: CW });
      y = doc.y + 1;
      doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(seller.address, M, y, { width: CW });
      y = doc.y + 1;
      doc.text(`Ph: ${seller.phone}`, M, y, { width: CW });
      y = doc.y + 8;

      doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.8).strokeColor(DARK).stroke();
      y += 10;

      // ── DELIVER TO (the part couriers actually read — keep it big) ────────
      const a = order.address || {};
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text("DELIVER TO", M, y);
      y += 11;

      doc.fillColor(DARK).font("Helvetica-Bold").fontSize(15).text((order.name || "Customer").toUpperCase(), M, y, { width: CW });
      y = doc.y + 4;

      doc.font("Helvetica").fontSize(11);
      const addrLines = [
        a.line1,
        a.city,
        [a.state, a.pin].filter(Boolean).join(" - "),
        a.country || "India",
      ].filter(Boolean) as string[];
      for (const line of addrLines) {
        doc.text(line, M, y, { width: CW });
        y = doc.y + 1;
      }

      y += 5;
      if (order.phone) {
        doc.font("Helvetica-Bold").fontSize(13).text(`Ph: ${order.phone}`, M, y, { width: CW });
        y = doc.y + 4;
      }

      y += 4;
      doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.8).strokeColor(DARK).stroke();
      y += 10;

      // ── PREPAID / COD banner ─────────────────────────────────────────────
      const isCod = order.payment_method === "cod";
      const bannerText = isCod
        ? `COD - COLLECT ${money(order.total)}`
        : "PREPAID - DO NOT COLLECT CASH";
      const bannerH = 26;
      doc.rect(M, y, CW, bannerH).fill(DARK);
      doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(isCod ? 10 : 11)
        .text(bannerText, M, y + 8, { width: CW, align: "center" });
      y += bannerH + 12;

      // ── Order details ────────────────────────────────────────────────────
      const itemCount = (order.items || []).reduce((s, i) => s + (Number(i.qty) || 0), 0);
      const placed = order.created_at ? new Date(order.created_at) : new Date();
      const rows: [string, string][] = [
        ["Order Ref", order.txnid],
        ["Invoice No", order.invoice_no || "-"],
        ["Date", placed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })],
        ["Items", `${itemCount} unit${itemCount === 1 ? "" : "s"}`],
      ];
      doc.font("Helvetica").fontSize(8);
      for (const [k, v] of rows) {
        doc.fillColor(MUTED).text(k, M, y, { width: 60 });
        doc.fillColor(DARK).font("Helvetica-Bold").text(v, M + 62, y, { width: CW - 62 });
        doc.font("Helvetica");
        y = doc.y + 3;
      }

      // ── Contents (helps the packer load the right box) ────────────────────
      y += 6;
      doc.moveTo(M, y).lineTo(W - M, y).lineWidth(0.4).strokeColor("#999999").stroke();
      y += 7;
      doc.fillColor(MUTED).font("Helvetica-Bold").fontSize(7).text("CONTENTS", M, y);
      y += 9;
      doc.font("Helvetica").fontSize(7.5).fillColor(DARK);
      for (const it of (order.items || []).slice(0, 8)) {
        if (y > H - 40) break; // never spill past the label edge
        doc.text(`${it.qty} x ${it.name || it.id || "Item"}`, M, y, { width: CW, ellipsis: true, height: 10 });
        y = doc.y + 1;
      }
      if ((order.items || []).length > 8) {
        doc.fillColor(MUTED).text(`+ ${(order.items || []).length - 8} more`, M, y, { width: CW });
      }

      // ── Footer ────────────────────────────────────────────────────────────
      doc.fillColor(MUTED).font("Helvetica").fontSize(6.5)
        .text(`Returns: ${seller.email}`, M, H - M - 8, { width: CW, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
