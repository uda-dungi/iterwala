-- Optional: run this in your Supabase project (SQL Editor) so the Wholesale lead form
-- and the email-capture popup persist submissions. The site works without it (it falls
-- back to a toast), but these tables let you collect leads & subscribers.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  type text,            -- e.g. 'wholesale'
  name text,
  business text,
  phone text,
  city text,
  email text,
  quantity text,
  message text
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text unique,
  source text           -- e.g. 'exit_popup'
);

-- Allow anonymous inserts from the website (read stays restricted to your dashboard).
alter table public.leads enable row level security;
alter table public.subscribers enable row level security;

create policy "anon insert leads"       on public.leads       for insert to anon with check (true);
create policy "anon insert subscribers" on public.subscribers for insert to anon with check (true);

-- Required for checkout: PayU orders + the auto-created account behind each one.
-- Written by /api/checkout/initiate and /api/payu/callback using the SERVICE ROLE key
-- (never the anon key), so no "anon insert" policy is needed here.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  txnid text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  phone text,
  name text,
  address jsonb,
  items jsonb not null,
  subtotal numeric,
  shipping numeric,
  gift_wrap boolean default false,
  total numeric not null,
  status text not null default 'pending',   -- 'pending' | 'paid' | 'failed'
  payu_txn_id text,
  payu_mode text
);

alter table public.orders enable row level security;

-- Lets a signed-in customer see their own order history (the /orders page uses this).
-- Inserts/updates only ever happen server-side with the service role key, which
-- bypasses RLS entirely — so no insert/update policy is defined for anon/authenticated.
create policy "users read own orders" on public.orders
  for select to authenticated using (auth.uid() = user_id);
