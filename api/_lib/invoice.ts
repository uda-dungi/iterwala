import PDFDocument from "pdfkit";

/**
 * GST Tax Invoice PDF generation (owner/accounting copy, served from the admin panel).
 *
 * Tax model: catalogue prices are GST-INCLUSIVE ("Inclusive of all taxes" on the product
 * page), so the taxable value is back-calculated out of the amount actually charged
 * rather than added on top. Perfumes/attars fall under HSN 3303 at 18% GST.
 *
 * Place of supply decides the split: an order shipped inside the seller's own state is
 * intra-state (CGST 9% + SGST 9%); anywhere else in India is inter-state (IGST 18%).
 *
 * Currency is rendered as "Rs." rather than the ₹ glyph on purpose — PDF's standard
 * Helvetica has no rupee sign, so ₹ would silently render as garbage. Matching what the
 * order-confirmation email already does (api/_lib/email.ts).
 */

const GST_RATE = 0.18;
const HSN_CODE = "3303"; // Perfumes and toilet waters
const SELLER_STATE = "Rajasthan";
const SELLER_STATE_CODE = "08";

export type InvoiceOrder = {
  txnid: string;
  invoice_no?: string | null;
  invoice_date?: string | null;
  created_at?: string | null;
  email: string;
  phone?: string | null;
  name?: string | null;
  address?: { line1?: string; city?: string; state?: string; pin?: string; country?: string } | null;
  items: { id?: string; name?: string; qty: number; price: number }[];
  subtotal?: number | null;
  shipping?: number | null;
  gift_wrap?: boolean | null;
  total: number;
  payu_txn_id?: string | null;
};

export type SellerDetails = { brand: string; address: string; gstin: string; email: string; phone: string };

const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Loose match so "rajasthan", "RAJASTHAN ", "Rajasthan." all count as intra-state. */
const isIntraState = (buyerState?: string | null) =>
  Boolean(buyerState && buyerState.trim().toLowerCase().replace(/[^a-z]/g, "") === SELLER_STATE.toLowerCase());

/** Indian financial year label for an invoice date, e.g. "2026-27" (FY runs Apr–Mar). */
export function financialYear(d: Date): string {
  const y = d.getFullYear();
  return d.getMonth() + 1 >= 4 ? `${y}-${String((y + 1) % 100).padStart(2, "0")}` : `${y - 1}-${String(y % 100).padStart(2, "0")}`;
}

export function computeInvoiceTax(order: InvoiceOrder) {
  const giftFee = order.gift_wrap ? 49 : 0;
  const shipping = Number(order.shipping) || 0;
  const merchandise = Number(order.subtotal) || 0;
  const grandTotal = Number(order.total) || 0;

  // Discount isn't stored as its own column — it's whatever the charged total is short of
  // merchandise + shipping + gift wrap (see api/checkout/initiate.ts).
  const discount = round2(Math.max(0, merchandise + shipping + giftFee - grandTotal));

  // Everything above is tax-inclusive, so strip the GST back out of the charged total.
  const taxableValue = round2(grandTotal / (1 + GST_RATE));
  const totalTax = round2(grandTotal - taxableValue);
  const intra = isIntraState(order.address?.state);

  return {
    merchandise: round2(merchandise),
    discount,
    shipping: round2(shipping),
    giftFee,
    taxableValue,
    totalTax,
    cgst: intra ? round2(totalTax / 2) : 0,
    sgst: intra ? round2(totalTax - round2(totalTax / 2)) : 0, // remainder avoids a 1-paisa drift
    igst: intra ? 0 : totalTax,
    intra,
    grandTotal: round2(grandTotal),
  };
}

