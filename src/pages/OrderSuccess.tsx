import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/store/shop";
import { site } from "@/config/site";

type LastOrder = { txnid: string; items: { name: string; price: number; qty: number }[]; total: number; email: string };

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const txnid = params.get("txnid");
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("itr_last_order");
      if (!raw) return;
      const parsed: LastOrder = JSON.parse(raw);
      if (!txnid || parsed.txnid === txnid) {
        setOrder(parsed);
        sessionStorage.removeItem("itr_last_order");
      }
    } catch { /* ignore */ }
  }, [txnid]);

  return (
    <div className="container py-32 text-center max-w-xl">
      <CheckCircle2 className="w-20 h-20 mx-auto text-primary mb-6" strokeWidth={1.2} />
      <h1 className="font-display text-5xl text-ivory">Thank You</h1>
      <p className="text-muted-foreground mt-3 font-serif italic">Your fragrance is on its way.</p>

      {txnid && <p className="text-xs text-muted-foreground mt-6">Order reference: <span className="text-primary">{txnid}</span></p>}

      {order && (
        <div className="luxury-card p-6 mt-8 text-left space-y-3">
          {order.items.map((it, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-ivory">{it.name} <span className="text-muted-foreground">× {it.qty}</span></span>
              <span className="text-gold">{formatINR(it.price * it.qty)}</span>
            </div>
          ))}
          <div className="gold-divider" />
          <div className="flex justify-between font-serif text-lg text-ivory">
            <span>Total Paid</span><span className="text-gold">{formatINR(order.total)}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-8">
        <Mail className="w-4 h-4 text-primary" />
        A confirmation email — with a secure link to view your order anytime — is on its way to your inbox.
      </div>

      <div className="flex flex-wrap gap-4 justify-center mt-8">
        <Button asChild variant="luxury" size="lg"><Link to="/shop">Continue Shopping</Link></Button>
        <Button asChild variant="outline-gold" size="lg"><a href={`mailto:${site.email}`}>Need Help?</a></Button>
      </div>
    </div>
  );
}
