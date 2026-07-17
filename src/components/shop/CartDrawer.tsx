import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useShop, formatINR } from "@/store/shop";
import { priceFor, imageFor } from "@/data/products";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, removeFromCart, updateQty, subtotal } = useShop();
  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border flex flex-col shadow-luxury"
          >
            <header className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="font-display text-2xl text-gold">Your Bag</h2>
                <p className="text-xs tracking-luxe uppercase text-muted-foreground mt-1">{cart.length} item{cart.length !== 1 && "s"}</p>
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:text-primary transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-serif text-xl">Your bag is empty</p>
                  <p className="text-sm text-muted-foreground mt-2">Discover our finest fragrances.</p>
                  <Button variant="luxury" size="lg" className="mt-6" asChild>
                    <Link to="/shop" onClick={() => setCartOpen(false)}>Explore Shop</Link>
                  </Button>
                </div>
              ) : cart.map(({ product, qty, volume }) => (
                <motion.div key={`${product.id}::${volume}`} layout className="flex gap-4 group">
                  <Link to={`/product/${product.slug}`} onClick={() => setCartOpen(false)} className="shrink-0">
                    <img src={imageFor(product, volume)} alt={product.name} className="w-24 h-28 object-cover rounded-sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-lg text-ivory">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.category} · {volume}</p>
                    <p className="text-sm text-gold mt-1">{formatINR(priceFor(product, volume).price)}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-border rounded-sm">
                        <button onClick={() => updateQty(product.id, volume, qty - 1)} className="p-1.5 hover:text-primary"><Minus className="w-3 h-3" /></button>
                        <span className="px-3 text-sm">{qty}</span>
                        <button onClick={() => updateQty(product.id, volume, qty + 1)} className="p-1.5 hover:text-primary"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(product.id, volume)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {cart.length > 0 && (
              <footer className="border-t border-border p-6 space-y-4 bg-deep-brown/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-serif text-xl text-gold">{formatINR(subtotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Shipping and taxes calculated at checkout.</p>
                <Button asChild variant="luxury" size="lg" className="w-full">
                  <Link to="/checkout" onClick={() => setCartOpen(false)}>Checkout</Link>
                </Button>
                <Button asChild variant="outline-gold" size="lg" className="w-full">
                  <Link to="/cart" onClick={() => setCartOpen(false)}>View Cart</Link>
                </Button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
