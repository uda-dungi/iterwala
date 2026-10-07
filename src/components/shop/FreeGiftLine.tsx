import { Gift } from "lucide-react";
import { Product, imageFor } from "@/data/products";
import { FREE_GIFT_LABEL, FREE_GIFT_VOLUME } from "@/lib/freeGift";
import { formatINR } from "@/store/shop";

/** The Karwa Chauth free gift as a cart row — fixed at ₹0, no quantity or remove controls. */
export function FreeGiftLine({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <div className="flex gap-3 items-center rounded-sm border border-primary/40 bg-primary/10 p-3">
      <img src={imageFor(product, FREE_GIFT_VOLUME)} alt={product.name} className={compact ? "w-14 h-16 object-cover rounded-sm" : "w-16 h-20 object-cover rounded-sm"} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-primary flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 shrink-0" /> {FREE_GIFT_LABEL}</p>
        <p className="font-serif text-ivory truncate">{product.name} · {FREE_GIFT_VOLUME}</p>
      </div>
      <span className="text-gold font-serif">{formatINR(0)}</span>
    </div>
  );
}
