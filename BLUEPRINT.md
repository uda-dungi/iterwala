# Storefront Blueprint

**What this is:** a complete build spec for the e-commerce storefront this repo implements, written so the whole thing can be rebuilt for a **different product, brand, theme and layout** while keeping the functionality identical.

**How to use it:** hand this file to Claude Code (or a developer) together with:

1. **A theme reference** — a link to a site whose look you want, or screenshots, or a brand kit.
2. **Your product data** — names, prices, sizes, descriptions, photos.
3. **Your business details** — GST, address, support phone/email, social handles.

Then say: *"Build the site in BLUEPRINT.md. Theme: `<reference>`. Products: `<data>`."*

Everything in **Part 1** is functionality to keep. Everything in **Part 2** is design to replace. Part 3 is the launch checklist.

---

## 0 · Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | React 18 + TypeScript | SPA, no SSR |
| Build | Vite 8 (`@vitejs/plugin-react-swc`) | `vite build` → `dist` |
| Routing | React Router 7 | Code-split routes via `lazy()` |
| Styling | Tailwind 3 + CSS custom properties | All colour via HSL tokens |
| Components | Radix UI primitives + shadcn/ui pattern | 48 primitives in `src/components/ui/` |
| Animation | Framer Motion | Scroll reveals, page transitions |
| Carousel | Embla | Galleries, mobile strips |
| Icons | lucide-react | |
| Toasts | Sonner | |
| Forms | react-hook-form + zod | |
| Auth + DB | Supabase | Passwordless magic link |
| Payments | PayU (India) | Hosted checkout page |
| Email | Resend | Order confirmations |
| PDF | pdfkit | GST invoices, shipping labels |
| Analytics | Meta Pixel + Conversions API | Dual browser/server tracking |
| Hosting | Vercel | `/api/**` auto-deploys as serverless functions |

**Swap notes:** PayU is India-specific — for other markets substitute Stripe/Razorpay and rewrite `api/_lib/payu.ts` + `api/payu/callback.ts` only; nothing else touches the payment provider. Everything else is portable as-is.

---

# PART 1 — FUNCTIONALITY (keep all of this)

## 1 · Routes

### Public (wrapped in `PublicLayout`)

| Path | Page | Purpose |
|---|---|---|
| `/` | Index | Homepage: hero, collections, best sellers, new arrivals, reviews, reels |
| `/shop` | Shop | Full catalogue: filter, sort, search |
| `/product/:slug` | ProductDetail | Gallery, sizes, price, offers, reviews, specs |
| `/cart` | Cart | Line items, coupon entry, totals |
| `/checkout` | Checkout | Contact + address, gift wrap, pay |
| `/order/success` | OrderSuccess | Post-payment confirmation |
| `/order/failed` | OrderFailed | Payment failure + retry |
| `/orders` | Orders | Signed-in order history |
| `/auth` | Auth | Magic-link sign-in |
| `/wishlist` | Wishlist | Saved items |
| `/quiz` | Quiz | Guided product finder |
| `/wholesale` | Wholesale | B2B lead capture form |
| `/about`, `/contact` | About, Contact | Brand + support |
| `/privacy`, `/terms`, `/shipping`, `/returns` | Policy | One component, four `kind` props |
| `*` | NotFound | 404 |

### Admin (wrapped in `AdminLayout` — no storefront chrome)

| Path | Page |
|---|---|
| `/admin/login` | Email-gated sign-in |
| `/admin/orders` | Order dashboard, invoice + label download |

Admin access = signed-in Supabase user whose email is in `VITE_ADMIN_EMAILS`. Enforced client-side for UI and **again server-side** in every `/api/admin/*` route — never trust the client alone.

---

## 2 · Data model

### Product (`src/data/products.ts`)

The catalogue is a typed array in source, not a CMS. Fast, no runtime fetch, version-controlled.

