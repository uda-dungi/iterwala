import { useState } from "react";
import { motion } from "framer-motion";
import { Package, TrendingUp, BadgeCheck, Truck, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { site, whatsappLink } from "@/config/site";

const tiers = [
  { qty: "25 – 99 units", off: "20% off MRP", note: "Starter reseller" },
  { qty: "100 – 499 units", off: "30% off MRP", note: "Most popular", featured: true },
  { qty: "500+ units", off: "40%+ off MRP", note: "Distributor pricing" },
];

const perks = [
  { Icon: IndianRupee, t: "Margins up to 40%+", d: "Aggressive bulk pricing that protects your profit." },
  { Icon: Package, t: "Low MOQ — 25 units", d: "Start small, scale as you grow. Mix & match SKUs." },
  { Icon: BadgeCheck, t: "Amazon's Choice products", d: "Stock proven bestsellers customers already search for." },
  { Icon: Truck, t: "Pan-India dispatch", d: "Fast, tracked shipping from our Mumbai warehouse." },
];

export default function Wholesale() {
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    if (supabase) {
      await supabase.from("leads").insert({ ...payload, type: "wholesale" }).then(() => {});
    }
    setSent(true);
    toast.success("Inquiry received — our team will reach out within one business day.");
  };

  return (
    <div>
      {/* Hero */}
      <section className="container pt-16 pb-10 text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Partner With Us</p>
        <h1 className="font-display text-5xl md:text-7xl text-ivory mt-3">Become an Itrawala Reseller</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
          Sell India's fastest-growing affordable-luxury fragrance brand. Premium quality,
          Amazon's Choice bestsellers, and margins that make sense.
        </p>
        <div className="gold-divider w-24 mx-auto mt-6" />
      </section>

      {/* Perks */}
      <section className="container py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((p, i) => (
            <motion.div key={p.t}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }} className="luxury-card p-8 text-center">
              <p.Icon className="w-8 h-8 text-primary mx-auto mb-4" strokeWidth={1.2} />
              <h3 className="font-serif text-xl text-ivory">{p.t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{p.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing tiers */}
      <section className="container py-12">
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Bulk Pricing</p>
          <h2 className="font-display text-4xl md:text-5xl text-ivory mt-2">MOQ & Tiers</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {tiers.map(t => (
            <div key={t.qty}
              className={`luxury-card p-8 text-center ${t.featured ? "border-primary shadow-gold" : ""}`}>
              {t.featured && <span className="text-[10px] tracking-luxe uppercase text-primary">★ {t.note}</span>}
              <p className="font-display text-2xl text-ivory mt-2">{t.qty}</p>
              <p className="font-serif text-3xl text-gold mt-3 flex items-center justify-center gap-1">
                <TrendingUp className="w-5 h-5" /> {t.off}
              </p>
              {!t.featured && <p className="text-xs text-muted-foreground mt-3">{t.note}</p>}
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          Minimum order quantity: <span className="text-ivory">25 units</span>. Custom pricing for 500+.
        </p>
      </section>

      {/* Lead form */}
      <section className="container py-12 grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-5">
          <h2 className="font-display text-4xl text-gold">Request Bulk Pricing</h2>
          <p className="text-muted-foreground leading-relaxed">
            Tell us about your business and we'll send a full price list, catalogue, and the best
            tier for your volume. Prefer to chat?{" "}
            <a href={whatsappLink("Hi, I'm interested in becoming an Itrawala reseller.")}
              target="_blank" rel="noopener noreferrer" className="text-primary hover:text-gold">
              Message us on WhatsApp →
            </a>
          </p>
          <div className="luxury-card p-6 text-sm text-muted-foreground space-y-2">
            <p><span className="text-ivory">Email:</span> {site.email}</p>
            <p><span className="text-ivory">Phone:</span> {site.phone}</p>
            <p><span className="text-ivory">Hours:</span> {site.hours}</p>
          </div>
        </div>

        {sent ? (
          <div className="luxury-card p-10 text-center">
            <BadgeCheck className="w-14 h-14 text-primary mx-auto mb-4" strokeWidth={1.2} />
            <h3 className="font-display text-3xl text-ivory">Thank you!</h3>
            <p className="text-muted-foreground mt-3">Our wholesale team will contact you within one business day.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="luxury-card p-8 md:p-10 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input name="name" placeholder="Your name" required />
              <Input name="business" placeholder="Business / store name" required />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input name="phone" placeholder="Phone / WhatsApp" required />
              <Input name="city" placeholder="City" required />
            </div>
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="quantity" placeholder="Estimated monthly quantity (e.g. 100 units)" />
            <Textarea name="message" placeholder="Tell us about your business (optional)" rows={4} />
            <Button type="submit" variant="luxury" size="lg" className="w-full">Send Inquiry</Button>
          </form>
        )}
      </section>
    </div>
  );
}
