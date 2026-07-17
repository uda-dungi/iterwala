import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Heart, Minus, Plus, ShieldCheck, Sparkles, Star, Truck, Leaf, Award, CheckCircle2 } from "lucide-react";
import { getProduct, products, volumesFor, priceFor } from "@/data/products";
import { useShop, formatINR } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
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
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (product) { recordView(product.id); setVolume(volumesFor(product)[0]); setQty(1); setActive(0); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActive(api.selectedScrollSnap());
    api.on("select", onSelect);
    onSelect();
    return () => { api.off("select", onSelect); };
  }, [api]);

  // When the selected size has its own gallery (per galleryByVolume), reset back to
  // the first image so switching sizes doesn't leave the carousel/thumbnail grid
  // pointed at an index that belongs to the previous size's photo set.
  useEffect(() => {
    setActive(0);
    api?.scrollTo(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume]);

  if (!product) return <Navigate to="/shop" />;
  const wished = wishlist.includes(product.id);
  const vols = volumesFor(product);
  const selectedVol = volume || vols[0];
  const { price: unitPrice, compareAt: unitCompareAt } = priceFor(product, selectedVol);
  // Some products (e.g. Celebrity, Sukoon) use a genuinely different bottle photo per
  // size — fall back to the flat gallery for everything else.
  const gallery = product.galleryByVolume?.[selectedVol] ?? product.gallery;
  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
  const buyNow = () => { addToCart(product, qty, selectedVol); setCartOpen(false); window.location.href = "/checkout"; };

  return (
    <div className="pb-24 lg:pb-0">
      <ProductSchema product={product} />
      <div className="container pt-4 sm:pt-8">
        <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground tracking-wide overflow-hidden">
          <Link to="/" className="hover:text-primary shrink-0">Home</Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <Link to="/shop" className="hover:text-primary shrink-0">Shop</Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-ivory truncate">{product.name}</span>
        </nav>
      </div>

      <section className="pt-4 pb-8 sm:container sm:pt-10 sm:pb-16 lg:grid lg:grid-cols-2 lg:gap-20">
        {/* Gallery — mobile: full-bleed swipeable carousel. Desktop: zoom image + thumbnail grid. */}
        <div className="space-y-4">
          {/* Mobile carousel */}
          <div className="lg:hidden relative">
            <Carousel setApi={setApi} opts={{ loop: gallery.length > 1 }}>
              <CarouselContent>
                {gallery.map((g, i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-square bg-deep-brown">
                      <img src={g} alt={product.name} className="w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {product.badge && (
              <span className="absolute top-4 left-4 text-[10px] tracking-luxe uppercase px-3 py-1 bg-gradient-gold text-primary-foreground font-semibold">
                {product.badge}
              </span>
            )}
            <button
              onClick={() => toggleWishlist(product.id)}
              aria-label="Toggle wishlist"
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center border border-border/60"
            >
              <Heart className={cn("w-4 h-4", wished ? "fill-primary text-primary" : "text-ivory")} />
            </button>
            {gallery.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => api?.scrollTo(i)}
                    aria-label={`Go to image ${i + 1}`}
                    className={cn("h-1.5 rounded-full transition-all", active === i ? "w-6 bg-primary" : "w-1.5 bg-border")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop gallery */}
          <div className="hidden lg:block space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="relative aspect-[4/5] overflow-hidden rounded-sm border border-border bg-deep-brown cursor-zoom-in"
              onClick={() => setZoom(z => !z)}
            >
              <img
                src={gallery[active] ?? gallery[0]}
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
              {gallery.map((g, i) => (
                <button key={i} onClick={() => setActive(i)}
                  className={cn("aspect-square overflow-hidden border rounded-sm transition-all",
                    active === i ? "border-primary shadow-gold" : "border-border hover:border-primary/50")}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="container sm:px-0 space-y-5 sm:space-y-6 pt-5 sm:pt-0">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-[10px] tracking-luxe uppercase text-primary">{product.category} · {product.gender}</p>
              {product.amazonChoice && <AmazonChoiceBadge />}
            </div>
            <h1 className="font-display text-2xl sm:text-4xl md:text-6xl text-ivory mt-2">{product.name}</h1>
            <p className="font-serif italic text-sm sm:text-lg text-muted-foreground mt-1">{product.tagline}</p>
            <p className="flex items-center gap-1.5 text-xs sm:text-sm text-green-500 mt-2 sm:mt-3">
              <CheckCircle2 className="w-4 h-4" /> In Stock — ready to ship
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted")} />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="flex items-end gap-3 flex-wrap">
            <span className="font-display text-xl sm:text-4xl text-gold">{formatINR(unitPrice)}</span>
            {unitCompareAt && <span className="text-sm sm:text-lg text-muted-foreground line-through">{formatINR(unitCompareAt)}</span>}
            {unitCompareAt && (
              <span className="text-[11px] sm:text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-sm">
                Save {Math.round((1 - unitPrice / unitCompareAt) * 100)}%
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground -mt-3 sm:-mt-2">Inclusive of all taxes · Free shipping above ₹499</p>

          {/* Volume selector */}
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-primary mb-2">Size</p>
            <div className="flex gap-2 sm:gap-3">
              {vols.map(v => (
                <button key={v} onClick={() => setVolume(v)}
                  className={cn("flex-1 sm:flex-none px-3 sm:px-5 py-2 border rounded-sm text-xs sm:text-sm transition-all",
                    selectedVol === v ? "border-primary text-primary shadow-gold" : "border-border text-muted-foreground hover:border-primary/50")}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">{product.description}</p>

          {/* Qty + Actions */}
          <div className="flex items-center gap-3 pt-1 sm:pt-2">
            <div className="flex items-center border border-border rounded-sm">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 sm:p-3 hover:text-primary"><Minus className="w-4 h-4" /></button>
              <span className="px-4 sm:px-5 font-serif text-base sm:text-lg">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-2.5 sm:p-3 hover:text-primary"><Plus className="w-4 h-4" /></button>
            </div>
            <Button variant="luxury" size="lg" className="hidden lg:flex flex-1"
              onClick={() => { addToCart(product, qty, selectedVol); toast.success(`Added ${qty} × ${product.name} (${selectedVol})`); }}>
              Add to Cart
            </Button>
            <Button variant="outline-gold" size="lg" onClick={() => toggleWishlist(product.id)} className="px-4 flex-1 lg:flex-none">
              <Heart className={cn("w-4 h-4", wished && "fill-primary")} />
              <span className="lg:hidden ml-2 text-sm">{wished ? "Wishlisted" : "Wishlist"}</span>
            </Button>
          </div>
          <Button variant="ivory" size="xl" className="hidden lg:flex w-full" onClick={buyNow}>
            Buy Now — {formatINR(unitPrice * qty)}
          </Button>

          {/* Trust badges — compact strip, always visible */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
            {[
              { Icon: Truck, t: "Free Shipping", s: "Above ₹499" },
              { Icon: ShieldCheck, t: "Authentic", s: "100% Original" },
              { Icon: Sparkles, t: "Gift Wrap", s: "Complimentary" },
            ].map(t => (
              <div key={t.t} className="text-center">
                <t.Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" strokeWidth={1.2} />
                <p className="text-[11px] sm:text-xs text-ivory leading-tight">{t.t}</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground leading-tight">{t.s}</p>
              </div>
            ))}
          </div>

          {/* Everything else — collapsed into an accordion so the mobile page
              isn't an endless scroll of boxes. */}
          <Accordion type="single" collapsible defaultValue="notes" className="pt-1">
            <AccordionItem value="notes">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Fragrance Pyramid</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <NoteRow label="Top" items={product.notes.top} />
                <NoteRow label="Heart" items={product.notes.heart} />
                <NoteRow label="Base" items={product.notes.base} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performance">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Longevity &amp; Projection</AccordionTrigger>
              <AccordionContent>
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
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="description">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Full Description</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed space-y-3">
                <p>{product.description}</p>
                <p>Best suited for: {product.occasions.join(", ")}. Mood: {product.moods.join(", ")}.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ingredients">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Ingredients</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                <p>{product.ingredients}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reviews">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Reviews ({product.reviews})</AccordionTrigger>
              <AccordionContent className="space-y-4">
                {[
                  { n: "Aisha M.", t: "Stunning. The longevity is unreal. Compliments all day." },
                  { n: "Rohan K.", t: "Worth every rupee. The packaging alone feels like a gift." },
                  { n: "Priya S.", t: "My new signature scent. Subtle, sophisticated, addictive." },
                ].map((r, i) => (
                  <div key={i} className="border border-border p-4 rounded-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-primary text-primary" />)}
                      </div>
                      <span className="text-sm text-primary">{r.n}</span>
                    </div>
                    <p className="text-muted-foreground mt-2 font-serif italic text-sm">"{r.t}"</p>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="why" className="border-b-0">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">The Itrawala Difference</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { Icon: Award, t: "Long-Lasting", d: "Up to 12 hours of sillage." },
                    { Icon: Leaf, t: "Premium Oils", d: "Aged absolutes & naturals." },
                    { Icon: ShieldCheck, t: "Skin-Friendly", d: "Dermatologist tested." },
                    { Icon: Sparkles, t: "Luxury Packaging", d: "Hand-wrapped, gift-ready." },
                  ].map(f => (
                    <div key={f.t} className="text-center">
                      <f.Icon className="w-6 h-6 text-primary mx-auto mb-2" strokeWidth={1.2} />
                      <h3 className="font-serif text-sm text-ivory">{f.t}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{f.d}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </section>

      <RecentlyViewed excludeId={product.id} />

      {/* Related */}
      <section className="container py-10 md:py-16">
        <div className="text-center mb-6 md:mb-12">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">You May Also Love</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ivory mt-2">Related Fragrances</h2>
          <div className="gold-divider w-24 mx-auto mt-4" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
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
