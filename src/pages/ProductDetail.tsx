import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Heart, Minus, Plus, ShieldCheck, Sparkles, Star, Truck, Leaf, Award, CheckCircle2, Share2, Check, Globe, Rabbit, PackageCheck } from "lucide-react";
import { getProduct, products, galleryFor, listingVolume, volumesFor, priceFor, contentFor, imageAltFor } from "@/data/products";
import { seedReviewsFor } from "@/data/reviews";
import { offerForProduct } from "@/lib/offers";
import { trackViewContent } from "@/lib/pixel";
import { CollectorStory } from "@/components/product/CollectorStory";
import { collectorStories } from "@/data/collectorStories";
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
import { WELCOME_CODE, WELCOME_PERCENT } from "@/lib/coupons";
import { isIndependenceDaySaleActive } from "@/lib/independenceDaySale";
import { DELIVERY_ESTIMATE } from "@/config/site";

/**
 * Star distribution for the reviews summary bars.
 *
 * Per-star counts aren't stored — a product only carries an average and a total — so this
 * derives a plausible shape from the average rather than inventing precise counts. The
 * bars are shown as percentages (never as "N people rated this 5 stars") so nothing on
 * screen claims more precision than the data actually has.
 */
function breakdownFor(rating: number): Record<number, number> {
  // Weight each star by how close it is to the average, then normalise to percentages.
  const weights: Record<number, number> = {};
  let total = 0;
  for (let star = 1; star <= 5; star++) {
    const distance = Math.abs(star - rating);
    const w = Math.max(0, 1 - distance / 2.2) ** 3;
    weights[star] = w;
    total += w;
  }
  const pct: Record<number, number> = {};
  for (let star = 1; star <= 5; star++) {
    pct[star] = total > 0 ? Math.round((weights[star] / total) * 100) : 0;
  }
  return pct;
}

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const product = getProduct(slug);
  const { addToCart, toggleWishlist, wishlist, setCartOpen } = useShop();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [volume, setVolume] = useState("");
  const [api, setApi] = useState<CarouselApi>();
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState(() => (product ? seedReviewsFor(product) : []));
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (product) {
      recordView(product.id);
      setVolume(listingVolume(product));
      setQty(1);
      setActive(0);
      // Reseed on every product change — this component stays mounted across
      // /product/:slug navigations, so without this every product kept showing
      // whichever product's reviews were seeded first.
      setReviews(seedReviewsFor(product));
      // Meta ViewContent — keyed on product id so it re-fires when the shopper
      // moves between products without the page remounting.
      trackViewContent({
        id: product.id,
        name: product.name,
        category: product.category,
        price: priceFor(product, listingVolume(product)).price,
      });
    }
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
  const selectedVol = volume || listingVolume(product);
  const { price: unitPrice, compareAt: unitCompareAt } = priceFor(product, selectedVol);
  const gallery = galleryFor(product, selectedVol);
  const content = contentFor(product, selectedVol);
  const productOffer = offerForProduct(product.id);
  const related = products.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);
  const ratingBreakdown = breakdownFor(product.rating);
  const buyNow = () => { addToCart(product, qty, selectedVol); setCartOpen(false); window.location.href = "/checkout"; };

  // Native share sheet where the browser has one (all mobile browsers); otherwise copy
  // the link, which is what a desktop visitor would do by hand anyway.
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `${product.name} — ${content.tagline}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setShared(false), 2000);
    } catch {
      // AbortError just means the shopper dismissed the share sheet — not worth a toast.
    }
  };

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
            <Carousel key={selectedVol} setApi={setApi} opts={{ loop: gallery.length > 1 }}>
              <CarouselContent>
                {gallery.map((g, i) => (
                  <CarouselItem key={i}>
                    <div className="relative aspect-square bg-deep-brown">
                      <img src={g} alt={imageAltFor(product)} className="w-full h-full object-contain" loading={i === 0 ? "eager" : "lazy"} />
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
          <div className="hidden lg:block space-y-4" key={selectedVol}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
              className="relative aspect-square overflow-hidden rounded-sm border border-border bg-deep-brown cursor-zoom-in"
              onClick={() => setZoom(z => !z)}
            >
              <img
                src={gallery[active] ?? gallery[0]}
                alt={imageAltFor(product)}
                className={cn("w-full h-full object-contain transition-transform duration-700", zoom ? "scale-150" : "scale-100")}
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
                  <img src={g} alt={imageAltFor(product)} className="w-full h-full object-contain" />
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
            <div className="flex items-start justify-between gap-3 mt-2">
              <h1 className="font-display text-2xl sm:text-4xl md:text-6xl text-ivory">{product.name}</h1>
              <button
                onClick={share}
                aria-label="Share this product"
                className="shrink-0 mt-1 w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-border text-muted-foreground flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                {shared ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
            <p className="font-serif italic text-sm sm:text-lg text-muted-foreground mt-1">{content.tagline}</p>
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

          {/* Social-proof claim for the Collector's Edition trilogy — sits between the
              rating and the price so it reads as a continuation of the review line. */}
          {product.category === "Collector's Edition" && (
            <div className="inline-flex items-center gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-1.5">
              <Heart className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
              <span className="text-[11px] sm:text-xs tracking-luxe uppercase text-primary font-semibold">Most Loved Collection</span>
            </div>
          )}

          <div className="flex items-end gap-3 flex-wrap">
            <span className="font-display text-xl sm:text-4xl text-gold">{formatINR(unitPrice)}</span>
            {unitCompareAt && <span className="text-sm sm:text-lg text-muted-foreground line-through">{formatINR(unitCompareAt)}</span>}
            {unitCompareAt && (
              <span className="text-[11px] sm:text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-sm">
                Save {Math.round((1 - unitPrice / unitCompareAt) * 100)}%
              </span>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground -mt-3 sm:-mt-2">Inclusive of all taxes · Free shipping on all orders</p>

          {/* What this price becomes with the welcome code — the discount was previously
              only discoverable in the cart, so first-time shoppers compared us at the
              undiscounted number. Says "first order" because that's the actual rule
              (api/_lib/coupons.ts), which checkout re-verifies against the email.
              Hidden during the Independence Day sale — the 25% off is already applied
              automatically, so stacking WELCOME25 here would be confusing. */}
          {!isIndependenceDaySaleActive() && (
            <div className="flex items-start gap-2 rounded-sm border border-primary/40 bg-primary/10 px-3 py-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
                Pay only{" "}
                <span className="text-primary font-semibold">
                  {formatINR(Math.round(unitPrice * (1 - WELCOME_PERCENT / 100)))}
                </span>{" "}
                with code <span className="text-primary font-semibold">{WELCOME_CODE}</span>
                <span className="block text-[10px] sm:text-[11px] text-muted-foreground/80">
                  {WELCOME_PERCENT}% off your first order · applied at checkout
                </span>
              </p>
            </div>
          )}

          {/* Friendship Sale offer callout (only on participating products) */}
          {productOffer && (
            <div className="rounded-sm border border-primary/40 bg-gradient-to-r from-primary/15 to-primary/5 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm sm:text-base font-serif text-ivory">{productOffer.headline}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 pl-6">{productOffer.detail}</p>
            </div>
          )}

          {/* Volume / variant selector. Gift sets where each option is actually a
              different fragrance lineup (product.variantLabel is set) get a bigger,
              image-led picker so the box art itself tells the sets apart — a plain
              text pill like "Signature" vs "Secret Crush" doesn't show what's inside.
              Plain bottle-size products (Perfume/Attar) keep the compact text pills. */}
          <div>
            <p className="text-[10px] tracking-luxe uppercase text-primary mb-2">{product.variantLabel ?? "Size"}</p>
            {product.variantLabel ? (
              <div className="flex gap-3 sm:gap-4 flex-wrap">
                {vols.map(v => {
                  const thumb = product.galleryByVolume?.[v]?.[0] ?? product.image;
                  return (
                    <button key={v} onClick={() => setVolume(v)}
                      className={cn("flex flex-col items-center gap-2 w-24 sm:w-28 p-2 border rounded-sm transition-all",
                        selectedVol === v ? "border-primary shadow-gold" : "border-border hover:border-primary/50")}>
                      <span className="w-full aspect-square overflow-hidden rounded-sm bg-deep-brown">
                        <img src={thumb} alt={v} className="w-full h-full object-cover" />
                      </span>
                      <span className={cn("text-[11px] sm:text-xs text-center leading-tight",
                        selectedVol === v ? "text-primary font-semibold" : "text-muted-foreground")}>
                        {v}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex gap-2 sm:gap-3">
                {vols.map(v => (
                  <button key={v} onClick={() => setVolume(v)}
                    className={cn("flex-1 sm:flex-none px-3 sm:px-5 py-2 border rounded-sm text-xs sm:text-sm transition-all",
                      selectedVol === v ? "border-primary text-primary shadow-gold" : "border-border text-muted-foreground hover:border-primary/50")}>
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">{content.description}</p>

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

          {/* Delivery + returns, directly under the buy buttons — the two questions a
              shopper has at the moment of deciding. Both link out to the full policy
              rather than restating it, so there's one authoritative version. */}
          <div className="rounded-sm border border-border divide-y divide-border">
            <div className="flex items-start gap-2.5 px-3 py-2.5">
              <Truck className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={1.4} />
              <p className="text-xs sm:text-sm text-ivory leading-snug">
                {DELIVERY_ESTIMATE}
                <Link to="/shipping" className="block text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 mt-0.5">
                  Free shipping across India · Shipping policy
                </Link>
              </p>
            </div>
            <div className="flex items-start gap-2.5 px-3 py-2.5">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" strokeWidth={1.4} />
              <p className="text-xs sm:text-sm text-ivory leading-snug">
                Damaged or wrong item? We'll replace or refund it.
                <Link to="/returns" className="block text-[11px] text-muted-foreground hover:text-primary underline underline-offset-2 mt-0.5">
                  Report within 48 hours of delivery · Returns policy
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges — compact strip, always visible */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
            {[
              { Icon: Truck, t: "Free Shipping", s: "On all orders" },
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

          {/* Product claims. Deliberately no "IFRA Certified" badge — that's a real
              compliance certification and this brand hasn't been certified, so claiming
              it would be false advertising. */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
            {[
              { Icon: Globe, t: "Imported Oils" },
              { Icon: Rabbit, t: "Cruelty-Free" },
              { Icon: PackageCheck, t: "Assured Delivery" },
            ].map(t => (
              <div key={t.t} className="text-center">
                <t.Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1.5" strokeWidth={1.1} />
                <p className="text-[10px] sm:text-xs text-ivory leading-tight">{t.t}</p>
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
                <p>{content.description}</p>
                {product.highlights?.length ? (
                  <ul className="space-y-2 pt-1">
                    {product.highlights.map(h => (
                      <li key={h} className="flex gap-2 text-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-1" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <p>Best suited for: {product.occasions.join(", ")}. Mood: {product.moods.join(", ")}.</p>
              </AccordionContent>
            </AccordionItem>

            {/* Only rendered for products with real listing data — see Product.specs. */}
            {product.specs && (
              <AccordionItem value="specs">
                <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Product Details</AccordionTrigger>
                <AccordionContent>
                  <dl className="divide-y divide-border">
                    {Object.entries(product.specs).map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[7.5rem_1fr] sm:grid-cols-[11rem_1fr] gap-3 py-2.5">
                        <dt className="text-[11px] sm:text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                        <dd className="text-xs sm:text-sm text-ivory">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="ingredients">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Ingredients</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                <p>{content.ingredients}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reviews">
              <AccordionTrigger className="text-xs tracking-luxe uppercase text-primary hover:no-underline">Reviews ({product.reviews})</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p className="text-sm text-muted-foreground">See detailed reviews in the dedicated section below, or add your own review.</p>
                <Button variant="outline-gold" size="sm" onClick={() => setReviewFormOpen(v => !v)}>
                  {reviewFormOpen ? "Hide review form" : "Write a review"}
                </Button>
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

      <section className="container py-10 md:py-16">
        <div className="text-center mb-8 md:mb-12">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Customer Reviews</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ivory mt-2">What People Are Saying</h2>
          <div className="gold-divider w-24 mx-auto mt-4" />
        </div>

        {/* Summary panel + review grid. The old layout stacked full-width cards down the
            page, which left a line or two of text stranded across a 1200px row on desktop
            and gave the shopper no at-a-glance sense of the score. */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-10 items-start">
          <div className="luxury-card p-6 sm:p-8 text-center lg:sticky lg:top-28">
            <p className="font-display text-5xl sm:text-6xl text-gold leading-none">{product.rating.toFixed(1)}</p>
            <div className="flex justify-center gap-1 mt-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={cn("w-4 h-4", i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted")} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Based on {product.reviews} reviews</p>

            {/* Distribution derived from the average, not stored per-star — labelled
                "typical" rather than presented as an exact tally we don't have. */}
            <div className="mt-6 space-y-1.5 text-left">
              {[5, 4, 3, 2, 1].map(star => {
                const pct = ratingBreakdown[star] ?? 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-3 tabular-nums">{star}</span>
                    <Star className="w-2.5 h-2.5 fill-primary text-primary shrink-0" />
                    <span className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <span className="block h-full rounded-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <Button variant="outline-gold" size="lg" className="w-full mt-6" onClick={() => setReviewFormOpen(v => !v)}>
              {reviewFormOpen ? "Hide review form" : "Write a review"}
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((review, index) => (
              <div key={index} className="luxury-card p-5 flex flex-col h-full">
                <div className="flex items-center gap-3">
                  {/* Initials avatar — gives each card an anchor so a wall of reviews
                      reads as distinct people rather than one block of text. */}
                  <span className="w-9 h-9 shrink-0 rounded-full bg-gradient-gold text-primary-foreground flex items-center justify-center font-serif text-sm font-semibold">
                    {review.name.trim().charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-ivory font-medium truncate">{review.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star key={starIndex} className={cn("w-2.5 h-2.5", starIndex < review.rating ? "fill-primary text-primary" : "text-muted")} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed flex-1">{review.text}</p>
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-green-500/90 mt-4 pt-3 border-t border-border">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Verified Buyer
                </p>
              </div>
            ))}
          </div>
        </div>

        {reviewFormOpen && (
          <div className="mt-8 border border-border rounded-sm p-6 bg-deep-brown/80">
            <h3 className="font-display text-xl text-ivory mb-4">Share your review</h3>
            <div className="grid gap-4">
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Your name</span>
                <input
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory focus:border-primary focus:outline-none"
                  placeholder="Aisha M."
                />
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Rating</span>
                <div className="flex items-center gap-2">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <button
                      key={starIndex}
                      type="button"
                      onClick={() => setReviewRating(starIndex + 1)}
                      className="text-amber-300"
                      aria-label={`Rate ${starIndex + 1} star${starIndex === 0 ? "" : "s"}`}
                    >
                      <Star className={cn("w-5 h-5", starIndex < reviewRating ? "fill-primary text-primary" : "text-muted")} />
                    </button>
                  ))}
                </div>
              </label>
              <label className="space-y-2 text-sm text-muted-foreground">
                <span>Your review</span>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory focus:border-primary focus:outline-none"
                  placeholder="Tell us what you loved about this fragrance..."
                />
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <span className="text-xs text-muted-foreground">Your review will appear below once submitted.</span>
                <Button
                  variant="luxury"
                  size="lg"
                  onClick={() => {
                    if (!reviewName.trim() || !reviewText.trim()) {
                      toast.error("Please enter your name and review text.");
                      return;
                    }
                    setReviews(prev => [...prev, { name: reviewName.trim(), rating: reviewRating, text: reviewText.trim() }]);
                    setReviewName("");
                    setReviewText("");
                    setReviewRating(5);
                    toast.success("Thank you! Your review has been added.");
                  }}
                >
                  Submit review
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      <RecentlyViewed excludeId={product.id} />

      {/* Collector's Edition bottles with a bespoke editorial story (Shabd, Kahani,
          Ehsaas) render it here; any other CE product falls back to the photo grid. */}
      {collectorStories[product.slug] && <CollectorStory images={collectorStories[product.slug]} name={product.name} />}

      {product.category === "Collector's Edition" && !collectorStories[product.slug] && (
        <section className="container py-10 md:py-16">
          <div className="text-center mb-6 md:mb-12">
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Collector's Edition</p>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ivory mt-2">All Collector's Edition Photos</h2>
            <div className="gold-divider w-24 mx-auto mt-4" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {products.filter((p) => p.category === "Collector's Edition").map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="group overflow-hidden rounded-xl border border-border bg-background/80 transition hover:-translate-y-1">
                <div className="overflow-hidden bg-slate-950">
                  <img src={p.gallery[0]} alt={imageAltFor(p)} className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {p.gallery.map((photo, index) => (
                      <div key={index} className="aspect-square overflow-hidden rounded-sm border border-border">
                        <img src={photo} alt={imageAltFor(p)} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ivory">{p.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{p.tagline}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
