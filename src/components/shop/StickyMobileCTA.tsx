import { Product } from "@/data/products";
import { formatINR } from "@/store/shop";
import { Button } from "@/components/ui/button";

/** Sticky Add-to-Cart bar shown on mobile product pages. */
export function StickyMobileCTA({ product, price, onAdd, onBuy }: {
  product: Product;
  price?: number;
  onAdd: () => void;
  onBuy: () => void;
}) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[60] bg-card/95 backdrop-blur-xl border-t border-border p-3 flex items-center gap-3">
      <div className="shrink-0">
        <p className="text-[10px] text-muted-foreground leading-none">{product.name}</p>
        <p className="font-serif text-xl text-gold leading-tight">{formatINR(price ?? product.price)}</p>
      </div>
      <div className="flex gap-2 flex-1">
        <Button variant="outline-gold" size="lg" className="flex-1" onClick={onAdd}>Add</Button>
        <Button variant="luxury" size="lg" className="flex-1" onClick={onBuy}>Buy Now</Button>
      </div>
    </div>
  );
}
