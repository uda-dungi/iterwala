/**
 * Shiprocket integration — SERVER-ONLY.
 *
 * Docs: https://apidocs.shiprocket.in/
 *
 * Credentials (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD) must never be prefixed with
 * VITE_ — that prefix bundles a value straight into the public JS, which would hand
 * the Shiprocket account password to anyone who opens devtools. Every call here runs
 * from a Vercel serverless function, never from src/.
 *
 * Best-effort by design, same reason api/_lib/email.ts is: a Shiprocket outage or a
 * misconfigured pickup location must never block a customer's order from actually
 * being placed. Every export here catches its own errors and returns nulls on
 * failure instead of throwing.
 */

const LOGIN_URL = "https://apiv2.shiprocket.in/v1/external/auth/login";
const ORDER_CREATE_URL = "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc";

export function isShiprocketConfigured(): boolean {
  return Boolean(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

// Shiprocket tokens are valid ~10 days. Cached in-memory per warm serverless instance so
// a burst of COD orders doesn't re-authenticate on every request; a cold start just logs
// in again. Refreshed a little early (9 days) rather than racing the real expiry.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getShiprocketToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  try {
    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    if (!res.ok) {
      console.error("shiprocket: login failed", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = await res.json();
    if (!data?.token) {
      console.error("shiprocket: login response had no token");
      return null;
    }
    cachedToken = { token: data.token, expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000 };
    return cachedToken.token;
  } catch (err) {
    console.error("shiprocket: login request threw", err);
    return null;
  }
}

export type ShiprocketOrderInput = {
  txnid: string;
  createdAt: string; // ISO timestamp
  customerName: string;
  email: string;
  phone: string;
  address: { line1?: string; city?: string; state?: string; pin?: string; country?: string } | null | undefined;
  items: { name?: string; id?: string; qty: number; price: number }[];
  subtotal: number;
  total: number;
  paymentMethod: "cod" | "payu";
};

export type ShiprocketOrderResult = { orderId: string | null; shipmentId: string | null };

/** Creates an order in Shiprocket so it shows up ready to ship in their dashboard.
 *  Best-effort — returns nulls on any failure (including "not configured") rather
 *  than throwing, so a Shiprocket outage never blocks the order itself. */
export async function createShiprocketOrder(order: ShiprocketOrderInput): Promise<ShiprocketOrderResult> {
  const empty: ShiprocketOrderResult = { orderId: null, shipmentId: null };
  if (!isShiprocketConfigured()) return empty;

  const token = await getShiprocketToken();
  if (!token) return empty;

  try {
    const a = order.address || {};
    const [firstName, ...rest] = (order.customerName || "Customer").trim().split(/\s+/);

    const payload = {
      order_id: order.txnid,
      order_date: order.createdAt.slice(0, 16).replace("T", " "), // "YYYY-MM-DD HH:mm"
      // Must exactly match a pickup address nickname already configured in the
      // Shiprocket dashboard (Settings → Pickup Addresses) — override via env if the
      // account's pickup location isn't named "Primary".
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
      billing_customer_name: firstName || "Customer",
      billing_last_name: rest.join(" "),
      billing_address: a.line1 || "",
      billing_city: a.city || "",
      billing_pincode: a.pin || "",
      billing_state: a.state || "",
      billing_country: a.country || "India",
      billing_email: order.email,
      billing_phone: order.phone,
      shipping_is_billing: true,
      order_items: order.items.map((i) => ({
        name: i.name || i.id || "Item",
        sku: i.id || "SKU",
        units: i.qty,
        selling_price: i.price,
      })),
      payment_method: order.paymentMethod === "cod" ? "COD" : "Prepaid",
      sub_total: order.subtotal,
      // No per-product weight/dimensions exist in the catalog, so these use a
      // conservative default box size for a perfume/attar order — adjust per-shipment
      // in the Shiprocket dashboard if an order needs a larger box.
      length: 15,
      breadth: 10,
      height: 8,
      weight: 0.5,
    };

    const res = await fetch(ORDER_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("shiprocket: order creation failed", res.status, data);
      return empty;
    }
    return {
      orderId: data?.order_id != null ? String(data.order_id) : null,
      shipmentId: data?.shipment_id != null ? String(data.shipment_id) : null,
    };
  } catch (err) {
    console.error("shiprocket: order creation request threw", err);
    return empty;
  }
}
