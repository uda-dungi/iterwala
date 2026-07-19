import { useEffect, useMemo, useState } from "react";
import { Loader2, Database, Mail, Package, ShieldCheck } from "lucide-react";
import { useAuth } from "@/store/auth";
import { formatINR } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { site } from "@/config/site";

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
};

export default function AdminOrders() {
  const { user, session } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
                    {order.items.map((item, idx) => (
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
