import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Heart, Minus, Plus, ShieldCheck, Sparkles, Star, Truck, Leaf, Award, CheckCircle2 } from "lucide-react";
import { getProduct, products, volumesFor, priceFor } from "@/data/products";
import { useShop, formatINR } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AmazonChoiceBadge } from "@/components/shop/AmazonChoiceBadge";
import { StickyMobileCTA } from "@/components/shop/StickyMobileCTA";
import { RecentlyViewed } from "@/components/shop/RecentlyViewed";
import { ProductSchema } from "@/components/seo/Schema";
import { recordView } from "@/store/recentlyViewed";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const product = getProduct(slug);
  const { addToCart, toggleWishlist, wishlist, setCartOpen } = useShop();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [volume, setVolume] = useState("");

  useEffect(() => {
    if (product) { recordView(product.id); setVolume(volumesFor(product)[0]); setQty(1); setActive(0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) return <Navigate to="/shop" />;
  const wished = wishlist.includes(product.id);
  const vols = volumesFor(product);
  const selectedVol = volume || vols[0];
  const { price: unitPrice, compareAt: unitCompareAt } = priceFor(product, selectedVol);
  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
  const buyNow = () => { addToCart(product, qty, selectedVol); setCartOpen(false); window.location.href = "/checkout"; };

  return (
    <div className="pb-20 lg:pb-0">
      <ProductSchema product={product} />
      <div className="container pt-8">
        <nav className="flex items-center gap-2 text-xs text-muted-foreground tracking-wide">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/shop" className="hover:text-primary">Shop</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ivory">{product.name}</span>
        </nav>
      </div>

      <section className="container pt-10 pb-16 grid lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-deep-brown cursor-zoom-in"
            onClick={() => setZoom(z => !z)}
          >
            <img
              src={product.gallery[active]}
              alt={product.name}
              className={cn("w-full h-full object-cover transition-transform duration-700", zoom ? "scale-150" : "scale-100")}
            />
            {product.badge && (
              <span className="absolute top-5 left-5 text-[10px] tracking-luxe uppercase px-3 py-1 bg-gradient-gold text-primary-foreground font-semibold">
                {product.badge}
              </span>
            )}
          </motion.div>
          <div className="grid grid-cols-4 gap-3">
            {product.gallery.map((g, i) => (
              <button key={i} onClick={() => setActive(i)}
                className={cn("aspect-square overflow-hidden border rounded-sm transition-all",
                  active === i ? "border-primary shadow-gold" : "border-border hover:border-primary/50")}>
                <img src={g} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] tracking-luxe uppercase text-primary">{product.category} · {product.gender}</p>
              {product.amazonChoice && <AmazonChoiceBadge />}
            </div>
            <h1 className="font-display text-5xl md:text-6xl text-ivory mt-2">{product.name}</h1>
            <p className="font-serif italic text-lg text-muted-foreground mt-1">{product.tagline}</p>
            <p className="flex items-center gap-1.5 text-sm text-green-500 mt-3">
              <CheckCircle2 className="w-4 h-4" /> In Stock — ready to ship
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-4 h-4", i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted")} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="flex items-end gap-3">
            <span className="font-display text-4xl text-gold">{formatINR(unitPrice)}</span>
            {unitCompareAt && <span className="text-lg text-muted-foreground line-through">{formatINR(unitCompareAt)}</span>}
            {unitCompareAt && (
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-sm">
                Save {Math.round((1 - unitPrice / unitCompareAt) * 100)}%
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Inclusive of all taxes · Free shipping above ₹499</p>

          {/* Volume selector */}
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-primary mb-2">Size</p>
            <div className="flex gap-3">
              {vols.map(v => (
                <button key={v} onClick={() => setVolume(v)}
                  className={cn("px-5 py-2 border rounded-sm text-sm transition-all",
                    selectedVol === v ? "border-primary text-primary shadow-gold" : "border-border text-muted-foreground hover:border-primary/50")}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          {/* Notes pyramid */}
          <div className="luxury-card p-5 space-y-3">
            <p className="text-xs tracking-luxe uppercase text-primary">Fragrance Pyramid</p>
            <NoteRow label="Top" items={product.notes.top} />
            <NoteRow label="Heart" items={product.notes.heart} />
            <NoteRow label="Base" items={product.notes.base} />
          </div>

          {/* Performance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border p-4 rounded-sm">
              <p className="text-[10px] tracking-luxe uppercase text-primary">Longevity</p>
              <p className="font-serif text-lg text-ivory mt-1">{product.longevity}</p>
            </div>
            <div className="border border-border p-4 rounded-sm">
              <p className="text-[10px] tracking-luxe uppercase text-primary">Projection</p>
              <p className="font-serif text-lg text-ivory mt-1">{product.projection}</p>
            </div>
          </div>

          {/* Qty + Actions */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border border-border rounded-sm">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:text-primary"><Minus className="w-4 h-4" /></button>
              <span className="px-5 font-serif text-lg">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:text-primary"><Plus className="w-4 h-4" /></button>
            </div>
            <Button variant="luxury" size="lg" className="flex-1"
              onClick={() => { addToCart(product, qty, selectedVol); toast.success(`Added ${qty} × ${product.name} (${selectedVol})`); }}>
              Add to Cart
            </Button>
            <Button variant="outline-gold" size="lg" onClick={() => toggleWishlist(product.id)} className="px-4">
              <Heart className={cn("w-4 h-4", wished && "fill-primary")} />
            </Button>
          </div>
          <Button variant="ivory" size="xl" className="w-full"
            onClick={() => { addToCart(product, qty, selectedVol); setCartOpen(false); window.location.href = "/checkout"; }}>
            Buy Now — {formatINR(unitPrice * qty)}
          </Button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            {[
              { Icon: Truck, t: "Free Shipping", s: "Above ₹1,999" },
              { Icon: ShieldCheck, t: "Authentic", s: "100% Original" },
              { Icon: Sparkles, t: "Gift Wrap", s: "Complimentary" },
            ].map(t => (
              <div key={t.t} className="text-center">
                <t.Icon className="w-5 h-5 text-primary mx-auto mb-1" strokeWidth={1.2} />
                <p className="text-xs text-ivory">{t.t}</p>
                <p className="text-[10px] text-muted-foreground">{t.s}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Why you'll love */}
      <section className="container py-16">
        <div className="luxury-card p-10 md:p-16 bg-gradient-to-br from-deep-brown to-background">
          <div className="text-center mb-10">
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">The Itrawala Difference</p>
            <h2 className="font-display text-4xl md:text-5xl text-ivory mt-2">Why You'll Love It</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { Icon: Award, t: "Long-Lasting", d: "Up to 12 hours of sillage." },
              { Icon: Leaf, t: "Premium Oils", d: "Aged absolutes & naturals." },
              { Icon: ShieldCheck, t: "Skin-Friendly", d: "Dermatologist tested." },
              { Icon: Sparkles, t: "Luxury Packaging", d: "Hand-wrapped, gift-ready." },
            ].map(f => (
              <div key={f.t} className="text-center">
                <f.Icon className="w-8 h-8 text-primary mx-auto mb-3" strokeWidth={1.2} />
                <h3 className="font-serif text-lg text-ivory">{f.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="container py-12">
        <Tabs defaultValue="description">
          <TabsList className="bg-deep-brown/40 border border-border">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="text-muted-foreground leading-relaxed mt-6 max-w-3xl">
            <p>{product.description}</p>
            <p className="mt-4">Best suited for: {product.occasions.join(", ")}. Mood: {product.moods.join(", ")}.</p>
          </TabsContent>
          <TabsContent value="ingredients" className="text-muted-foreground leading-relaxed mt-6 max-w-3xl">
            <p>{product.ingredients}</p>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6 space-y-5 max-w-3xl">
            {[
              { n: "Aisha M.", t: "Stunning. The longevity is unreal. Compliments all day." },
              { n: "Rohan K.", t: "Worth every rupee. The packaging alone feels like a gift." },
              { n: "Priya S.", t: "My new signature scent. Subtle, sophisticated, addictive." },
            ].map((r, i) => (
              <div key={i} className="border border-border p-5 rounded-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                  </div>
                  <span className="text-sm text-primary">{r.n}</span>
                </div>
                <p className="text-muted-foreground mt-2 font-serif italic">"{r.t}"</p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </section>

      <RecentlyViewed excludeId={product.id} />

      {/* Related */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">You May Also Love</p>
          <h2 className="font-display text-4xl text-ivory mt-2">Related Fragrances</h2>
          <div className="gold-divider w-24 mx-auto mt-4" />
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      <StickyMobileCTA
        product={product}
        price={unitPrice}
        onAdd={() => { addToCart(product, qty, selectedVol); toast.success(`${product.name} added to cart`); }}
        onBuy={buyNow}
      />
    </div>
  );
}

function NoteRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex gap-3 items-baseline">
      <span className="text-[10px] tracking-luxe uppercase text-muted-foreground w-12 shrink-0">{label}</span>
      <span className="font-serif text-base text-ivory">{items.join(" · ")}</span>
    </div>
  );
}
