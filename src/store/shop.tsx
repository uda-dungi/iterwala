import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product, priceFor, listingVolume } from "@/data/products";
import { computeOffers, offerNudge, OfferLine } from "@/lib/offers";
import { trackAddToCart } from "@/lib/pixel";

type CartItem = { product: Product; qty: number; volume: string };
/** A cart line is identified by product + size, so 50ml and 100ml of the same fragrance
 *  are tracked (and priced) separately instead of merging into one line. */
const lineKey = (id: string, volume: string) => `${id}::${volume}`;
type Ctx = {
  cart: CartItem[];
  wishlist: string[];
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  addToCart: (p: Product, qty?: number, volume?: string) => void;
  removeFromCart: (id: string, volume: string) => void;
  updateQty: (id: string, volume: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  subtotal: number;
  /** Friendship Sale auto-discount (subtotal is pre-discount; total = subtotal − offerDiscount). */
  offerDiscount: number;
  offers: OfferLine[];
  /** Copy nudging the shopper to complete/extend an offer, or null. */
  offerNudge: string | null;
  itemCount: number;
};

const ShopCtx = createContext<Ctx | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("itr_cart") || "[]") as CartItem[];
      // Carts saved before size-aware pricing shipped won't have a `volume` — backfill
      // with the listing size (matches the bottle photo) so old sessions don't crash.
      return raw.map(i => ({ ...i, volume: i.volume || listingVolume(i.product) }));
    } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("itr_wish") || "[]"); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => { localStorage.setItem("itr_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("itr_wish", JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (p: Product, qty = 1, volume?: string) => {
    const vol = volume || listingVolume(p);
    setCart(prev => {
      const ex = prev.find(i => lineKey(i.product.id, i.volume) === lineKey(p.id, vol));
      if (ex) return prev.map(i => lineKey(i.product.id, i.volume) === lineKey(p.id, vol) ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product: p, qty, volume: vol }];
    });
    setCartOpen(true);
    // Tracked here rather than at each button, so every add-to-cart entry point
    // (shop card, product page, sticky mobile CTA) reports without duplication.
    trackAddToCart({ id: p.id, name: p.name, category: p.category, price: priceFor(p, vol).price, qty });
  };
  const removeFromCart = (id: string, volume: string) =>
    setCart(prev => prev.filter(i => lineKey(i.product.id, i.volume) !== lineKey(id, volume)));
  const updateQty = (id: string, volume: string, qty: number) =>
    setCart(prev => qty <= 0
      ? prev.filter(i => lineKey(i.product.id, i.volume) !== lineKey(id, volume))
      : prev.map(i => lineKey(i.product.id, i.volume) === lineKey(id, volume) ? { ...i, qty } : i));
  const clearCart = () => setCart([]);
  const toggleWishlist = (id: string) =>
    setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + priceFor(i.product, i.volume).price * i.qty, 0), [cart]);
  const itemCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

  // Friendship Sale offers — computed from the same line prices the cart displays; the
  // server re-derives the identical discount in api/checkout/initiate for the real charge.
  const offerState = useMemo(() => {
    const lines = cart.map(i => ({ id: i.product.id, qty: i.qty, unitPrice: priceFor(i.product, i.volume).price }));
    return { ...computeOffers(lines), nudge: offerNudge(lines) };
  }, [cart]);

  return (
    <ShopCtx.Provider value={{ cart, wishlist, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, clearCart, toggleWishlist, subtotal, offerDiscount: offerState.discount, offers: offerState.offers, offerNudge: offerState.nudge, itemCount }}>
      {children}
    </ShopCtx.Provider>
  );
}

export const useShop = () => {
  const c = useContext(ShopCtx);
  if (!c) throw new Error("useShop must be inside ShopProvider");
  return c;
};

export const formatINR = (n: number) => `₹${n.toLocaleString("en-IN")}`;
