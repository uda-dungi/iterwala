import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Product, volumesFor, priceFor } from "@/data/products";
import { useShop, formatINR } from "@/store/shop";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { AmazonChoiceBadge } from "@/components/shop/AmazonChoiceBadge";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  // Card shows the entry-size price (first size in the list, e.g. 50ml) — the product
  // page is where the shopper picks a size and sees that size's price.
  const defaultVolume = volumesFor(product)[0];
  const cardImage = product.galleryByVolume?.[defaultVolume]?.[0] ?? product.image;
  const { price: cardPrice, compareAt: cardCompareAt } = priceFor(product, defaultVolume);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="group relative"
    >
      <Link to={`/product/${product.slug}`} className="block luxury-card">
        <div className="relative aspect-[4/5] overflow-hidden bg-deep-brown">
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
            {product.badge && (
              <span className="text-[10px] tracking-luxe uppercase px-3 py-1 bg-gradient-gold text-primary-foreground font-semibold">
                {product.badge}
              </span>
            )}
            {product.amazonChoice && <AmazonChoiceBadge />}
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
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-500" />

          {/* Always visible on mobile (no hover there) — only hides-then-reveals-on-hover from sm+ up */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-500">
            <button
              onClick={(e) => { e.preventDefault(); addToCart(product, 1, volumesFor(product)[0]); toast.success(`${product.name} added to cart`); }}
              className="w-full bg-gradient-gold text-primary-foreground py-2 sm:py-3 text-[10px] sm:text-xs tracking-luxe uppercase font-semibold flex items-center justify-center gap-1.5 sm:gap-2 hover:shadow-gold transition-shadow"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add to Cart
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-5 text-center space-y-1 sm:space-y-1.5">
          <p className="text-[9px] sm:text-[10px] tracking-luxe uppercase text-muted-foreground">{product.category} · {product.gender}</p>
          <h3 className="font-serif text-sm sm:text-xl text-ivory group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
          <p className="hidden sm:block text-xs italic text-muted-foreground/80">{product.tagline}</p>
          <div className="flex items-center justify-center gap-1 pt-0.5 sm:pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={cn("w-2.5 h-2.5 sm:w-3 sm:h-3", i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted")} />
            ))}
            <span className="text-[9px] sm:text-[10px] text-muted-foreground ml-1">({product.reviews})</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            <span className="font-serif text-sm sm:text-lg text-gold">{formatINR(cardPrice)}</span>
            {cardCompareAt && <span className="text-[10px] sm:text-xs text-muted-foreground line-through">{formatINR(cardCompareAt)}</span>}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
