/**
 * Vercel Node.js serverless function — POST /api/e
 *
 * The tracking relay's live address. Not a second implementation: the handler,
 * validation and behaviour all live in api/track/event.ts, which this re-exports.
 *
 * The deliberately uninformative path is the point. Content blockers match on request
 * paths, and "/api/track/event" matches the generic tracker rules shipped in the common
 * blocklists — a real hole rather than a theoretical one, because this relay's whole
 * job is recovering the conversions the browser Pixel already loses to those blockers.
 * Being blocked by the same lists means the shoppers whose events we most need are
 * exactly the ones we miss, which is what AddToCart's server coverage was measuring.
 *
 * It cannot be arranged as a fallback instead. A blocker cancels the request down in
 * the network layer: sendBeacon has already returned true by then, so there is no
 * signal to retry on. The first attempt is the one that has to get through.
 *
 * api/track/event.ts stays routable — JS bundles cached in browsers from before this
 * change still POST there, and src/lib/pixel.ts retries against it.
 */
export { default } from "./track/event.js";