```ts
type Product = {
  id: string;            // "p-celebrity" — stable, used by offers + analytics
  slug: string;          // URL segment
  name: string;
  tagline: string;
  price: number;         // flat fallback price
  compareAt?: number;    // strikethrough MRP
  priceByVolume?: Record<string, { price: number; compareAt?: number }>;
  category: "Perfume" | "Attar" | "Gift Set" | "Collector's Edition";  // ← rename per product line
  gender: "Men" | "Women" | "Unisex";                                   // ← optional facet
  image: string;
  gallery: string[];
  galleryByVolume?: Record<string, string[]>;   // per-size photo sets
  featuredVolume?: string;                      // which size the card shows
  contentByVolume?: Record<string, { tagline?: string; description?: string; ingredients?: string }>;
  variantLabel?: string;                        // "Size" | "Variant" | "Lineup"
  notes: { top: string[]; heart: string[]; base: string[] };  // ← product-specific attrs
  longevity: string;
  projection: string;
  occasions: string[];
  moods: string[];
  ingredients: string;
  description: string;
  rating: number;
  reviews: number;
  badge?: string;         // "Bestseller" | "Signature" | …
  bestSeller?: boolean;
  newArrival?: boolean;
  trending?: boolean;
  amazonChoice?: boolean;
  videoUrl?: string;
  volume?: string[];      // selectable sizes
};
```

**Generalising:** `notes`/`longevity`/`projection`/`occasions`/`moods` are fragrance-specific. Replace with your category's attributes (skincare: skin type, actives, routine step; apparel: fabric, fit, care). Keep the *shape*: a few structured facets that drive filters, plus free text.

**Key helpers** exported alongside:

- `getProduct(slug)`, `priceFor(product, volume)`, `galleryFor(product, volume)`
- `imageFor(product, volume)`, `contentFor(product, volume)`, `listingVolume(product)`
- `volumesFor(product)`, `imageAltFor(product)`

### Image loading pattern

Photos live in `src/assets/<gallery-batch>/<Product>/<Size>/*.jpg` and load via Vite glob:

```ts
const modules = import.meta.glob("../assets/gallery/**/*.{png,jpg,jpeg}",
  { eager: true, import: "default" }) as Record<string, string>;
```

Two rules that matter:

1. **Never throw at module scope.** A missing image returns a placeholder and `console.warn`s. Throwing here white-screens *every* route including `/cart` and `/admin` over one renamed file.
2. **Explicit lead-image ordering.** A `Record<folder, filename[]>` map pins which photo leads each gallery; unlisted files sort alphabetically after. Automated brightness sorting is a reasonable default but always needs manual overrides — text-heavy marketing cards score "dark" and shouldn't lead.

**Compress on import.** Raw exports are 1–6 MB. Resize to 1080px and mozjpeg-recompress (~56% smaller) before committing:

```js
sharp(src).resize(1080, 1080, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true }).toFile(dest);
```

⚠️ **Gitignore raw source archives** (`src/assets/**/*.zip`). A 500 MB zip committed by accident makes `git push` fail with HTTP 408 and is painful to remove from history.

### Supabase tables

Full DDL in `supabase-tables.sql`. Run once in the SQL Editor.

**`orders`** — the important one:

```
id, created_at, updated_at, txnid (unique), user_id → auth.users,
email, phone, name, address (jsonb), items (jsonb),
subtotal, shipping, gift_wrap, total,
status: 'pending' | 'paid' | 'failed',
payu_txn_id, payu_mode,
invoice_no (unique), invoice_date,
fbp, fbc, client_ip, client_ua, external_id   -- Meta match signals
```

**`leads`** — wholesale enquiries. **`subscribers`** — email popup captures.

**RLS:** `leads`/`subscribers` allow anon insert. `orders` allows `select` only where `auth.uid() = user_id`; all writes go through the service-role key server-side, which bypasses RLS.

