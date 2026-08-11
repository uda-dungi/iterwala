import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProduct, imageFor, listingVolume } from "@/data/products";
import { FRIENDSHIP_SALE_ACTIVE } from "@/lib/offers";
import { settleDealPopup } from "@/lib/popupGate";
import { site } from "@/config/site";

/**
 * "Deal of the day" overlay for the Collector's Edition Buy 2 Get 1 offer — product
 * artwork on one side, a live countdown and CTA on the other.
 *
 * The clock runs to local midnight and resets every night, which is what makes this a
 * recurring daily deal rather than a one-off sale timer. Days therefore always reads 00;
 * it's kept in the row because dropping it makes the countdown look like it's mid-way
 * through something rather than a full day's window.
 *
 * Shown at most once per calendar day per browser, and it hands the stage to EmailPopup
 * when it closes (see src/lib/popupGate.ts) so the two never overlap.
 */

const SEEN_KEY = "itr_deal_popup_seen";
/** Long enough not to slam the page on arrival, short enough to still catch a browser. */
const DELAY_MS = 6000;

/** YYYY-MM-DD in the visitor's own timezone — en-CA is the shortest way to that format. */
const today = () => new Date().toLocaleDateString("en-CA");

/** Milliseconds until local midnight. setHours(24,…) rolls into tomorrow correctly, and
 *  handles month/year boundaries and DST shifts without any date arithmetic here. */
function msUntilMidnight(from = Date.now()) {
  const midnight = new Date(from);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - from;
}

const pad = (n: number) => String(n).padStart(2, "0");

function breakdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return [
    { value: pad(Math.floor(total / 86400)), label: "Days" },
    { value: pad(Math.floor((total % 86400) / 3600)), label: "Hours" },
    { value: pad(Math.floor((total % 3600) / 60)), label: "Minutes" },
    { value: pad(total % 60), label: "Seconds" },
  ];
}

export function DealPopup() {
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState(() => msUntilMidnight());

  // Shabd leads the trilogy, so its bottle is the one that carries the artwork.
  const product = useMemo(() => getProduct("shabd"), []);

  useEffect(() => {
    // Nothing to promote with the sale switched off, and nothing to show if this browser
    // already saw it today. Settle on both paths or EmailPopup waits forever.
    if (!FRIENDSHIP_SALE_ACTIVE || !product) {
      settleDealPopup();
      return;
    }
    let seenToday = false;
    try {
      seenToday = localStorage.getItem(SEEN_KEY) === today();
    } catch {
      /* storage blocked — treat as unseen, it just shows once per page load */
    }
    if (seenToday) {
      settleDealPopup();
      return;
    }

    const t = setTimeout(() => {
      setOpen(true);
      try {
        localStorage.setItem(SEEN_KEY, today());
      } catch {
        /* storage blocked — nothing to remember, it simply may show again */
      }
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [product]);

  // Tick only while it's actually on screen.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => setRemaining(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, [open]);

  const close = () => {
    setOpen(false);
    settleDealPopup();
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[96] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" onClick={close} />

          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-sm border border-border shadow-luxury grid sm:grid-cols-2"
            role="dialog"
            aria-label="Deal of the day"
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full text-ivory/70 hover:text-ivory hover:bg-background/30"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product side — light panel so the bottle reads as product photography
                rather than another dark tile. Hidden on the smallest screens, where the
                countdown and CTA are what actually need the room. */}
            <div className="hidden sm:flex flex-col items-center justify-center bg-ivory p-8">
              <img
                src={imageFor(product, listingVolume(product))}
                alt={product.name}
                className="w-full max-w-[220px] object-contain"
              />
              <p className="mt-5 text-xs tracking-[0.4em] uppercase text-deep-brown">{site.brand}</p>
            </div>

            {/* Deal side */}
            <div className="bg-deep-brown p-7 sm:p-9 text-center flex flex-col justify-center">
              <h2 className="font-display text-2xl sm:text-3xl text-gold">Deal of the Day</h2>
              <p className="text-sm text-ivory mt-1.5">This offer expires in:</p>

              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mt-5">
                {breakdown(remaining).map(({ value, label }) => (
                  <div key={label} className="rounded-sm bg-ivory px-1 py-2">
                    <p className="font-serif text-xl sm:text-2xl font-bold text-deep-brown tabular-nums leading-none">
                      {value}
                    </p>
                    <p className="text-[8px] sm:text-[9px] tracking-luxe uppercase text-deep-brown/60 mt-1">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <p className="font-serif text-lg text-ivory mt-6 leading-snug">
                The Collector's Edition
              </p>
              <p className="text-sm text-primary mt-1">Buy 2 Get 1 Free — mix &amp; match</p>
              <p className="text-xs text-ivory/60 mt-1">Shabd · Kahani · Ehsaas</p>

              <Button asChild variant="luxury" size="lg" className="w-full mt-6">
                <Link to="/shop?category=Collector's Edition" onClick={close}>
                  Shop the Trilogy
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
