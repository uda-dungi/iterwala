import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Timer, X } from "lucide-react";
import { useShop } from "@/store/shop";
import {
  clearReservation,
  formatRemaining,
  isReservableProduct,
  readDeadline,
  startReservation,
} from "@/lib/cartReservation";

/**
 * "Your cart is reserved" countdown, shown only while the cart holds a Pack of 4 or a
 * Collector's Edition bottle (the two Raksha Bandhan Sale offers).
 *
 * Rendered inside the sticky header (see Navbar) rather than pinned to the bottom of the
 * viewport: at the bottom it sat in dark-on-dark under the mobile Add-to-Cart bar and the
 * WhatsApp bubble, and shoppers simply didn't see it. Riding along with the sticky header
 * keeps it on screen at every scroll position with no z-index or overlap handling at all.
 *
 * The clock is driven off the cart's *contents* rather than hooked into addToCart, so it
 * also starts correctly for a cart restored from localStorage on a fresh page load, and
 * stops the moment the last qualifying item is removed.
 */
export function CartReservationBanner() {
  const { cart } = useShop();
  const qualifies = cart.some((i) => isReservableProduct(i.product.id));

  const [deadline, setDeadline] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [dismissed, setDismissed] = useState(false);

  // Start / stop the reservation as qualifying items come and go.
  useEffect(() => {
    if (qualifies) {
      setDeadline(startReservation());
    } else {
      clearReservation();
      setDeadline(null);
      setDismissed(false); // a new qualifying add should show the banner again
    }
  }, [qualifies]);

  // Tick once a second, but only while something is actually counting down.
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const remaining = deadline ? deadline - now : 0;
  const show = qualifies && !dismissed && remaining > 0;
  // Last 5 minutes — swap to a red treatment so the urgency actually escalates.
  const urgent = remaining > 0 && remaining <= 5 * 60 * 1000;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={
            urgent
              ? "overflow-hidden bg-destructive text-white"
              : "overflow-hidden bg-gradient-gold text-primary-foreground"
          }
          role="status"
        >
          <div className="container flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5">
            <Timer className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-pulse" />
            <p className="flex-1 min-w-0 text-[11px] sm:text-sm font-semibold leading-snug">
              Cart reserved for{" "}
              {/* Solid dark pill rather than a translucent one — over gold, a see-through
                  fill just reads as muddy grey and the digits stop standing out.
                  NOT text-gold here: that utility is gradient-clipped text (it sets its own
                  background + background-clip:text in index.css), which wipes this pill's
                  fill and leaves gold digits on a gold bar — invisible. Plain ivory it is. */}
              <span className="inline-block rounded-sm bg-background px-2 py-0.5 font-serif text-sm sm:text-base font-bold text-ivory tabular-nums tracking-wide align-middle">
                {formatRemaining(remaining)}
              </span>{" "}
              — complete your purchase before the offer expires!
            </p>
            <Link
              to="/checkout"
              className="hidden sm:inline-flex shrink-0 bg-background/90 text-ivory px-4 py-1.5 rounded-sm text-[11px] tracking-luxe uppercase font-semibold whitespace-nowrap hover:bg-background"
            >
              Checkout
            </Link>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss reservation timer"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-background/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
