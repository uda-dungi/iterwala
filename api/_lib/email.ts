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
