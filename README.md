# Itrawala

Perfume & attar storefront — React + Vite + Tailwind, Supabase for auth/data, PayU for payments, deployed on Vercel.

## Local dev

```bash
npm install
npm run dev
```

`npm run dev` only runs the Vite frontend — Vite's dev server doesn't execute the `/api` serverless functions, so
checkout will 503 locally unless you also run `vercel dev` (Vercel CLI: `npm i -g vercel`, then `vercel dev` from
this folder, which runs both the frontend and the `/api` functions together on one port).

## Environment variables

Copy `.env.example` → `.env` for local dev. In production, set the same keys under
**Vercel → Project → Settings → Environment Variables**. Everything activates the
moment a real value is present — nothing needs a code change.

| Variable | Where to get it | Required for |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API | Auth, orders history |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (`service_role`, **secret**) | Auto-creating accounts + writing orders |
| `VITE_ADMIN_EMAILS` | Comma-separated admin emails | Access to `/admin/orders` order dashboard |
| `PAYU_MERCHANT_KEY`, `PAYU_SALT` | PayU Dashboard → Settings | Checkout payments |
| `PAYU_MODE` | `test` or `production` | Sandbox vs live PayU |
| `SITE_URL` | Your live domain, e.g. `https://itrawala.in` | PayU redirect URLs (optional — auto-detected otherwise) |

Run `supabase-tables.sql` once in your Supabase SQL editor — it creates the
`leads`, `subscribers`, and `orders` tables with the right row-level-security policies.

## Going live with PayU

1. Get your **Merchant Key** and **Salt** from the PayU dashboard.
2. In **Vercel → Project → Settings → Environment Variables**, add `PAYU_MERCHANT_KEY`
   and `PAYU_SALT` (Production environment at minimum — add to Preview too if you want
   preview deploys to work). Adding these only to a local `.env` file does nothing for
   the deployed site — Vercel never reads `.env`, it only reads what's in this dashboard.
