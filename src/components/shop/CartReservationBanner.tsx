import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Timer, X } from "lucide-react";
import { useShop } from "@/store/shop";
import { clearReservation, formatRemaining, readDeadline, startReservation } from "@/lib/cartReservation";

/**
 * "Your cart is reserved" countdown, shown whenever the cart has anything in it — it
 * appears as soon as the first item is added and clears when the cart empties.
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
  // Any non-empty cart starts the clock. It used to be scoped to the two Raksha Bandhan
  // offers, which meant most shoppers never saw a timer at all — including on the cart
  // page itself. Reserving "your cart" rather than "the offer" applies to every product.
  const qualifies = cart.length > 0;

  const [deadline, setDeadline] = useState<number | null>(() => readDeadline());
  const [now, setNow] = useState(() => Date.now());
  // Keyed to the deadline that was dismissed rather than a bare boolean. This component
  // lives in PublicLayout and so never unmounts, so a plain flag would suppress the banner
  // for the whole session with only a refresh able to bring it back.
  const [dismissedFor, setDismissedFor] = useState<number | null>(null);

  // Start / stop the stored reservation as the cart fills and empties.
  useEffect(() => {
    if (qualifies) {
      setDeadline(startReservation());
    } else {
      clearReservation();
      setDeadline(null);
      setDismissedFor(null); // a new add should show the banner again
    }
  }, [qualifies]);

  // Tick while the cart holds anything — keyed on `qualifies`, not on `deadline`, so the
  // loop can't wedge in a state that only a refresh recovers from. Each tick re-reads the
  // stored record instead of trusting the cached copy, so the banner heals itself if the
  // reservation is rewritten anywhere else (another tab, or the clearCart() that runs
  // during the PayU handover in Checkout). Previously this component cached localStorage
  // in React state with no resync path, and since `qualifies` stays true the whole time a
  // cart is full, the start/stop effect above never re-ran — which is why navigating away
  // and back left the banner blank until a manual page refresh.
  useEffect(() => {
    if (!qualifies) return;
    const sync = () => {
      setNow(Date.now());
      setDeadline(readDeadline() ?? startReservation());
    };
    sync();
    const id = setInterval(sync, 1000);
    return () => clearInterval(id);
  }, [qualifies]);

  const remaining = deadline ? deadline - now : 0;
  const show = qualifies && deadline !== null && dismissedFor !== deadline && remaining > 0;
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
              — complete your purchase before your cart is released!
            </p>
            <Link
              to="/checkout"
              className="hidden sm:inline-flex shrink-0 bg-background/90 text-ivory px-4 py-1.5 rounded-sm text-[11px] tracking-luxe uppercase font-semibold whitespace-nowrap hover:bg-background"
            >
              Checkout
            </Link>
            <button
              onClick={() => setDismissedFor(deadline)}
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
