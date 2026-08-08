import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
 * Sticky "your cart is reserved" countdown, shown only while the cart holds a Pack of 4
 * or a Collector's Edition bottle (the two Raksha Bandhan Sale offers).
 *
 * The clock is driven off the cart's *contents* rather than hooked into addToCart: that
 * way it also starts correctly for a cart restored from localStorage on a fresh page load,
 * and it stops the moment the last qualifying item is removed — neither of which an
 * add-time hook would catch.
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

  // Mobile product pages carry their own sticky Add-to-Cart bar at bottom-0 (z-60), which
  // would otherwise sit on top of this banner. Measure it and stack above it instead of
  // hard-coding a height that would drift the moment that bar changes.
  const { pathname } = useLocation();
  const [liftPx, setLiftPx] = useState(0);
  useLayoutEffect(() => {
    if (!show) return;
    const measure = () => {
      const cta = document.querySelector("[data-sticky-cta]") as HTMLElement | null;
      setLiftPx(cta ? cta.getBoundingClientRect().height : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [show, pathname]);

  // The floating WhatsApp button is pinned bottom-right and would overlap the banner.
  // Publishing our height as a CSS variable lets it lift out of the way (see index.css)
  // without this component needing to know anything about it.
  const barRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (!show) {
      root.style.removeProperty("--reservation-bar-h");
      return;
    }
    const h = (barRef.current?.getBoundingClientRect().height ?? 0) + liftPx;
    root.style.setProperty("--reservation-bar-h", `${Math.round(h)}px`);
    return () => root.style.removeProperty("--reservation-bar-h");
  }, [show, liftPx, remaining > 0]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={barRef}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ bottom: liftPx }}
          className="fixed inset-x-0 z-40 border-t border-primary/40 bg-deep-brown/95 backdrop-blur"
          role="status"
        >
          <div className="container flex items-center gap-3 py-2.5 pr-12 sm:pr-14">
            <Timer className="w-5 h-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-sm text-ivory leading-snug">
                Your cart is reserved for{" "}
                <span className="font-serif text-gold tabular-nums text-sm sm:text-base">{formatRemaining(remaining)}</span>{" "}
                minutes — complete your purchase before the offer expires!
              </p>
            </div>
            <Link
              to="/checkout"
              className="hidden sm:inline-flex shrink-0 bg-gradient-gold text-primary-foreground px-5 py-2 rounded-sm text-[11px] tracking-luxe uppercase font-semibold whitespace-nowrap"
            >
              Checkout
            </Link>
          </div>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss reservation timer"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-ivory"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
