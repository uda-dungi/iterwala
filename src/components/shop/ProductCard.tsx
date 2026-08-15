import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product, imageFor, listingVolume, priceFor } from "@/data/products";
import { useShop, formatINR } from "@/store/shop";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AmazonChoiceBadge } from "@/components/shop/AmazonChoiceBadge";
import { offerForProduct } from "@/lib/offers";

/** `showBadge` turns off the plain product badge (Bestseller / Heritage / Signature /
 *  Editor's Pick) and the Amazon's Choice pill. The homepage's curated strips are already
 *  titled "Best Sellers" / "New Arrivals", so repeating that on every tile was just noise
 *  over the bottle — those labels earn their place on the shop grid, where nothing else
 *  distinguishes one tile from the next. Offer badges always show: they're an active
 *  promotion, not a label. */
export function ProductCard({ product, index = 0, showBadge = true }: { product: Product; index?: number; showBadge?: boolean }) {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  const offer = offerForProduct(product.id);
  // Card shows the bottle photo's size (featuredVolume / galleryByVolume) so the
  // price on the tile always matches the ml printed on the bottle.
  const defaultVolume = listingVolume(product);
  const cardImage = imageFor(product, defaultVolume);
  const { price: cardPrice, compareAt: cardCompareAt } = priceFor(product, defaultVolume);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group relative h-full"
    >
      {/* h-full + flex column so tiles in a row share one height and their Add to Cart
          buttons line up — "Perfume · Unisex" wraps to two lines where "Attar · Unisex"
          fits on one, which otherwise left neighbouring cards visibly uneven. */}
      <Link to={`/product/${product.slug}`} className="flex h-full flex-col luxury-card">
        {/* Square to match the catalogue's 1:1 product photos — a 4:5 box cropped the
            sides off every bottle (worst on small mobile cards). */}
        <div className="relative aspect-square overflow-hidden bg-deep-brown">
          {/* Kept small on mobile — these used to be wide enough (0.3em tracking) to
              cover the bottle in the card photo on narrow screens. */}
          <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 z-10 flex flex-col items-start gap-1 sm:gap-1.5">
            {/* MRP-discount badge — same styling as the old Independence Day "Save 25%"
                badge, shown on any card with a strikethrough compareAt. */}
            {cardCompareAt && (
              <span className="text-[7px] sm:text-[10px] tracking-wide sm:tracking-luxe uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary text-primary-foreground font-semibold rounded-sm shadow-gold">
                Save 15%
              </span>
            )}
            {/* The offer badge wins the spot — hide the plain product badge alongside it
                so small mobile cards don't stack two labels over the same corner. */}
            {offer ? (
              <span className="text-[7px] sm:text-[10px] tracking-wide sm:tracking-luxe uppercase px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary text-primary-foreground font-semibold rounded-sm shadow-gold">
                {offer.badge}
              </span>
            ) : (
              showBadge && product.badge && (
                <span className="text-[7px] sm:text-[10px] tracking-wide sm:tracking-luxe uppercase px-1.5 sm:px-3 py-0.5 sm:py-1 bg-gradient-gold text-primary-foreground font-semibold rounded-sm">
                  {product.badge}
                </span>
              )
            )}
            {showBadge && product.amazonChoice && <AmazonChoiceBadge className="text-[7px] sm:text-[10px] px-1.5 py-0.5 sm:px-2 sm:py-1" />}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
              toast.success(wished ? "Removed from wishlist" : "Added to wishlist");
            }}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-background/60 backdrop-blur flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
            aria-label="Wishlist"
          >
            <Heart className={cn("w-4 h-4", wished && "fill-primary text-primary")} />
          </button>
          <img
            src={cardImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-110"
          />
          {/* Desktop-only scrim, and only while hovering — on mobile it permanently
              dimmed the bottom of every product photo. */}
          <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-90 transition-opacity duration-500" />

          {/* Desktop keeps the slide-up-on-hover button over the image. On mobile there
              is no hover, so this used to sit permanently across the bottom of the photo
              and hide the bottle — the mobile button now lives below the details instead. */}
          <div className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product, 1, defaultVolume); toast.success(`${product.name} added to cart`); }}
              className="w-full bg-gradient-gold text-primary-foreground py-3 text-xs tracking-luxe uppercase font-semibold flex items-center justify-center gap-2 hover:shadow-gold transition-shadow"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Cart
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-3 sm:p-5 text-center space-y-1.5 sm:space-y-1.5">
          <p className="text-[9px] sm:text-[10px] tracking-luxe uppercase text-muted-foreground">{product.category} · {product.gender}</p>
          <h3 className="font-serif text-base sm:text-xl text-ivory group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
          <p className="hidden sm:block text-xs italic text-muted-foreground/80">{product.tagline}</p>
          <div className="flex items-center justify-center gap-1 pt-0.5 sm:pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted")} />
            ))}
            <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>
          {/* mt-auto pins the price + button block to the bottom, so a card whose meta
              line wraps still ends level with its neighbours. */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2 mt-auto">
            <span className="font-serif text-base sm:text-lg text-gold">{formatINR(cardPrice)}</span>
            {cardCompareAt && <span className="text-[10px] sm:text-xs text-muted-foreground line-through">{formatINR(cardCompareAt)}</span>}
          </div>

          {/* Mobile Add to Cart — in normal flow under the details, so it never covers
              the product photo the way the absolutely-positioned overlay did. Hidden
              from sm+ up, where the hover button over the image takes over. */}
          <button
            onClick={(e) => { e.preventDefault(); addToCart(product, 1, defaultVolume); toast.success(`${product.name} added to cart`); }}
            className="sm:hidden w-full mt-2.5 bg-gradient-gold text-primary-foreground py-2.5 rounded-sm text-[11px] tracking-wide uppercase font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap active:opacity-90 transition-opacity"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" /> Add to Cart
          </button>
        </div>
      </Link>
    </motion.article>
  );
}
