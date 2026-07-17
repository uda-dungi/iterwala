import { Link } from "react-router-dom";
import { products, imageFor, listingVolume, priceFor } from "@/data/products";
import { formatINR } from "@/store/shop";
import { useRecentlyViewed } from "@/store/recentlyViewed";

/** Horizontal strip of recently-viewed products. Renders nothing if fewer than 2. */
export function RecentlyViewed({ excludeId, title = "Recently Viewed" }: { excludeId?: string; title?: string }) {
  const ids = useRecentlyViewed();
  const items = ids
    .filter(id => id !== excludeId)
    .map(id => products.find(p => p.id === id))
    .filter(Boolean)
    .slice(0, 6) as typeof products;

  if (items.length < 2) return null;

  return (
    <section className="container py-16">
      <div className="text-center mb-10">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Pick Up Where You Left Off</p>
        <h2 className="font-display text-3xl md:text-4xl text-ivory mt-2">{title}</h2>
      </div>
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x">
        {items.map(p => {
          const defaultVolume = listingVolume(p);
          const cardImage = imageFor(p, defaultVolume);
          const { price: cardPrice } = priceFor(p, defaultVolume);
          return (
            <Link key={p.id} to={`/product/${p.slug}`}
              className="luxury-card group shrink-0 w-44 snap-start">
              <div className="aspect-[4/5] overflow-hidden bg-deep-brown">
                <img src={cardImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div className="p-3 text-center">
                <h3 className="font-serif text-base text-ivory group-hover:text-primary transition-colors truncate">{p.name}</h3>
                <p className="text-sm text-gold mt-0.5">{formatINR(cardPrice)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
