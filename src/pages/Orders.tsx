import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/auth";
import { supabase } from "@/lib/supabase";
import { formatINR } from "@/store/shop";

type OrderRow = {
  id: string; txnid: string; created_at: string; status: string;
  total: number; items: { name: string; price: number; qty: number }[];
};

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !supabase) { setLoading(false); return; }
    supabase
      .from("orders")
      .select("id, txnid, created_at, status, total, items")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        setOrders((data as OrderRow[]) || []);
        setLoading(false);
      });
  }, [user, authLoading]);

  return (
    <div className="container py-8 md:py-16 max-w-3xl">
      <div className="text-center mb-6 md:mb-12">
        <Package className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-3 sm:mb-4" strokeWidth={1.2} />
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Order History</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-3">My Orders</h1>
        <div className="gold-divider w-24 mx-auto mt-4 sm:mt-6" />
      </div>

      {!user ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Sign in to view your orders — every checkout auto-creates an account, no password required.</p>
          <Button asChild variant="luxury" size="lg" className="mt-6"><Link to="/auth">Sign In</Link></Button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
      ) : !orders || orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild variant="luxury" size="lg" className="mt-6"><Link to="/shop">Start Shopping</Link></Button>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(o => (
            <div key={o.id} className="luxury-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-serif text-lg text-ivory">Order {o.txnid}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`text-[10px] tracking-luxe uppercase px-3 py-1 rounded-sm border ${
                  o.status === "paid" ? "border-primary/40 text-primary" : o.status === "failed" ? "border-destructive/40 text-destructive" : "border-border text-muted-foreground"
                }`}>{o.status}</span>
              </div>
              <div className="space-y-1 text-sm">
                {(o.items || []).map((it, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{it.name} × {it.qty}</span><span>{formatINR(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="gold-divider my-3" />
              <div className="flex justify-between font-serif text-ivory">
                <span>Total</span><span className="text-gold">{formatINR(o.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