3. Set `PAYU_MODE` to `test` first and confirm a full order goes through using
   [PayU's test cards/UPI](https://docs.payu.in/docs/test-cards), lands in the `orders`
   table as `paid`, and redirects to `/order/success`.
4. Swap in your **live** Merchant Key/Salt, set `PAYU_MODE=production`, then **redeploy**
   (Vercel env var changes require a new deployment to take effect — either push a commit
   or hit "Redeploy" in the dashboard).
5. Visit `https://your-domain/api/health` to confirm `payuConfigured: true` and
   `payuMode: "production"` before trusting checkout with real customers.

Checkout is **prepaid-only** — there is no Cash on Delivery option anywhere in the flow.

## How checkout works

1. Customer fills contact + shipping details (no login required) and clicks Pay.
2. `POST /api/checkout/initiate` — validates the order, silently creates (or finds) a
   Supabase auth account for that email via a magic-link generation call, saves an
   `orders` row as `pending`, computes the PayU hash server-side, and returns the
   PayU hosted-page fields.
3. The browser auto-submits a hidden form to PayU.
4. PayU redirects back to `POST /api/payu/callback`, which verifies PayU's response
   hash, flips the order to `paid`/`failed`, and redirects the customer to
   `/order/success` or `/order/failed`.
5. Because an account now exists, the customer can return anytime and sign in with a
   passwordless "magic link" (`/auth`) to see their orders at `/orders` — no password
   was ever required.

This logic lives entirely in `api/checkout/initiate.ts` and `api/payu/callback.ts` —
Vercel automatically deploys everything under `/api` as serverless functions, no extra
config needed. (There's also an unused `server/` folder left over from testing a
different hosting option — it's not part of the Vercel deploy and can be deleted.)

## Dispatch & tracking

Two transactional emails sit either side of fulfilment:

| When | To | Contains |
|---|---|---|
| Payment confirmed | Admin | New-order alert with the **invoice and shipping label attached** — print both straight from the mail |
| Admin saves a tracking ID | Customer | Tracking number, courier, optional tracking link, **invoice attached** |

Add the tracking ID under **Admin → Orders**, on any paid order. Saving records the
courier reference and emails the customer.

Both sends are guarded against duplicates. PayU can post its payment callback more than
once, and an admin may re-save the tracking form to correct a typo — `admin_notified_at`
and `shipped_email_sent_at` mean neither results in a second email. Re-saving updates the
record and tells you plainly that no new email went out, because a second "your order has
shipped" reads to a customer as a second parcel.

Emails require `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. Without them the tracking ID
still saves; only the email is skipped.

**Setup:** run `migration-order-tracking.sql` in the Supabase SQL Editor. Until you do,
the orders dashboard works as normal and shows a note explaining that tracking is not yet
enabled — deploying the code before running the SQL will not break anything.

## Admin dashboard (content management)

`/admin` manages the catalogue and homepage content without a redeploy.

| Section | What it edits |
|---|---|
| **Orders** | Order list, GST invoice + shipping label PDFs |
| **Products** | Add/edit/archive products, prices (incl. per-size), photos, Bestseller / New / Trending flags |
| **Content** | Hero banners, announcement bar, collection tiles, site settings |

### How the data flows

The catalogue lives in Supabase, but `src/data/products.ts` stays in the repo as an
offline **snapshot**. The storefront renders the snapshot instantly on first paint, then
revalidates against the database and swaps in live data. So an admin edit appears within
about a minute, first paint costs no network round trip, and a database outage degrades
to the last-shipped catalogue instead of an empty shop.

`api/_lib/prices.ts` — the hand-copied price mirror that had to be regenerated after
every price change — is no longer authoritative. Checkout now reads prices from the
database via `api/_lib/priceSource.ts`, so a price is authored in exactly one place.
The old table remains only as a pre-seed fallback.

### One-time setup

1. Run `admin-schema.sql` in the Supabase SQL Editor (after `supabase-tables.sql`).
2. Generate and run the catalogue seed:
   ```bash
   npm run seed:catalog     # writes seed-catalog.sql from src/data/products.ts
   ```
   Paste `seed-catalog.sql` into the SQL Editor and run it. It is idempotent, so
   re-running after a fix is safe. This imports all products and maps every photo
   already committed under `src/assets/` — no image migration required.
3. Confirm the storefront still matches, then use `/admin/products` from there on.

If you applied `admin-schema.sql` before the mobile-banner feature existed, also run
`migration-mobile-banner.sql` (or simply re-run `admin-schema.sql` — it is idempotent).

### Hero banners: desktop vs mobile

Each banner holds two images. The desktop one is wide, with the eyebrow/headline/subtext
drawn over it in HTML. The mobile one is tall 9:16 artwork with its headline already baked
into the image, so the phone carousel shows the picture plus a CTA and none of the text
fields. A banner with no mobile image falls back to its desktop image.

**Mobile framing** matters: *Fill* crops to 9:16 and is right for artwork shot at that
ratio. *Fit* letterboxes instead — 4:5 artwork needs it, or roughly a third of its width
is cropped away, taking the baked-in headline with it.

### Images

Two sources coexist:

- **Repo** — the photos already committed under `src/assets/`. Served free from Vercel's
  CDN with immutable content-hash caching. "Pick existing" in the admin attaches one.
- **Cloudinary** — anything uploaded from the dashboard. Set `CLOUDINARY_CLOUD_NAME`,
  `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` to enable the Upload button; without
  them the dashboard still works and "Pick existing" is unaffected.

Uploads go from the browser straight to Cloudinary using a short-lived signature, so the
file never passes through a serverless function (Vercel caps request bodies at ~4.5 MB —
smaller than many phone photos). Delivery applies `f_auto,q_auto` so images are served as
WebP/AVIF at the right size.

The image host is stored per-row (`source` + `storage_key`/`url`), so switching providers
later is a data migration, not a code change.

### Security

Prices are editable through a web form, which makes `/api/admin/*` the boundary that
decides what customers are charged. Every one of those endpoints calls `requireAdmin()`
(`api/_lib/adminAuth.ts`) before any write: the bearer token is verified against Supabase
and the email checked against `VITE_ADMIN_EMAILS`. These handlers run with the service
role key, which bypasses RLS by design — that check is the only gate, not RLS. Public RLS
policies allow anon `select` on published rows and no writes at all.

Every catalogue change is recorded in `admin_audit` with the actor, the before value and
the after value, so a price that looks wrong can be traced.

## Logo & homepage banners

Brand assets live in `src/assets/brand/` (`logo.png`, `banner-1.jpg` .. `banner-3.jpg`).
The homepage hero (`src/components/home/HeroCarousel.tsx`) auto-rotates the three
banners every 5s (pauses on hover, respects reduced-motion) — swap the images/copy
in the `slides` array there when creatives change.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it into Vercel (or run
   `vercel --prod` from this folder with the Vercel CLI). Vercel auto-detects the Vite
   framework — build command `vite build`, output directory `dist` — and auto-deploys
   everything under `/api` as serverless functions.
2. In **Project → Settings → Environment Variables**, add every key from
   `.env.example` (`PAYU_MERCHANT_KEY`, `PAYU_SALT`, `PAYU_MODE`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and optionally `SITE_URL`)
   for the **Production** environment. This is the step that's easy to miss — your
   local `.env` file is git-ignored and never reaches Vercel; these values only exist
   for the deployed app once they're entered here.
3. Redeploy (env var changes don't apply retroactively to a build that already ran).
4. Visit `https://your-domain/api/health` — confirm `payuConfigured: true` and
   `payuMode` matches what you expect. If `false`, double-check the variable names and
   that they're enabled for the Production environment, then redeploy again.
5. Run `supabase-tables.sql` in your Supabase project if you haven't (see above) so
   orders actually get saved, then place one real small order end-to-end before
   announcing checkout is live.
