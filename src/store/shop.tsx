import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product, priceFor, volumesFor } from "@/data/products";

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
  itemCount: number;
};

const ShopCtx = createContext<Ctx | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("itr_cart") || "[]") as CartItem[];
      // Carts saved before size-aware pricing shipped won't have a `volume` — backfill
      // with the product's first size so old sessions don't crash on load.
      return raw.map(i => ({ ...i, volume: i.volume || volumesFor(i.product)[0] }));
    } catch { return []; }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("itr_wish") || "[]"); } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => { localStorage.setItem("itr_cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("itr_wish", JSON.stringify(wishlist)); }, [wishlist]);

  const addToCart = (p: Product, qty = 1, volume?: string) => {
    const vol = volume || volumesFor(p)[0];
    setCart(prev => {
      const ex = prev.find(i => lineKey(i.product.id, i.volume) === lineKey(p.id, vol));
      if (ex) return prev.map(i => lineKey(i.product.id, i.volume) === lineKey(p.id, vol) ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { product: p, qty, volume: vol }];
    });
    setCartOpen(true);
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

  return (
    <ShopCtx.Provider value={{ cart, wishlist, cartOpen, setCartOpen, addToCart, removeFromCart, updateQty, clearCart, toggleWishlist, subtotal, itemCount }}>
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