/** Amount in words — standard on Indian invoices. Indian numbering (crore/lakh). */
export function amountInWords(amount: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
  const three = (n: number): string => (n >= 100 ? `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));

  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  if (whole === 0 && paise === 0) return "Zero Rupees Only";

  let n = whole;
  const parts: string[] = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${three(lakh)} Lakh`);
  if (thousand) parts.push(`${three(thousand)} Thousand`);
  if (n) parts.push(three(n));

  const rupees = parts.length ? `${parts.join(" ")} Rupees` : "";
  const paisePart = paise ? `${rupees ? " and " : ""}${two(paise)} Paise` : "";
  return `${rupees}${paisePart} Only`.trim();
}

/** Renders the invoice and resolves with the finished PDF bytes. */
export function generateInvoicePdf(order: InvoiceOrder, seller: SellerDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 42 });
      const chunks: Buffer[] = [];
      doc.on("data", (c: Buffer) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const t = computeInvoiceTax(order);
      const issued = order.invoice_date ? new Date(order.invoice_date) : order.created_at ? new Date(order.created_at) : new Date();
      const dateStr = issued.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const L = doc.page.margins.left;
      const R = doc.page.width - doc.page.margins.right;
      const GOLD = "#8a6d3b";
      const DARK = "#2a2420";
      const MUTED = "#6b6259";

      // ── Header ────────────────────────────────────────────────────────────
      doc.fillColor(DARK).fontSize(20).font("Helvetica-Bold").text(seller.brand.toUpperCase(), L, 44);
      doc.fontSize(8).font("Helvetica").fillColor(MUTED)
        .text(seller.address, L, 70, { width: 300 })
        .text(`GSTIN: ${seller.gstin}`, { width: 300 })
        .text(`${seller.email}  |  ${seller.phone}`, { width: 300 });

      doc.fontSize(16).font("Helvetica-Bold").fillColor(GOLD).text("TAX INVOICE", R - 200, 46, { width: 200, align: "right" });
      doc.fontSize(8).font("Helvetica").fillColor(DARK)
        .text(`Invoice No: ${order.invoice_no || "—"}`, R - 200, 70, { width: 200, align: "right" })
        .text(`Invoice Date: ${dateStr}`, { width: 200, align: "right" })
        .text(`Order Ref: ${order.txnid}`, { width: 200, align: "right" });
      if (order.payu_txn_id) doc.text(`Payment Ref: ${order.payu_txn_id}`, { width: 200, align: "right" });

      let y = 128;
      doc.moveTo(L, y).lineTo(R, y).lineWidth(1).strokeColor(GOLD).stroke();
      y += 14;

      // ── Bill to ───────────────────────────────────────────────────────────
      const a = order.address || {};
      const buyerState = a.state || "—";
      doc.fontSize(9).font("Helvetica-Bold").fillColor(DARK).text("BILL TO / SHIP TO", L, y);
      doc.font("Helvetica").fontSize(9).fillColor(DARK).text(order.name || "—", L, y + 14);
      doc.fontSize(8).fillColor(MUTED)
        .text([a.line1, a.city, `${buyerState}${a.pin ? " - " + a.pin : ""}`, a.country].filter(Boolean).join(", "), L, y + 27, { width: 280 });
      doc.text(`${order.email}${order.phone ? "  |  " + order.phone : ""}`, L, doc.y + 2, { width: 280 });

      doc.fontSize(8).fillColor(DARK)
        .text(`Place of Supply: ${buyerState}${t.intra ? ` (${SELLER_STATE_CODE})` : ""}`, R - 200, y + 14, { width: 200, align: "right" })
        .text(`Supply Type: ${t.intra ? "Intra-State" : "Inter-State"}`, R - 200, doc.y, { width: 200, align: "right" })
        .text("Reverse Charge: No", R - 200, doc.y, { width: 200, align: "right" });

      y = Math.max(doc.y, y + 60) + 12;

      // ── Item table ────────────────────────────────────────────────────────
      const cols = { sn: L, desc: L + 24, hsn: L + 268, qty: L + 320, rate: L + 358, amt: L + 432 };
      const wRate = 68, wAmt = R - cols.amt;

      doc.rect(L, y, R - L, 18).fill("#f4f0e9");
      doc.fillColor(DARK).fontSize(8).font("Helvetica-Bold");
      doc.text("#", cols.sn + 4, y + 5);
      doc.text("DESCRIPTION", cols.desc, y + 5);
      doc.text("HSN", cols.hsn, y + 5);
      doc.text("QTY", cols.qty, y + 5);
      doc.text("RATE", cols.rate, y + 5, { width: wRate, align: "right" });
      doc.text("AMOUNT", cols.amt, y + 5, { width: wAmt, align: "right" });
      y += 20;

      doc.font("Helvetica").fontSize(8).fillColor(DARK);
      (order.items || []).forEach((it, i) => {
        if (y > doc.page.height - 220) { doc.addPage(); y = 50; }
        const lineAmt = (Number(it.price) || 0) * (Number(it.qty) || 0);
        const name = it.name || it.id || "Item";
        const h = Math.max(14, doc.heightOfString(name, { width: cols.hsn - cols.desc - 8 }) + 4);
        doc.text(String(i + 1), cols.sn + 4, y);
        doc.text(name, cols.desc, y, { width: cols.hsn - cols.desc - 8 });
        doc.text(HSN_CODE, cols.hsn, y);
        doc.text(String(it.qty), cols.qty, y);
        doc.text(money(Number(it.price) || 0), cols.rate, y, { width: wRate, align: "right" });
        doc.text(money(lineAmt), cols.amt, y, { width: wAmt, align: "right" });
        y += h;
        doc.moveTo(L, y - 2).lineTo(R, y - 2).lineWidth(0.4).strokeColor("#e6e0d6").stroke();
      });

      // ── Totals ────────────────────────────────────────────────────────────
      if (y > doc.page.height - 210) { doc.addPage(); y = 50; }
      y += 10;
      const labelX = R - 250, valX = R - 110;
      const row = (label: string, val: string, bold = false, color = DARK) => {
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8).fillColor(color);
        doc.text(label, labelX, y, { width: 130, align: "right" });
        doc.text(val, valX, y, { width: 110, align: "right" });
        y += 14;
      };

      row("Subtotal", money(t.merchandise));
      if (t.discount > 0) row("Discount", `- ${money(t.discount)}`, false, GOLD);
      row("Shipping", t.shipping > 0 ? money(t.shipping) : "FREE");
      if (t.giftFee > 0) row("Gift Wrapping", money(t.giftFee));

      y += 4;
      doc.moveTo(labelX, y - 2).lineTo(R, y - 2).lineWidth(0.5).strokeColor("#cfc6b8").stroke();
      y += 4;

      row("Taxable Value", money(t.taxableValue));
      if (t.intra) {
        row("CGST @ 9%", money(t.cgst));
        row("SGST @ 9%", money(t.sgst));
      } else {
        row("IGST @ 18%", money(t.igst));
      }

      y += 4;
      doc.moveTo(labelX, y - 2).lineTo(R, y - 2).lineWidth(1).strokeColor(GOLD).stroke();
      y += 6;
      row("GRAND TOTAL", money(t.grandTotal), true);

      // ── Footer ────────────────────────────────────────────────────────────
      y += 10;
      doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK).text("Amount in Words:", L, y);
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text(amountInWords(t.grandTotal), L, y + 12, { width: 300 });

      const fy = doc.page.height - 92;
      doc.fontSize(7).fillColor(MUTED)
        .text("Prices are inclusive of GST. This is a computer-generated invoice and does not require a physical signature.", L, fy, { width: 320 });
      doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK).text(`For ${seller.brand}`, R - 180, fy, { width: 180, align: "right" });
      doc.font("Helvetica").fontSize(7).fillColor(MUTED).text("Authorised Signatory", R - 180, fy + 34, { width: 180, align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
