import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock, ShieldCheck, Truck, CheckCircle2, Gift, Sparkles, Smartphone, CreditCard, Building2, Wallet } from "lucide-react";
import { useShop, formatINR } from "@/store/shop";
import { priceFor, imageFor } from "@/data/products";
import { trackInitiateCheckout, setPixelIdentity, getPixelSignals } from "@/lib/pixel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { site } from "@/config/site";

const GIFT_FEE = 49;

type FormState = {
  email: string; phone: string;
  firstName: string; lastName: string;
  address: string; city: string; state: string; pin: string; country: string;
};

const emptyForm: FormState = {
  email: "", phone: "", firstName: "", lastName: "",
  address: "", city: "", state: "", pin: "", country: "India",
};

export default function Checkout() {
  const { cart, subtotal, offerDiscount, offers, clearCart, coupon, setCoupon, couponDiscount } = useShop();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [gift, setGift] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Mirror the server's math (api/checkout/initiate): shipping is judged on the
  // post-discount subtotal, and the discount comes off the total.
  const discountedSubtotal = Math.max(0, subtotal - offerDiscount);
  const shipping = 0; // Free shipping on all orders.
  // couponAllowed reflects the server's verdict once the email is known — the welcome code is
  // first-order-only, which only the server can check. Until then we show the optimistic
  // figure from the store, and never let the shopper reach PayU on a stale number.
  const [couponBlocked, setCouponBlocked] = useState<string | null>(null);
  const appliedCoupon = couponBlocked ? 0 : couponDiscount;
  const total = Math.max(0, discountedSubtotal - appliedCoupon) + shipping + (gift ? GIFT_FEE : 0);

  // Meta InitiateCheckout — fires once when the shopper reaches checkout with a
  // non-empty bag (Meta's definition: entering the checkout flow, not completing it).
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || cart.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout({
      items: cart.map(({ product, qty, volume }) => ({ id: product.id, qty, price: priceFor(product, volume).price })),
      value: total,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length]);

  const setField = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  // Confirm the promo code as soon as we have an email to check it against, so a
  // first-order-only rejection surfaces here rather than as a surprise on the pay button.
  useEffect(() => {
    if (!coupon || !/^\S+@\S+\.\S+$/.test(form.email)) { setCouponBlocked(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/coupon/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: coupon,
            email: form.email,
            items: cart.map(({ product, qty, volume }) => ({ id: product.id, volume, qty })),
          }),
        });
        const data = await res.json();
        if (!cancelled) setCouponBlocked(data?.valid ? null : (data?.reason || "This code isn't valid for this order."));
      } catch {
        // Network hiccup — leave the optimistic figure; initiate.ts still has the final say.
        if (!cancelled) setCouponBlocked(null);
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
  }, [coupon, form.email, cart]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    // Remember who this is, so every later Meta event (including the PageViews on the
    // way back from PayU) carries hashed email/phone — the heaviest match signals there
    // are. Hashing happens server-side; nothing identifying reaches Meta in clear.
    setPixelIdentity({ email: form.email, phone: form.phone });

    try {
      const payload = {
        customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
        address: { line1: form.address, city: form.city, state: form.state, pin: form.pin, country: form.country },
        // `volume` is included alongside the display price so the server can recompute
        // the real total from its own price table rather than trusting this `price`.
        items: cart.map(({ product, qty, volume }) => ({ id: product.id, volume, name: `${product.name} (${volume})`, price: priceFor(product, volume).price, qty })),
        amounts: { subtotal, shipping, gift, total },
        // Sent for the server to re-validate; it recomputes the discount itself and never
        // trusts the figure shown here.
        coupon,
        // Stored with the order so the Purchase event — sent later from PayU's
        // server-to-server callback, which sees none of this browser — still reports the
        // real shopper to Meta.
        ...getPixelSignals(),
      };

      const res = await fetch("/api/checkout/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If /api isn't running, the SPA fallback answers with index.html — parsing that
      // as JSON used to throw and get swallowed by the generic "Network error" catch
      // below, which made a missing backend look like a flaky connection.
      const rawResponse = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawResponse);
      } catch {
        console.error("checkout: expected JSON from /api/checkout/initiate, got:", rawResponse.slice(0, 200));
        toast.error("Payment service is unavailable right now. Please try again in a moment.");
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        toast.error(data?.error || "Couldn't start payment. Please try again.");
        setSubmitting(false);
        return;
      }

      if (!data?.action || !data?.fields?.txnid) {
        toast.error("Couldn't start payment. Please try again.");
        setSubmitting(false);
        return;
      }

      // Stash a light summary so the /order/success page can show details even after
      // the cart is cleared and PayU has redirected the browser back to us.
      sessionStorage.setItem(
        "itr_last_order",
        JSON.stringify({ txnid: data.fields.txnid, items: payload.items, total, email: form.email })
      );

      // Build & auto-submit a hidden form to PayU's hosted payment page.
      const payuForm = document.createElement("form");
      payuForm.method = "POST";
      payuForm.action = data.action;
      Object.entries(data.fields).forEach(([k, v]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = String(v ?? "");
        payuForm.appendChild(input);
      });
      document.body.appendChild(payuForm);
      // Submit before clearing: if the handover to PayU throws, the customer keeps
      // their bag instead of being left on an empty cart with no payment started.
      payuForm.submit();
      clearCart();
    } catch (err) {
      console.error(err);
      toast.error("Network error — please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container py-16 sm:py-24 md:py-32 text-center">
        <h1 className="font-display text-2xl sm:text-4xl text-ivory">Your bag is empty</h1>
        <Button asChild variant="luxury" size="lg" className="mt-6"><Link to="/shop">Continue Shopping</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-12">
      <div className="text-center mb-6 md:mb-12">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Almost There</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-2">Checkout</h1>
        <div className="gold-divider w-24 mx-auto mt-4 md:mt-6" />
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-6 md:mb-12 text-xs">
        {["Shipping", "Payment", "Confirmation"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`flex items-center gap-2 ${i === 0 ? "text-primary" : "text-muted-foreground"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${i === 0 ? "bg-gradient-gold text-primary-foreground" : "border border-border"}`}>{i + 1}</span>
              <span className="tracking-luxe uppercase hidden sm:inline">{s}</span>
            </span>
            {i < 2 && <span className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <form ref={formRef} onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-10">
        <div className="space-y-6 md:space-y-10">
          <Section title="01 · Contact">
            <p className="text-xs text-muted-foreground -mt-2">
              No account needed — we'll set one up automatically with this email so you can track your order later.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email" type="email" required value={form.email} onChange={setField("email")} />
              <Field label="Phone" type="tel" required value={form.phone} onChange={setField("phone")} />
            </div>
          </Section>

          <Section title="02 · Shipping Address">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name" required value={form.firstName} onChange={setField("firstName")} />
              <Field label="Last Name" value={form.lastName} onChange={setField("lastName")} />
              <Field label="Address" required className="sm:col-span-2" value={form.address} onChange={setField("address")} />
              <Field label="City" required value={form.city} onChange={setField("city")} />
              <Field label="State" required value={form.state} onChange={setField("state")} />
              <Field label="PIN Code" required value={form.pin} onChange={setField("pin")} />
              <Field label="Country" required value={form.country} onChange={setField("country")} />
            </div>
          </Section>

          {/* Prepaid-only is the single biggest surprise at this step (we don't offer COD),
              so the accepted methods are spelled out as visible chips rather than one line
              of fine print a shopper skims past on the way to the pay button. */}
          <Section title="03 · Payment">
            <div className="luxury-card p-5 space-y-4 border-primary/40">
              <div className="flex items-center gap-4">
                <Lock className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-serif text-lg text-ivory">Prepaid Payment Only · Secured by PayU</p>
                  <p className="text-xs text-muted-foreground">Cash on Delivery is not available. Pick your method on the next screen.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { Icon: Smartphone, t: "UPI", s: "GPay · PhonePe · Paytm" },
                  { Icon: CreditCard, t: "Cards", s: "Debit & Credit" },
                  { Icon: Building2, t: "Netbanking", s: "All major banks" },
                  { Icon: Wallet, t: "Wallets", s: "Paytm & more" },
                ].map(({ Icon, t, s }) => (
                  <div key={t} className="border border-border rounded-sm p-3 text-center">
                    <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" strokeWidth={1.4} />
                    <p className="text-xs text-ivory font-medium">{t}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-px" />
                100% secure — payment is handled entirely by PayU and your order ships the moment it's confirmed.
              </p>
            </div>
          </Section>
        </div>

        <aside className="luxury-card p-5 sm:p-8 h-fit lg:sticky lg:top-32 space-y-4 sm:space-y-5">
          <h2 className="font-display text-2xl text-gold">Order Summary</h2>
          <div className="space-y-3">
            {cart.map(({ product, qty, volume }) => (
              <div key={`${product.id}::${volume}`} className="flex gap-3 items-center text-sm">
                <img src={imageFor(product, volume)} alt="" className="w-14 h-16 object-cover rounded-sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-ivory truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{volume} · Qty {qty}</p>
                </div>
                <span className="text-gold">{formatINR(priceFor(product, volume).price * qty)}</span>
              </div>
            ))}
          </div>
          {/* Gift packaging */}
          <label className="flex items-start gap-3 border border-border rounded-sm p-4 cursor-pointer hover:border-primary/50">
            <Checkbox checked={gift} onCheckedChange={v => setGift(Boolean(v))} className="mt-0.5" />
            <span className="flex-1">
              <span className="flex items-center gap-2 text-ivory text-sm"><Gift className="w-4 h-4 text-primary" /> Add luxury gift wrapping</span>
              <span className="text-xs text-muted-foreground">Mahogany box, gold foil & a personal note · +{formatINR(GIFT_FEE)}</span>
            </span>
          </label>

          <div className="gold-divider" />
          <div className="space-y-2 text-sm">
            <Row label="Subtotal" v={formatINR(subtotal)} />
            {offers.map(o => (
              <div key={o.code} className="flex justify-between text-primary">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {o.label}</span>
                <span>− {formatINR(o.amount)}</span>
              </div>
            ))}
            {appliedCoupon > 0 && (
              <div className="flex justify-between text-primary">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Coupon ({coupon})</span>
                <span>− {formatINR(appliedCoupon)}</span>
              </div>
            )}
            <Row label="Shipping" v={shipping === 0 ? "Free" : formatINR(shipping)} />
            {gift && <Row label="Gift wrapping" v={formatINR(GIFT_FEE)} />}
            <div className="flex justify-between font-serif text-xl text-ivory pt-2 border-t border-border">
              <span>Total</span><span className="text-gold">{formatINR(total)}</span>
            </div>
            {offerDiscount > 0 && (
              <p className="text-[11px] text-primary text-right">You save {formatINR(offerDiscount)} with the Raksha Bandhan Sale 🎉</p>
            )}
            {couponBlocked && (
              <p className="text-[11px] text-destructive">{couponBlocked}</p>
            )}
          </div>
          <Button type="submit" variant="luxury" size="xl" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
            {submitting ? "Redirecting to PayU…" : `Pay ${formatINR(total)} via PayU`}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center -mt-1">
            Prepaid only · UPI, Cards, Netbanking & Wallets accepted
          </p>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border text-center">
            <Mini Icon={ShieldCheck} t="Secure" />
            <Mini Icon={Truck} t="Tracked" />
            <Mini Icon={CheckCircle2} t="Easy Returns" />
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="luxury-card p-4 sm:p-8 space-y-4 sm:space-y-5">
      <h2 className="font-display text-xl sm:text-2xl text-gold">{title}</h2>
      {children}
    </div>
  );
}
function Field({ label, className = "", ...rest }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs tracking-luxe uppercase text-muted-foreground">{label}</Label>
      <Input {...rest} />
    </div>
  );
}
function Row({ label, v }: { label: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{v}</span></div>;
}
function Mini({ Icon, t }: { Icon: any; t: string }) {
  return <div><Icon className="w-4 h-4 text-primary mx-auto mb-1" /><p className="text-[10px] text-muted-foreground">{t}</p></div>;
}
