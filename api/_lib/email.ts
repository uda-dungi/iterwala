import { Resend } from "resend";

/**
 * Transactional email (order confirmations) via Resend — https://resend.com
 *
 * Setup:
 *  1. Create a free Resend account, verify a sending domain (or use their shared
 *     onboarding domain for testing).
 *  2. Add RESEND_API_KEY and RESEND_FROM_EMAIL to your Vercel project's Environment
 *     Variables (and to .env for local dev).
 *  3. Redeploy. Emails send automatically after a successful PayU payment — no other
 *     code changes needed. If the env vars aren't set, sending is silently skipped
 *     (checkout still works, it just won't email a receipt).
 */

let cached: Resend | null | undefined;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getClient(): Resend | null {
  if (cached !== undefined) return cached;
  cached = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  return cached;
}

type OrderItem = { name?: string; id?: string; qty: number; price: number };

export async function sendOrderConfirmationEmail(order: {
  email: string;
  name?: string;
  txnid: string;
  items: OrderItem[];
  total: number;
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const client = getClient();
  if (!client) return;

  const from = process.env.RESEND_FROM_EMAIL as string;
  const fmt = (n: number) => `Rs ${Number(n).toLocaleString("en-IN")}`;
  const firstName = (order.name || "there").split(" ")[0];

  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${escapeHtml(i.name || i.id || "Item")} × ${i.qty}</td><td style="padding:6px 0;text-align:right;">${fmt(i.price * i.qty)}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2a2420;">
      <h1 style="font-size:22px;">Thank you for your order, ${escapeHtml(firstName)}!</h1>
      <p>Your Itrawala order <strong>#${escapeHtml(order.txnid)}</strong> is confirmed and being prepared for shipping.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        ${rows}
        <tr><td style="padding:10px 0;border-top:1px solid #ddd;font-weight:bold;">Total</td><td style="padding:10px 0;border-top:1px solid #ddd;text-align:right;font-weight:bold;">${fmt(order.total)}</td></tr>
      </table>
      <p style="font-size:13px;color:#777;">We'll send another email once your order ships. Questions? Just reply to this email.</p>
    </div>
  `;

  try {
    await client.emails.send({
      from,
      to: order.email,
      subject: `Your Itrawala order is confirmed — #${order.txnid}`,
      html,
    });
  } catch (err) {
    // Never let an email failure break the checkout/redirect flow.
    console.error("email:sendOrderConfirmationEmail failed", err);
  }
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

/* ── dispatch + internal notifications ─────────────────────────────────────── */

type Attachment = { filename: string; content: Buffer };

const money = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

/** Shared shell so all three emails look like the same brand rather than three
 *  different systems. Plain inline CSS — email clients ignore stylesheets. */
function wrap(inner: string): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;color:#2a2420;">${inner}</div>`;
}

