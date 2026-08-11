/**
 * Marketing overlays coordinate through this so two of them can never be on screen at
 * once — the deal popup and the email capture both used to arm their own timers with no
 * knowledge of each other, which on a slow browse could stack one modal on top of another.
 *
 * The deal popup goes first. The email capture arms its triggers only once the deal popup
 * has *settled*, which means either "shown and dismissed" or "decided not to show at all
 * this visit" (sale off, or already seen today). Settling on the not-shown paths matters:
 * without it the email capture would wait forever on the days the deal popup stays hidden.
 */

const SETTLED_EVENT = "itr:deal-popup-settled";

let settled = false;

/** Called by DealPopup as soon as it is out of the way, including when it never opens. */
export function settleDealPopup() {
  if (settled) return;
  settled = true;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SETTLED_EVENT));
}

/** Runs `fn` once the deal popup is out of the way, or immediately if it already is.
 *  Returns an unsubscribe so a component unmounting mid-wait can't fire later. */
export function onDealPopupSettled(fn: () => void): () => void {
  if (settled) {
    fn();
    return () => {};
  }
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SETTLED_EVENT, fn, { once: true });
  return () => window.removeEventListener(SETTLED_EVENT, fn);
}
