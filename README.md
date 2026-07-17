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
