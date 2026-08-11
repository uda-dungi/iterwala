import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/store/shop";
import {
  clearReservation,
  formatRemaining,
  isReservableProduct,
  readDeadline,
  startReservation,
} from "@/lib/cartReservation";

/**
 * "Your cart is reserved" countdown for the Raksha Bandhan Sale products — the Pack of 4
 * (Buy 1 Get 1) and the Collector's Edition (Buy 2 Get 1). Scoped to those via
 * offerForProduct(), the same function that decides whether a product shows an offer
 * badge, so the timer never appears on a product with no offer to lose.
 *
 * Rendered in three places, all driven by the one hook below so the copies can never
 * disagree with each other:
 *   - the sticky header (CartReservationBanner, mounted in Navbar) — visible site-wide
 *   - the cart drawer footer (CartReservationNotice) — the drawer is an overlay that
 *     covers the header, so without its own copy the timer is hidden at exactly the
 *     moment a shopper adds a qualifying product
 *   - the cart page summary (CartReservationNotice)
 */

/** Shared countdown state. The record in localStorage is the single source of truth and is
 *  re-read every tick rather than cached, because these components live in PublicLayout and
 *  never unmount — a cached copy that drifted out of sync used to stay wrong until a manual
 *  page refresh (navigating cart → checkout and back left the banner blank). */
function useCartReservation() {
  const { cart } = useShop();
  const qualifies = cart.some((i) => isReservableProduct(i.product.id));

  const [deadline, setDeadline] = useState<number | null>(() => readDeadline());
  const [now, setNow] = useState(() => Date.now());

  // Start / stop the stored reservation as qualifying items come and go.
  useEffect(() => {
    if (qualifies) {
      setDeadline(startReservation());
    } else {
      clearReservation();
      setDeadline(null);
    }
  }, [qualifies]);

  // Keyed on `qualifies` rather than on `deadline`, so the loop cannot wedge in a state
  // that only a refresh recovers from, and re-syncs from storage on every tick.
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
  return {
    deadline,
    remaining,
    active: qualifies && deadline !== null && remaining > 0,
    // Last 5 minutes — swap to a red treatment so the urgency actually escalates.
    urgent: remaining > 0 && remaining <= 5 * 60 * 1000,
  };
}

/**
 * Full-width bar for the sticky header. Rides along with the header rather than being
 * pinned to the bottom of the viewport: at the bottom it sat in dark-on-dark under the
 * mobile Add-to-Cart bar and the WhatsApp bubble, and shoppers simply didn't see it.
 */
export function CartReservationBanner() {
  const { deadline, remaining, active, urgent } = useCartReservation();
  // Keyed to the deadline that was dismissed rather than a bare boolean: this component
  // never unmounts, so a plain flag would suppress the bar for the whole session with only
  // a refresh able to bring it back. A new reservation window shows again.
  const [dismissedFor, setDismissedFor] = useState<number | null>(null);

  return (
    <AnimatePresence>
      {active && dismissedFor !== deadline && (
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

/**
 * Compact inline countdown for the cart drawer footer and the cart page summary — sized to
 * sit alongside the offer nudge rather than shout over it. Not dismissable: it's inline
 * content the shopper scrolls past, not an overlay demanding to be closed.
 */
export function CartReservationNotice({ className }: { className?: string }) {
  const { remaining, active, urgent } = useCartReservation();
  if (!active) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-sm border px-3 py-2 text-xs",
        urgent
          ? "border-destructive/50 bg-destructive/10 text-destructive"
          : "border-primary/40 bg-primary/10 text-primary",
        className
      )}
      role="status"
    >
      <Timer className="w-3.5 h-3.5 shrink-0 animate-pulse" />
      <span>
        Cart reserved for{" "}
        <span className="font-serif text-sm font-bold tabular-nums tracking-wide">
          {formatRemaining(remaining)}
        </span>{" "}
        — complete your purchase before the offer expires!
      </span>
    </div>
  );
}
