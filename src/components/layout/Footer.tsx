import { useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, MessageCircle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { site, whatsappLink, instagramLink, facebookLink, isSet } from "@/config/site";
import { supabase } from "@/lib/supabase";
import logo from "@/assets/brand/logo.png";

export function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("subscribers").insert({ email: email.trim(), source: "footer" });
      if (error) throw error;
      toast.success("Subscribed! Welcome to Itrawala.");
      setEmail("");
    } catch {
      toast.success("Subscribed! Welcome to Itrawala.");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="relative bg-deep-brown/40 border-t border-border/60 mt-24">
      <div className="gold-divider" />
      <div className="container py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12">
          {/* Brand */}
          <div className="lg:col-span-4 space-y-6">
            <div>
              <img src={logo} alt={site.brand} className="h-16 w-auto object-contain" />
              <p className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground mt-2">
                Maison de Parfum
              </p>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed max-w-sm font-serif italic">
              "{site.tagline}."
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              Luxury fragrances without luxury brand prices — long-lasting perfumes and attars
              trusted by thousands of fragrance lovers across India.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Instagram, href: instagramLink },
                { Icon: Facebook, href: facebookLink },
                { Icon: Youtube, href: "https://youtu.be/Iw0hrhKlh4o" },
                { Icon: MessageCircle, href: whatsappLink() },
              ].map(({ Icon, href }, i) => (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 border border-border rounded-sm flex items-center justify-center hover:border-primary hover:text-primary transition-all hover:-translate-y-0.5">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="text-xs tracking-luxe uppercase text-primary mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/shop" className="hover:text-ivory">All Products</Link></li>
              <li><Link to="/shop?category=Perfume" className="hover:text-ivory">Perfumes</Link></li>
              <li><Link to="/shop?category=Attar" className="hover:text-ivory">Attars</Link></li>
              <li><Link to="/shop?category=Gift Set" className="hover:text-ivory">Gift Sets</Link></li>
              <li><Link to="/wholesale" className="hover:text-ivory">Wholesale</Link></li>
              <li><Link to="/about" className="hover:text-ivory">About Us</Link></li>
            </ul>
          </div>

          {/* Support + Policies */}
          <div className="lg:col-span-2">
            <h4 className="text-xs tracking-luxe uppercase text-primary mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-ivory">Contact Us</Link></li>
              <li><a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-ivory">WhatsApp Support</a></li>
              <li><Link to="/shipping" className="hover:text-ivory">Shipping Policy</Link></li>
              <li><Link to="/returns" className="hover:text-ivory">Returns & Refund</Link></li>
              <li><Link to="/privacy" className="hover:text-ivory">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-ivory">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Newsletter + contact */}
          <div className="lg:col-span-4 space-y-5">
            <h4 className="text-xs tracking-luxe uppercase text-primary">Stay in our world</h4>
            <p className="text-sm text-muted-foreground">
              Subscribe for early access, private collections, and a welcome discount.
            </p>
            <form className="flex gap-2" onSubmit={handleSubscribe}>
              <Input placeholder="Your email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="bg-background/50 border-border focus-visible:ring-primary" />
              <Button variant="luxury" type="submit" disabled={submitting}>{submitting ? "…" : "Subscribe"}</Button>
            </form>
            <div className="space-y-2 text-sm text-muted-foreground pt-2">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {site.email}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> {site.phone}</p>
              <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {site.address}</p>
              {isSet(site.amazonStoreUrl) && (
                <a href={site.amazonStoreUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-gold mt-1">
                  <ShoppingCart className="w-4 h-4" /> Shop us on Amazon →
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="gold-divider my-10" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="text-center md:text-left">
            <p>© {new Date().getFullYear()} {site.brand}. All rights reserved.</p>
            <p className="mt-1">GST: {site.gst}</p>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-ivory">Privacy</Link>
            <Link to="/terms" className="hover:text-ivory">Terms</Link>
            <Link to="/shipping" className="hover:text-ivory">Shipping</Link>
            <Link to="/returns" className="hover:text-ivory">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
