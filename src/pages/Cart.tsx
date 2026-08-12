import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, Sparkles } from "lucide-react";
import { useShop, formatINR } from "@/store/shop";
import { priceFor, imageFor } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { site } from "@/config/site";
import { computeCoupon, normalizeCode, WELCOME_CODE, WELCOME_PERCENT } from "@/lib/coupons";
import { CartReservationNotice } from "@/components/shop/CartReservationBanner";

export default function Cart() {
  const { cart, updateQty, removeFromCart, subtotal, offerDiscount, offers, offerNudge, coupon, setCoupon, couponDiscount, couponResult } = useShop();
  const [entry, setEntry] = useState(coupon);
  const discountedSubtotal = Math.max(0, subtotal - offerDiscount);
  const shipping = 0; // Free shipping on all orders.
  const total = Math.max(0, discountedSubtotal - couponDiscount + shipping);

  // The code is held in the shop store (not local state) so it reaches checkout; the
  // discount shown here is optimistic, and /api/checkout/initiate re-validates the
  // first-order-only rule before anything is charged.
  const apply = () => {
    const result = computeCoupon(entry, discountedSubtotal, offerDiscount);
    if (result.valid) {
      // Store the canonical form, not whatever casing was typed — it's shown back to the
      // shopper on the cart and checkout summaries.
      setCoupon(normalizeCode(entry));
      toast.success(`Coupon applied: ${WELCOME_PERCENT}% off`);
    } else {
      setCoupon("");
      toast.error(result.reason || "Invalid code");
    }
  };

  const removeCoupon = () => { setCoupon(""); setEntry(""); };

  if (cart.length === 0) {
    return (
      <div className="container py-16 sm:py-24 md:py-32 text-center">
        <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4 sm:mb-6" strokeWidth={1.2} />
        <h1 className="font-display text-3xl sm:text-5xl text-ivory">Your bag is empty</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-3">Begin your fragrance journey with our collection.</p>
        <Button asChild variant="luxury" size="xl" className="mt-6 sm:mt-8"><Link to="/shop">Explore Shop</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-16">
      <div className="text-center mb-6 md:mb-12">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Your Bag</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-3">Review & Checkout</h1>
        <div className="gold-divider w-24 mx-auto mt-4 md:mt-6" />
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-10">
        <div className="space-y-3 sm:space-y-4">
          {cart.map(({ product, qty, volume }) => (
            <div key={`${product.id}::${volume}`} className="luxury-card p-3 sm:p-5 flex gap-3 sm:gap-5">
              <Link to={`/product/${product.slug}`} className="shrink-0">
                <img src={imageFor(product, volume)} alt={product.name} className="w-20 h-24 sm:w-28 sm:h-32 object-cover rounded-sm" />
              </Link>
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] tracking-luxe uppercase text-muted-foreground">{product.category} · {volume}</p>
                    <h3 className="font-serif text-base sm:text-2xl text-ivory truncate">{product.name}</h3>
                    <p className="hidden sm:block text-xs italic text-muted-foreground">{product.tagline}</p>
                  </div>
                  <button onClick={() => removeFromCart(product.id, volume)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-end justify-between mt-auto pt-2 sm:pt-4">
                  <div className="flex items-center border border-border rounded-sm">
                    <button onClick={() => updateQty(product.id, volume, qty - 1)} className="p-1.5 sm:p-2 hover:text-primary"><Minus className="w-3 h-3" /></button>
                    <span className="px-3 sm:px-4 text-sm sm:text-base">{qty}</span>
                    <button onClick={() => updateQty(product.id, volume, qty + 1)} className="p-1.5 sm:p-2 hover:text-primary"><Plus className="w-3 h-3" /></button>
                  </div>
                  <span className="font-serif text-base sm:text-xl text-gold">{formatINR(priceFor(product, volume).price * qty)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="luxury-card p-5 sm:p-8 h-fit lg:sticky lg:top-32 space-y-4 sm:space-y-5">
          <h2 className="font-display text-2xl text-gold">Order Summary</h2>
          <div className="space-y-3 text-sm">
            <Row label="Subtotal" v={formatINR(subtotal)} />
            {offers.map(o => (
              <div key={o.code} className="flex justify-between text-primary">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {o.label}</span>
                <span>− {formatINR(o.amount)}</span>
              </div>
            ))}
            <Row label="Shipping" v={shipping === 0 ? "Free" : formatINR(shipping)} />
            {couponDiscount > 0 && <Row label={`Coupon (${coupon})`} v={`− ${formatINR(couponDiscount)}`} className="text-primary" />}
          </div>
          <CartReservationNotice />
          {offerNudge && (
            <div className="rounded-sm border border-primary/40 bg-primary/10 px-3 py-2 text-xs text-primary flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 shrink-0" /> {offerNudge}
            </div>
          )}
          <div className="gold-divider" />
          <Row label="Total" v={formatINR(total)} className="font-serif text-xl text-ivory" />
          {offerDiscount > 0 && (
            <p className="text-[11px] text-primary text-right -mt-2">Raksha Bandhan Sale saves you {formatINR(offerDiscount)} 🎉</p>
          )}

          <div className="space-y-2">
            <p className="text-xs tracking-luxe uppercase text-primary">Promo Code</p>
            {couponDiscount > 0 ? (
              <div className="flex items-center justify-between gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-2">
                <span className="text-xs text-primary">{coupon} applied — {WELCOME_PERCENT}% off</span>
                <button onClick={removeCoupon} className="text-xs text-muted-foreground hover:text-ivory underline">Remove</button>
              </div>
            ) : (
              <>
                {/* First-time shoppers won't know WELCOME15 exists otherwise — the input's
                    placeholder alone is too easy to miss. */}
                <p className="text-[11px] text-muted-foreground">
                  New here? Use <span className="text-primary font-medium">{WELCOME_CODE}</span> for {WELCOME_PERCENT}% off your first order.
                </p>
                <div className="flex gap-2">
                  <Input value={entry} onChange={e => setEntry(e.target.value)} placeholder={`Try ${WELCOME_CODE}`} />
                  <Button variant="outline-gold" onClick={apply}>Apply</Button>
                </div>
              </>
            )}
            {/* First-order-only is enforced server-side, so say so rather than letting the
                shopper discover it at the payment step. WELCOME15 stacks on top of the
                Raksha Bandhan Sale (see api/_lib/coupons.ts) — there's no "can't combine"
                restriction to mention here. */}
            {couponDiscount > 0 && (
              <p className="text-[11px] text-muted-foreground">Valid on your first order — confirmed at checkout.</p>
            )}
          </div>

          <Button asChild variant="luxury" size="xl" className="w-full">
            <Link to="/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="ghostGold" className="w-full">
            <Link to="/shop">← Continue Shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
function Row({ label, v, className = "" }: { label: string; v: string; className?: string }) {
  return (
    <div className={`flex justify-between ${className}`}>
      <span className="text-muted-foreground">{label}</span>
      <span>{v}</span>
    </div>
  );
}
