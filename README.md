# Itrawala

Perfume & attar storefront — React + Vite + Tailwind, Supabase for auth/data, PayU for payments. Deployed on
**Hostinger** via a small Node/Express server (`server/index.js`) that serves the built frontend and runs the
checkout API.

## Local dev

```bash
npm install
npm run dev
```

`npm run dev` only runs the Vite frontend (no checkout API) — to test the full checkout flow locally, build the
app and run the real server instead:

```bash
npm run build
npm start        # serves dist/ + the checkout API on http://localhost:3000
```

## Environment variables

Copy `.env.example` → `.env` for local dev. In production, set the same keys under
**Vercel → Project → Settings → Environment Variables**. Everything activates the
moment a real value is present — nothing needs a code change.

| Variable | Where to get it | Required for |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API | Auth, orders history |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (`service_role`, **secret**) | Auto-creating accounts + writing orders |
| `PAYU_MERCHANT_KEY`, `PAYU_SALT` | PayU Dashboard → Settings | Checkout payments |
| `PAYU_MODE` | `test` or `production` | Sandbox vs live PayU |
| `SITE_URL` | Your live domain, e.g. `https://itrawala.in` | PayU redirect URLs (optional — auto-detected otherwise) |

Run `supabase-tables.sql` once in your Supabase SQL editor — it creates the
`leads`, `subscribers`, and `orders` tables with the right row-level-security policies.

## Going live with PayU

1. Get your **Merchant Key** and **Salt** from the PayU dashboard.
2. Set `PAYU_MERCHANT_KEY` / `PAYU_SALT` in your server's environment (see Hostinger section below).
   Use test credentials first with `PAYU_MODE=test` to confirm a full order goes through
   using [PayU's test cards/UPI](https://docs.payu.in/docs/test-cards) and lands in the
   `orders` table as `paid`, redirecting you to `/order/success`.
3. Swap in your **live** Merchant Key/Salt and set `PAYU_MODE=production`. Restart the app.
4. Visit `/api/health` on your live domain to confirm `payuConfigured: true` and
   `payuMode: "production"` before trusting the checkout with real customers.

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

This logic lives in `server/index.js` (+ `server/lib/`), which is what actually runs in
production. The `api/` folder contains the same logic written as Vercel serverless
functions — it's kept only as a reference and is **not used** by the Hostinger deploy;
Hostinger has no equivalent auto-routing for an `/api` folder, which is why checkout
didn't work even after credentials were added — nothing was running that code.

## Logo & homepage banners

Brand assets live in `src/assets/brand/` (`logo.png`, `banner-1.jpg` .. `banner-3.jpg`).
The homepage hero (`src/components/home/HeroCarousel.tsx`) auto-rotates the three
banners every 5s (pauses on hover, respects reduced-motion) — swap the images/copy
in the `slides` array there when creatives change.

## Deploy to Hostinger

This app needs a real Node process to run the checkout API — plain static hosting
(file manager / public_html only, no Node.js option) **cannot** run it. If your
Hostinger plan doesn't show a "Node.js" option in hPanel, checkout must be hosted
elsewhere (e.g. a small separate Node host) with the frontend calling that URL.

If your plan has hPanel → **Advanced → Node.js**:

1. Create a Node.js app in hPanel, pointed at this project's folder.
   - **Node version:** 18 or newer.
   - **Application startup file:** `server/index.js`
   - **Application root:** the folder you upload this repo into.
2. Under the app's environment variables, set the same keys as in `.env.example`:
   `PAYU_MERCHANT_KEY`, `PAYU_SALT`, `PAYU_MODE=production`, `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Leave `SITE_URL` blank
   unless PayU redirects come back to the wrong host. Don't upload `.env` itself with
   live secrets in it if the repo/folder is ever shared publicly.
3. From the app's terminal (or via hPanel's "Run NPM Install"): `npm install`, then
   `npm run build` to produce `dist/`.
4. Start/restart the app — hPanel runs `npm start`, which runs `server/index.js`.
   That single process serves the built frontend **and** the `/api/checkout/initiate`
   and `/api/payu/callback` routes on whatever port/domain Hostinger maps to it.
5. Visit `https://your-domain/api/health` to confirm `payuConfigured: true` and
   `payuMode: "production"` — if either is false/wrong, the env vars in step 2 weren't
   picked up (check spelling and restart the app after editing them).
6. Place one real small order end-to-end before announcing checkout is live.