function itemRows(items: OrderItem[]): string {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${escapeHtml(i.name || i.id || "Item")} × ${i.qty}</td>` +
        `<td style="padding:6px 0;text-align:right;">${money(i.price * i.qty)}</td></tr>`
    )
    .join("");
}

/**
 * Tells the shop a paid order has landed, with the invoice and shipping label already
 * attached so fulfilment needs no trip to the dashboard — open the mail, print both.
 *
 * Sent from the PayU callback. Best-effort like every other side effect there: a
 * failure is logged and swallowed, never allowed to affect the customer's redirect.
 */
export async function sendAdminOrderNotification(order: {
  to: string;
  txnid: string;
  invoiceNo?: string | null;
  name?: string;
  email: string;
  phone?: string;
  address?: Record<string, any> | null;
  items: OrderItem[];
  total: number;
  attachments?: Attachment[];
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const client = getClient();
  if (!client) return;

  const a = order.address ?? {};
  const addressLines = [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(", "), a.pincode]
    .filter(Boolean)
    .map((l: string) => escapeHtml(String(l)))
    .join("<br>");

  const html = wrap(`
    <h1 style="font-size:20px;margin-bottom:4px;">New paid order — #${escapeHtml(order.txnid)}</h1>
    ${order.invoiceNo ? `<p style="margin-top:0;color:#777;font-size:13px;">Invoice ${escapeHtml(order.invoiceNo)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${itemRows(order.items)}
      <tr><td style="padding:10px 0;border-top:1px solid #ddd;font-weight:bold;">Total</td>
          <td style="padding:10px 0;border-top:1px solid #ddd;text-align:right;font-weight:bold;">${money(order.total)}</td></tr>
    </table>
    <h2 style="font-size:15px;margin-bottom:6px;">Ship to</h2>
    <p style="margin:0 0 16px;line-height:1.6;">
      ${escapeHtml(order.name || "—")}<br>${addressLines || "—"}<br>
      ${escapeHtml(order.phone || "")}<br>${escapeHtml(order.email)}
    </p>
    <p style="font-size:13px;color:#777;">Invoice and shipping label are attached. Add the tracking ID in the admin dashboard once the courier has collected it — that sends the customer their dispatch email.</p>
  `);

  try {
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: order.to,
      subject: `New order #${order.txnid} — ${money(order.total)}`,
      html,
      attachments: order.attachments?.map((f) => ({ filename: f.filename, content: f.content })),
    });
  } catch (err) {
    console.error("email:sendAdminOrderNotification failed", err);
  }
}

/**
 * Tells the customer their parcel is on its way, with the tracking reference and the
 * tax invoice attached.
 *
 * Sent when the admin saves a tracking ID. Unlike the notification above this one is
 * customer-facing, so the caller records shipped_email_sent_at and will not call again
 * for the same order — a duplicate "your order has shipped" reads as a second parcel.
 */
export async function sendShippedEmail(order: {
  email: string;
  name?: string;
  txnid: string;
  trackingId: string;
  carrier?: string | null;
  trackingUrl?: string | null;
  items: OrderItem[];
  total: number;
  attachments?: Attachment[];
}): Promise<void> {
  if (!isEmailConfigured()) return;
  const client = getClient();
  if (!client) return;

  const firstName = (order.name || "there").split(" ")[0];
  const carrier = order.carrier?.trim();

  const html = wrap(`
    <h1 style="font-size:22px;">Your order is on its way, ${escapeHtml(firstName)}!</h1>
    <p>Order <strong>#${escapeHtml(order.txnid)}</strong> has been dispatched.</p>
    <div style="border:1px solid #e6ded3;background:#faf7f2;padding:16px;margin:20px 0;">
      ${carrier ? `<p style="margin:0 0 6px;font-size:13px;color:#777;">${escapeHtml(carrier)}</p>` : ""}
      <p style="margin:0;font-size:13px;color:#777;">Tracking number</p>
      <p style="margin:4px 0 0;font-size:19px;font-weight:bold;letter-spacing:0.5px;">${escapeHtml(order.trackingId)}</p>
      ${
        order.trackingUrl
          ? `<p style="margin:14px 0 0;"><a href="${escapeHtml(order.trackingUrl)}" style="background:#c9a227;color:#1a1512;padding:10px 18px;text-decoration:none;font-size:13px;display:inline-block;">Track your parcel</a></p>`
          : ""
      }
    </div>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      ${itemRows(order.items)}
      <tr><td style="padding:10px 0;border-top:1px solid #ddd;font-weight:bold;">Total</td>
          <td style="padding:10px 0;border-top:1px solid #ddd;text-align:right;font-weight:bold;">${money(order.total)}</td></tr>
    </table>
    <p style="font-size:13px;color:#777;">Your tax invoice is attached. Tracking can take a few hours to show its first scan after the courier collects the parcel. Questions? Just reply to this email.</p>
  `);

  try {
    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: order.email,
      subject: `Your Itrawala order has shipped — #${order.txnid}`,
      html,
      attachments: order.attachments?.map((f) => ({ filename: f.filename, content: f.content })),
    });
  } catch (err) {
    console.error("email:sendShippedEmail failed", err);
  }
}
