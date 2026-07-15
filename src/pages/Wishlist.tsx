import { Link } from "react-router-dom";
import { Heart, Trash2 } from "lucide-react";
import { useShop, formatINR } from "@/store/shop";
import { products } from "@/data/products";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/ProductCard";

export default function Wishlist() {
  const { wishlist } = useShop();
  const items = products.filter(p => wishlist.includes(p.id));

  return (
    <div className="container py-16">
      <div className="text-center mb-12">
        <Heart className="w-10 h-10 text-primary mx-auto mb-4" strokeWidth={1.2} />
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Saved for Later</p>
        <h1 className="font-display text-5xl md:text-6xl text-ivory mt-3">Your Wishlist</h1>
        <div className="gold-divider w-24 mx-auto mt-6" />
      </div>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Button asChild variant="luxury" size="lg" className="mt-6"><Link to="/shop">Discover Fragrances</Link></Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
