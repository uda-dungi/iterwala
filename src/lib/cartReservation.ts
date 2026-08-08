/**
 * Cart reservation countdown — a 30-minute urgency timer shown while the cart holds a
 * product that's part of the Raksha Bandhan Sale (Pack of 4 Buy-1-Get-1, or the
 * Collector's Edition Buy-2-Get-1). Deliberately scoped to those two offers only, via
 * offerForProduct() in src/lib/offers.ts — the same function that decides whether to show
 * an offer badge, so the timer can never appear on a product with no offer to lose.
 *
 * The deadline is stored as an absolute timestamp rather than a remaining duration, so
 * closing the tab and coming back resumes exactly where it left off (a duration would
 * silently pause while the site wasn't open). Once it hits zero the timer disappears;
 * nothing about the cart or the pricing actually changes, so an expiry can't leave a
 * shopper stuck or charged differently.
 */

import { offerForProduct } from "@/lib/offers";

export const RESERVATION_MINUTES = 30;
const RESERVATION_MS = RESERVATION_MINUTES * 60 * 1000;
const STORAGE_KEY = "itr_cart_reservation";

/** True when this product carries one of the two sale offers the timer is meant for. */
export const isReservableProduct = (productId: string): boolean => Boolean(offerForProduct(productId));

/** The stored deadline, or null when there isn't one / it's unreadable. Deadlines already
 *  in the past are still returned — see startReservation() for why that matters. */
export function readDeadline(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const at = Number(JSON.parse(raw)?.expiresAt);
    return Number.isFinite(at) ? at : null;
  } catch {
    return null;
  }
}

/** Starts the countdown if this cart doesn't already have one.
 *
 *  An *expired* deadline deliberately counts as "already has one", so a reload after the
 *  clock runs out doesn't hand out a fresh 30 minutes. Without that, the banner vanishes
 *  at 00:00 but springs back to 30:00 on the next page load — which both contradicts the
 *  "before the offer expires" copy and makes the countdown obviously meaningless. The
 *  record is only dropped when the cart stops qualifying (clearReservation), so the next
 *  genuine add-to-cart starts a real new window. */
export function startReservation(): number | null {
  try {
    const existing = readDeadline();
    if (existing !== null) return existing;
    const expiresAt = Date.now() + RESERVATION_MS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ expiresAt }));
    return expiresAt;
  } catch {
    return null;
  }
}

export function clearReservation() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked — the timer simply won't persist */
  }
}

/** mm:ss for a remaining-milliseconds value, clamped at 00:00. */
export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
