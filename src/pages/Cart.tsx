import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useShop, formatINR } from "@/store/shop";
import { priceFor, imageFor } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { site } from "@/config/site";

export default function Cart() {
  const { cart, updateQty, removeFromCart, subtotal } = useShop();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const shipping = subtotal >= site.freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const total = Math.max(0, subtotal - discount + shipping);

  const apply = () => {
    if (coupon.toUpperCase() === "WELCOME10") { setDiscount(Math.round(subtotal * 0.1)); toast.success("Coupon applied: 10% off"); }
    else { setDiscount(0); toast.error("Invalid code"); }
  };

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
            <Row label="Shipping" v={shipping === 0 ? "Free" : formatINR(shipping)} />
            {discount > 0 && <Row label="Discount" v={`− ${formatINR(discount)}`} className="text-primary" />}
          </div>
          <div className="gold-divider" />
          <Row label="Total" v={formatINR(total)} className="font-serif text-xl text-ivory" />

          <div className="space-y-2">
            <p className="text-xs tracking-luxe uppercase text-primary">Promo Code</p>
            <div className="flex gap-2">
              <Input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Try WELCOME10" />
              <Button variant="outline-gold" onClick={apply}>Apply</Button>
            </div>
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