**Invoice numbering:** `assign_invoice_number(txnid)` — a `SECURITY DEFINER` function over a Postgres sequence. Indian GST requires sequential, unique-per-financial-year numbers (FY runs 1 Apr–31 Mar), which a random `txnid` can't provide. **Idempotent** — PayU can post its callback twice and must not burn a second number.

---

## 3 · Cart & pricing

State lives in `src/store/shop.tsx` (React context), persisted to `localStorage`.

```ts
const { cart, addToCart, updateQty, removeFromCart, clearCart,
        subtotal, itemCount, wishlist, toggleWishlist,
        cartOpen, setCartOpen,
        coupon, setCoupon, couponDiscount, couponResult,
        offers, offerDiscount, offerNudge } = useShop();
```

Cart lines are keyed `${product.id}::${volume}` so two sizes of one product are separate lines.

`formatINR(n)` → `₹1,099` via `toLocaleString("en-IN")`.

### ⚠️ The mirroring rule — most important architectural constraint

Money is computed **twice**: once in the browser for display, once on the server for what's actually charged.

| Browser (display) | Server (charged) |
|---|---|
| `src/lib/offers.ts` | `api/_lib/offers.ts` |
| `src/lib/coupons.ts` | `api/_lib/coupons.ts` |
| `src/data/products.ts` | `api/_lib/prices.ts` |

**These pairs must stay byte-for-byte identical in their pure math.** Each file says so in a header comment. Edit one, edit the other.

Why split at all: the server must never trust a client-sent price. Why mirror: if the cart shows ₹999 and checkout charges ₹1,299, you get chargebacks.

**What is deliberately NOT mirrored:** eligibility rules needing a DB lookup. The welcome coupon is first-order-only, tracked per email — the browser can only show an *optimistic* figure; `/api/coupon/validate` confirms once an email is known and `/api/checkout/initiate` re-checks authoritatively before charging.

### Automatic offers (`offers.ts`)

Cart-level promotions with no code needed:

- **Pair pricing** — every 2 units of product X cost a fixed bundle price.
- **Buy N get cheapest free** — across a mix-and-match group of product IDs.

Each returns `OfferLine { code, label, amount }` so the cart can itemise. A single `FRIENDSHIP_SALE_ACTIVE` flag kills all of it (flip in **both** files).

`offerNudge` returns copy like *"Add one more to get Buy 1 Get 1"* when a cart is one unit short.

### Coupons (`coupons.ts`)

Percentage code (`WELCOME15`, 15% off). Rules:

- **Stacks** on top of automatic offers — applied to the already-discounted subtotal, so they compound rather than double-count.
- **First order only**, tracked by email against paid orders.
- Legacy codes (`WELCOME10`) still accepted at the *current* percentage so old emails don't bounce.
- `hasPreviousPaidOrder()` **fails open** — if Supabase is down, allow the discount. A tracking lookup that's unavailable must not block a real sale.
- Only `status = 'paid'` counts. An abandoned `pending` row must not lock someone out of a discount they never received.

**Surface the code.** A coupon nobody sees converts nothing. Show it in the announcement bar, on the product page as *"Pay only ₹X with code Y"*, and above the cart's promo input.

### Cart reservation timer

30-minute countdown, shown only when the cart holds specific promo items. Stored as an **absolute timestamp** so it resumes across reloads rather than restarting — a timer that resets on refresh is transparently fake.

---

## 4 · Checkout & payment

```
1. Customer fills contact + shipping. No login required.
2. POST /api/checkout/initiate
     ├─ validate cart against server-truth prices
     ├─ recompute offers + coupon server-side
     ├─ silently create-or-find a Supabase auth user for that email
     │    (via magic-link generation — no password ever set)
     ├─ insert orders row, status='pending'
     ├─ capture browser Meta signals (fbp/fbc/ip/ua) onto the row
     ├─ compute PayU hash SERVER-SIDE
     └─ return PayU hosted-page fields
3. Browser auto-submits a hidden form to PayU. Clean the form up after submit.
4. PayU redirects to POST /api/payu/callback
     ├─ verify PayU's response hash   ← never skip
     ├─ flip status to 'paid' | 'failed'
     ├─ assign_invoice_number() if paid
     ├─ send confirmation email (Resend) + relay Purchase to Meta CAPI
     └─ 302 to /order/success | /order/failed
5. Account now exists → customer can magic-link in at /auth and see /orders.
```

