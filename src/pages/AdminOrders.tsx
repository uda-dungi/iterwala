import { useEffect, useMemo, useState } from "react";
import { Loader2, Database, Mail, Package, ShieldCheck, FileDown, Truck } from "lucide-react";
import { useAuth } from "@/store/auth";
import { formatINR } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";
import { toast } from "sonner";

type OrderRow = {
  id: string;
  txnid: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  email: string;
  phone: string | null;
  name: string | null;
  address: { line1?: string; city?: string; state?: string; pin?: string; country?: string };
  items: { name?: string; price?: number; qty: number }[];
  subtotal: number;
  shipping: number;
  gift_wrap: boolean;
  total: number;
  status: string;
  payu_txn_id: string | null;
  payu_mode: string | null;
  invoice_no: string | null;
  invoice_date: string | null;
  tracking_id: string | null;
  carrier: string | null;
  tracking_url: string | null;
  dispatched_at: string | null;
  shipped_email_sent_at: string | null;
};

export default function AdminOrders() {
  const { user, session } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // False until migration-order-tracking.sql has been run; the API reports it so the
  // dispatch UI can explain itself rather than failing on save.
  const [dispatchReady, setDispatchReady] = useState(true);

  const fetchOrders = useMemo(
    () => async () => {
      setError(null);
      try {
        const token = session?.access_token;
        if (!token) {
          setError("Invalid session. Please sign in again.");
          setOrders([]);
          return;
        }
        const res = await fetch("/api/admin/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(
            `${data.error || "Failed to load orders."}${data.details ? ` (${data.details})` : ""}`
          );
          setOrders([]);
        } else {
          setOrders(data.orders || []);
          setDispatchReady(data.dispatchReady !== false);
        }
      } catch (err) {
        console.error(err);
        setError("Unable to contact the server. Please refresh.");
      }
    },
    [session?.access_token]
  );

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [user, fetchOrders]);

  // The invoice endpoint is admin-authenticated, so a plain <a href> won't work — it
  // can't carry the bearer token. Fetch it, then hand the browser a blob to save.
  // Tracks "<txnid>:<kind>" so only the button actually clicked shows a spinner.
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadDoc = async (order: OrderRow, kind: "invoice" | "label") => {
    const token = session?.access_token;
    if (!token) { toast.error("Session expired. Please sign in again."); return; }
    const label = kind === "invoice" ? "invoice" : "shipping label";
    setDownloading(`${order.txnid}:${kind}`);
    try {
      const res = await fetch(`/api/admin/${kind}?txnid=${encodeURIComponent(order.txnid)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Errors come back as JSON even though the success path is a PDF.
        const msg = await res.json().catch(() => ({}));
        toast.error(msg.error || `Could not generate ${label} (${res.status}).`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = kind === "invoice" ? (order.invoice_no || order.txnid) : `label-${order.txnid}`;
      a.download = `${base.replace(/[^A-Za-z0-9._-]/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(`Network error while downloading the ${label}.`);
    } finally {
      setDownloading(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-8 md:p-12 flex justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Purchase Data</p>
          <h1 className="font-display text-3xl sm:text-4xl text-ivory mt-2">All Orders</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {orders?.length ?? 0} order{(orders?.length ?? 0) === 1 ? "" : "s"} total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline-gold" size="lg" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Refresh"}
          </Button>
          <Button variant="luxury" size="lg" asChild>
            <a href={`mailto:${site.email}?subject=Admin%20Dashboard%20Query`}>Contact Owner</a>
          </Button>
        </div>
      </div>

      {error && <div className="luxury-card p-4 mb-6 border border-destructive text-destructive">{error}</div>}

      {!dispatchReady && (
        <div className="luxury-card p-4 mb-6 border border-primary/40 text-sm text-muted-foreground">
          <span className="text-primary">Dispatch tracking isn't enabled yet.</span>{" "}
          Run <code className="text-ivory">migration-order-tracking.sql</code> in the Supabase SQL
          editor to add tracking IDs and the customer dispatch email. Orders below work as normal
          until then.
        </div>
      )}

      {orders?.length === 0 ? (
        <div className="luxury-card p-8 text-center text-muted-foreground">No orders found.</div>
      ) : (
        <div className="space-y-5">
          {orders?.map((order) => (
            <div key={order.id} className="luxury-card p-6 border border-border">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-serif text-lg text-ivory">{order.txnid}</p>
                  {order.invoice_no && (
                    <p className="text-xs text-primary mt-1">Invoice: {order.invoice_no}</p>
                  )}
                  {/* A tax invoice only exists for a completed sale, so the button is
                      hidden entirely on pending/failed orders rather than erroring. */}
                  {order.status === "paid" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline-gold"
                        size="sm"
                        onClick={() => downloadDoc(order, "invoice")}
                        disabled={downloading === `${order.txnid}:invoice`}
                      >
                        {downloading === `${order.txnid}:invoice`
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <FileDown className="w-4 h-4 mr-2" />}
                        {downloading === `${order.txnid}:invoice` ? "Preparing…" : "Invoice"}
                      </Button>
                      <Button
                        variant="outline-gold"
                        size="sm"
                        onClick={() => downloadDoc(order, "label")}
                        disabled={downloading === `${order.txnid}:label`}
                      >
                        {downloading === `${order.txnid}:label`
                          ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          : <Truck className="w-4 h-4 mr-2" />}
                        {downloading === `${order.txnid}:label` ? "Preparing…" : "Shipping Label"}
                      </Button>
                    </div>
                  )}
                  {order.status === "paid" && dispatchReady && <DispatchPanel order={order} token={session?.access_token} onSaved={fetchOrders} />}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Stat icon={Database} label="Amount" value={formatINR(order.total)} />
                  <Stat icon={Package} label="Status" value={order.status} />
                  <Stat icon={Mail} label="Email" value={order.email} />
                  <Stat icon={ShieldCheck} label="Mode" value={order.payu_mode || "N/A"} />
                </div>
              </div>

              <div className="gold-divider my-5" />
              <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Customer</p>
                    <p className="text-sm text-ivory">{order.name || order.email}</p>
                    <p className="text-sm text-muted-foreground">{order.phone || "No phone"}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Shipping Address</p>
                    <p className="text-sm text-ivory">{formatAddress(order.address)}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Items</p>
                  <div className="space-y-2 text-sm">
                    {/* `items` is a jsonb column that can be NULL on a pending order
                        row, which used to blank the whole dashboard. */}
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{item.name || "Item"} × {item.qty}</span>
                        <span>{formatINR((item.price || 0) * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="gold-divider my-5" />
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <p>Created: {new Date(order.created_at).toLocaleString("en-IN")}</p>
                <p>Updated: {new Date(order.updated_at).toLocaleString("en-IN")}</p>
                <p>PayU Transaction: {order.payu_txn_id || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border p-4 bg-background">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-muted-foreground mb-2">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </div>
      <p className="font-serif text-sm text-ivory break-words">{value}</p>
    </div>
  );
}

function formatAddress(address: OrderRow["address"]) {
  if (!address) return "No address provided.";
  const parts = [address.line1, address.city, address.state, address.pin, address.country].filter(Boolean);
  return parts.join(", ") || "No address provided.";
}

/**
 * Dispatch tracking for a paid order.
 *
 * Saving records the courier reference and emails the customer their tracking number
 * with the tax invoice attached. The server sends that email once per order — re-saving
 * to fix a typo updates the record without re-sending, because a second "your order has
 * shipped" reads as a second parcel. The response says which happened, and this shows it
 * rather than claiming an email went out.
 */
function DispatchPanel({
  order,
  token,
  onSaved,
}: {
  order: OrderRow;
  token?: string;
  onSaved: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [trackingId, setTrackingId] = useState(order.tracking_id ?? "");
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");
  const [saving, setSaving] = useState(false);

  const dispatched = Boolean(order.tracking_id);

  const save = async () => {
    if (!trackingId.trim()) {
      toast.error("Enter the tracking ID first.");
      return;
    }
    if (!token) {
      toast.error("Session expired — sign in again.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          txnid: order.txnid,
          tracking_id: trackingId.trim(),
          carrier: carrier.trim(),
          tracking_url: trackingUrl.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || `Could not save tracking (${res.status}).`);
        return;
      }
      toast.success(
        data.emailed
          ? "Tracking saved — customer emailed with the invoice."
          : data.alreadyEmailed
            ? "Tracking updated. The customer was already emailed, so no second email was sent."
            : "Tracking saved, but the email could not be sent — try saving again."
      );
      setOpen(false);
      await onSaved();
    } catch {
      toast.error("Network error while saving tracking.");
    } finally {
      setSaving(false);
    }
  };

  if (dispatched && !open) {
    return (
      <div className="mt-3 rounded-sm border border-primary/40 bg-primary/10 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] tracking-luxe uppercase text-primary">Dispatched</p>
            <p className="text-sm text-ivory truncate">
              {order.carrier ? `${order.carrier} · ` : ""}
              {order.tracking_id}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {order.shipped_email_sent_at ? "Customer emailed" : "Customer not emailed yet"}
              {order.dispatched_at ? ` · ${new Date(order.dispatched_at).toLocaleDateString("en-IN")}` : ""}
            </p>
          </div>
          <Button variant="ghostGold" size="sm" onClick={() => setOpen(true)}>Edit</Button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="luxury" size="sm" className="mt-3" onClick={() => setOpen(true)}>
        <Truck className="w-4 h-4 mr-2" /> Add Tracking ID
      </Button>
    );
  }

  return (
    <div className="mt-3 rounded-sm border border-border p-3 space-y-2 max-w-md">
      <p className="text-[10px] tracking-luxe uppercase text-primary">Dispatch details</p>
      <input
        value={trackingId}
        onChange={(e) => setTrackingId(e.target.value)}
        placeholder="Tracking ID (required)"
        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
        autoFocus
      />
      <input
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        placeholder="Courier — e.g. Delhivery, Blue Dart"
        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
      />
      <input
        value={trackingUrl}
        onChange={(e) => setTrackingUrl(e.target.value)}
        placeholder="Tracking link (optional) — https://…"
        className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
      />
      <p className="text-[10px] text-muted-foreground">
        {order.shipped_email_sent_at
          ? "This customer has already been emailed — saving updates the record only."
          : "Saving emails the customer their tracking number with the invoice attached."}
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghostGold" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="luxury" size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Truck className="w-4 h-4 mr-2" />}
          {order.shipped_email_sent_at ? "Update" : "Save & notify"}
        </Button>
      </div>
    </div>
  );
}