**Prepaid only** — no COD anywhere in the flow.

**Why the silent account:** the customer gets order history without ever choosing a password, and you get a real `user_id` on the order for RLS.

**Purchase is NOT relayed through `/api/track/event`.** It fires from the PayU callback where the payment is confirmed and the email/phone are DB-verified. Routing the money event through a client-callable endpoint would mean trusting an unverified POST.

**PayU env:** `PAYU_MERCHANT_KEY`, `PAYU_SALT`, `PAYU_MODE` (`test` | `production`). Test with [PayU's test cards](https://docs.payu.in/docs/test-cards) before going live.

---

## 5 · API surface (Vercel serverless)

```
api/
├── health.ts                 GET  — config check: payuConfigured, payuMode, etc.
├── checkout/initiate.ts      POST — validate, persist, return PayU fields
├── payu/callback.ts          POST — verify hash, finalise, email, CAPI Purchase
├── coupon/validate.ts        POST — authoritative coupon check once email known
├── track/event.ts            POST — relay browser events to Meta CAPI
├── admin/orders.ts           GET  — order list (admin-gated)
├── admin/invoice.ts          GET  — GST invoice PDF
├── admin/label.ts            GET  — shipping label PDF
└── _lib/
    ├── payu.ts               hash generation + verification
    ├── supabaseAdmin.ts      service-role client
    ├── prices.ts             ⚠ mirror of src/data/products.ts
    ├── offers.ts             ⚠ mirror of src/lib/offers.ts
    ├── coupons.ts            ⚠ mirror of src/lib/coupons.ts
    ├── metaCapi.ts           Conversions API sender
    ├── email.ts              Resend wrapper
    ├── invoice.ts            pdfkit GST invoice
    └── shippingLabel.ts      pdfkit label
```

`_lib/` is underscore-prefixed so Vercel treats it as shared code, not routes.

**Conventions:**
- Import shared code with a `.js` extension (`from "../_lib/payu.js"`) — required by Node ESM on Vercel even though the source is `.ts`.
- **Await background work.** Vercel can freeze the function the instant a response is sent, so a detached `.then()` may never run. Await the email send and the CAPI call before responding.
- Tracking and email failures are caught, logged, and swallowed. They must never break checkout.

---

## 6 · Every integration is optional

The single most useful pattern in this codebase:

```ts
export const isSet = (v?: string) =>
  Boolean(v && v.trim() && !v.trim().toLowerCase().startsWith("placeholder"));
```

Every integration checks its own env var and no-ops when blank. Blank PayU key → checkout returns a clear 503. Blank Supabase → forms fall back to a toast. Blank Pixel ID → no tracking calls. **The site always builds and runs.** Fill in a value, redeploy, and the feature activates with zero code change.

Apply this to every third-party service you add.

---

## 7 · Analytics — Meta Pixel + Conversions API

Every event fires **twice**: browser Pixel *and* server CAPI, sharing one `eventID` so Meta de-dupes into a single conversion. CAPI recovers what ad blockers and iOS ITP kill.

Events: `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, `Purchase`.

Hard-won details worth keeping:

- **`fbq("set", "autoConfig", false, pixelId)` before `init`.** Meta's automatic event detection fires its *own* untagged ViewContent/PageView copies which can't be matched to the CAPI copy, so Meta counts both. This dropped event-ID coverage to ~26%.
- `autoConfig:false` also disables automatic advanced matching, so pass `em`/`ph`/`external_id` explicitly in `fbq("init", …)`. fbevents.js hashes them in-browser.
- **Write `_fbp`/`_fbc` yourself** before anything fires. fbevents.js loads async and is what normally writes them, so the first PageView on a fresh visit otherwise sends neither. `_fbc` never exists at all when the script is blocked — exactly the traffic CAPI exists to recover.
- **Capture the buyer's IP/UA at checkout, not in the payment callback.** The callback is a server-to-server POST from the payment provider; using its IP attributes every sale to the provider.
- Hash `external_id` server-side for consistency with `em`/`ph`.
- Relay via `navigator.sendBeacon` so the call survives the page unloading on redirect.
- Purchase is deduped against a `localStorage` log so a refresh on `/order/success` can't double-count.

---

## 8 · Components worth carrying over

| Component | Why it exists |
|---|---|
| `ErrorBoundary` | One bad render shouldn't white-screen the store |
| `PublicLayout` / `AdminLayout` | Admin gets no navbar, cart, or marketing overlays |
| `AnnouncementBar` | Rotating trust lines + the active promo code |
| `CartDrawer` | Slide-out cart, no navigation away |
| `StickyMobileCTA` | Persistent Add/Buy bar on mobile PDP |
| `MobileCarousel` | Horizontal strip with **dot pagination** — a native scrollbar reads as a stray artefact |
| `ProductCard` | `showBadge` prop: badges earn their place on the shop grid, not inside an already-titled "Best Sellers" strip |
| `DealPopup` + `EmailPopup` + `popupGate.ts` | Two overlays that must never stack — see below |
| `RecentlyViewed` | localStorage-backed |
| `Schema.tsx` | JSON-LD Product/Organization for SEO |
| `WhatsAppButton` | Floating support (India) |

### The popup gate

Two marketing overlays with independent timers will eventually stack one modal on another. `popupGate.ts` serialises them: the deal popup goes first, and the email capture arms only once the deal popup has **settled** — meaning *shown and dismissed* **or** *decided not to show at all*. Settling on the not-shown path is essential; without it the email popup waits forever on days the deal popup stays hidden.

### Product card rules

- **Square aspect ratio** (`aspect-square`) to match 1:1 catalogue photos. A 4:5 box crops the sides off every product.
- `h-full` + flex column so tiles in a row share one height and their buttons line up when one card's meta line wraps.
- On mobile the Add to Cart button sits **below** the details in normal flow. An absolutely-positioned overlay button covers the product on touch devices, which have no hover.
- Badges: tiny on mobile (`7px`, normal tracking). Wide letter-spacing makes "EDITOR'S PICK" span most of a card and hide the product.

---

## 9 · Product detail page

Order top to bottom:

1. Breadcrumb
2. Gallery — mobile: full-bleed Embla carousel; desktop: main image + thumbnail grid, click to zoom
3. Title + **share button** (`navigator.share`, clipboard fallback)
4. Rating, stock status
5. Price, strikethrough MRP, save %
6. **Coupon callout** — *"Pay only ₹X with code Y"*
7. Active offer callout
8. Size/variant selector — text pills for sizes, **image-led picker** when variants are different products (a text pill can't convey what's in a gift box)
9. Description
10. Qty + Add to Cart + Buy Now
11. **Delivery + returns block** — the two questions a shopper has at the point of decision. Link to the full policy rather than restating it
12. Trust badges (shipping, authenticity, gift wrap)
13. Product claims row
14. Accordions: notes, longevity, full description, ingredients, specs table
15. **Reviews** — summary panel (average, star-distribution bars) beside a 2-col card grid. Full-width stacked cards strand one line of text across a 1200px row
16. Related products, recently viewed

**Two content-integrity rules learned the hard way:**

1. **Never publish a compliance claim you don't hold.** Certifications (IFRA, organic, cruelty-free certifications) are verifiable credentials — stating one falsely is false advertising. Unverifiable marketing adjectives are fine.
2. **Never publish two contradictory specs.** If a marketplace listing says "Alcohol Free" and your site says "alcohol base", or one says 8-hour longevity and another says 24 — withhold the row and flag it. Don't let a shopper find both.

Same applies to delivery estimates: keep the product-page promise and the shipping policy page in agreement, and drive both from one constant.

---

# PART 2 — THEME & LAYOUT (replace all of this)

## 10 · The design system

All colour is **HSL custom properties** in `src/index.css`, surfaced to Tailwind in `tailwind.config.ts`. Re-theming means editing `:root` — component files need no changes.

```css
:root {
  --background, --foreground
  --card, --card-foreground
  --popover, --popover-foreground
  --primary, --primary-foreground, --primary-glow
  --secondary, --secondary-foreground
  --muted, --muted-foreground
  --accent, --accent-foreground
  --destructive, --destructive-foreground
  --border, --input, --ring
  --radius

  /* brand-specific aliases — rename per brand */
  --ivory, --gold, --gold-soft, --deep-brown, --warm-beige

  --gradient-gold, --gradient-dark, --gradient-radial, --gradient-overlay
  --shadow-luxury, --shadow-card, --shadow-gold
  --transition-luxe
}
```

**Write colours only as HSL triplets** (`40 65% 55%`), never hex. Tailwind wraps them as `hsl(var(--token))`, which lets opacity modifiers like `bg-primary/10` work.

### What the current theme is (and what to change)

| Aspect | Current — luxury fragrance | Replace with |
|---|---|---|
| Mood | Dark, warm, opulent | Your reference |
| Background | Near-black warm `30 15% 6%` | |
| Primary | Gold `40 65% 55%` | Your brand colour |
| Display font | Italiana | |
| Serif | Cormorant Garamond | |
| Sans | Inter | |
| Radius | `0.25rem` (sharp) | |
| Motifs | Gold gradients, gold dividers, `tracking-luxe` (0.3em) | |

**Renaming brand aliases:** if your palette isn't gold/ivory, rename `--gold` → `--brand` etc. and update `tailwind.config.ts` plus the `.text-gold` / `.bg-gradient-gold` utilities together. Keep semantic tokens (`--primary`, `--muted`) as they are — components reference those.

### Utility classes in `index.css`

- `.luxury-card` — the standard card surface
- `.gold-divider` — decorative rule
- `.tracking-luxe` — `letter-spacing: 0.3em`

Rename to match your brand. **Watch `tracking-luxe` on mobile** — 0.3em on a badge or heading overflows narrow screens; drop to normal tracking under `sm:`.

### Dark mode

`darkMode: ["class"]` is configured. The current site is dark-only. If you want both, define the light palette on bare `:root` and the dark overrides under `.dark`.

---

## 11 · Layout patterns to reconsider per brand

These are *this* site's choices, not requirements:

- **Homepage:** video/image hero carousel → collection tiles → best sellers → new arrivals → promise/USP → reviews → Instagram reels → newsletter
- **Shop:** left filter sidebar (desktop) / drawer (mobile), 2-col mobile 4-col desktop grid
- **PDP:** 50/50 split, gallery left, buy column right
- **Mobile:** horizontal card strips with dot pagination, sticky bottom CTA
- **Fonts:** three families (display / serif / sans) may be more than a modern brand wants

**Responsive rules to keep regardless of theme:**

- Mobile-first; `sm:` is the main breakpoint, `lg:` for the desktop PDP split
- Never let an absolutely-positioned element sit permanently over a product photo on mobile
- Hover-only affordances need a non-hover mobile equivalent
- Test every card and badge at **360px** — the narrowest real phone

---

# PART 3 — LAUNCH

## 12 · Environment variables

Copy `.env.example` → `.env` locally. In production set the same keys in **Vercel → Settings → Environment Variables**. Vercel never reads `.env`.

| Variable | Enables |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Auth, order history |
| `SUPABASE_SERVICE_ROLE_KEY` 🔒 | Account creation, order writes |
| `VITE_ADMIN_EMAILS` | Admin dashboard access (comma-separated) |
| `PAYU_MERCHANT_KEY` 🔒, `PAYU_SALT` 🔒 | Payments |
| `PAYU_MODE` | `test` \| `production` |
| `SITE_URL` | Payment redirect URLs (auto-detected if blank) |
| `RESEND_API_KEY` 🔒, `RESEND_FROM_EMAIL` | Order confirmation emails |
| `VITE_GST`, `VITE_BUSINESS_ADDRESS` | Invoice header |
| `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_PHONE`, `VITE_WHATSAPP_NUMBER` | Support surfaces |
| `VITE_INSTAGRAM_HANDLE`, `VITE_FACEBOOK_HANDLE` | Social links |
| `VITE_META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN` 🔒 | Tracking |
| `META_TEST_EVENT_CODE` | Test Events tab — **clear before launch** |

🔒 = secret, server-only, never `VITE_`-prefixed.

⚠️ **`VITE_` variables are compiled into the public bundle.** Anything secret must not carry that prefix.

## 13 · Security headers (`vercel.json`)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: …
```

Plus the SPA rewrite: `/((?!api/).*)` → `/index.html`.

**CSP is the one that breaks things.** Every third-party script needs explicit allowances. For Meta:

```
script-src  'self' https://connect.facebook.net
connect-src 'self' https://connect.facebook.net https://www.facebook.com https://graph.facebook.com
frame-src   https://www.facebook.com https://connect.facebook.net
img-src     'self' data: https:
```

Also allow your Supabase project origin in `connect-src` (both `https://` and `wss://`). Check the browser console after any provider change.

## 14 · Go-live checklist

- [ ] Run `supabase-tables.sql` in the Supabase SQL Editor
- [ ] All env vars set in Vercel **Production** (not just local `.env`)
- [ ] `PAYU_MODE=test` → complete a full test order → confirm the row lands as `paid`
- [ ] Swap to live payment credentials, set `PAYU_MODE=production`, **redeploy** (env changes need a new build)
- [ ] `GET /api/health` → `payuConfigured: true`, correct mode
- [ ] Place one real small order end-to-end before announcing
- [ ] Clear `META_TEST_EVENT_CODE`
- [ ] Meta Events Manager: events arriving, dedup working, match quality reasonable
- [ ] Browser console clean — no CSP violations
- [ ] Test at 360px width
- [ ] Confirm delivery estimate on PDP matches the shipping policy page
- [ ] Confirm no unverified compliance claims anywhere
- [ ] Invoice numbering produces sequential numbers under the current financial year

## 15 · Local development

```bash
npm install
npm run dev        # Vite only — /api routes DO NOT run, checkout will 503
npx vercel dev     # frontend + serverless functions together on one port
npm run build      # production build → dist/
```

Use `vercel dev` whenever touching checkout, coupons, or tracking.

---

## 16 · Build order for the new site

1. Scaffold Vite + React + TS + Tailwind; port `src/components/ui/`
2. Write the new palette into `index.css` + `tailwind.config.ts` from the theme reference
3. Define the `Product` type for the new category; add 2–3 real products
4. Layout shell: PublicLayout, Navbar, Footer, AnnouncementBar
5. Shop grid + ProductCard
6. Product detail page
7. Cart store + CartDrawer + `/cart`
8. Supabase: tables, RLS, auth
9. Checkout + payment provider + callback + `/order/*`
10. Offers + coupons — **both mirrors together**
11. Admin: order list, invoice, label
12. Email confirmations
13. Analytics: Pixel + CAPI
14. Marketing: popups, wishlist, recently viewed, quiz
15. Policy pages, SEO schema, security headers
16. Import the full catalogue + compressed photography
17. Work the go-live checklist

Steps 1–7 give a browsable store. Step 9 makes it transactional. Everything after is optimisation.
