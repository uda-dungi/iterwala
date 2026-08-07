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

-- ── GST tax invoice numbering ────────────────────────────────────────────────
-- Indian GST rules require invoice numbers to be sequential and unique within a
-- financial year, so they can't be derived from txnid (which is random). A Postgres
-- sequence gives us that atomically even if two payments land at the same instant.
alter table public.orders add column if not exists invoice_no   text unique;
alter table public.orders add column if not exists invoice_date timestamptz;

create sequence if not exists public.invoice_seq start 1;

-- Assigns (once) and returns the invoice number for a paid order. Idempotent: PayU can
-- post its callback more than once, and this must not burn a second number or hand out
-- two different invoice numbers for the same sale.
create or replace function public.assign_invoice_number(p_txnid text)
returns text
language plpgsql
security definer
as $$
declare
  existing text;
  n        bigint;
  fy       text;
  inv      text;
  ist      timestamptz := now() at time zone 'Asia/Kolkata';
begin
  select invoice_no into existing from public.orders where txnid = p_txnid;
  if existing is not null then
    return existing;
  end if;

  select nextval('public.invoice_seq') into n;

  -- Indian financial year runs 1 Apr – 31 Mar, e.g. "2026-27".
  if extract(month from ist) >= 4 then
    fy := to_char(ist, 'YYYY') || '-' || to_char(ist + interval '1 year', 'YY');
  else
    fy := to_char(ist - interval '1 year', 'YYYY') || '-' || to_char(ist, 'YY');
  end if;

  inv := 'ITR/' || fy || '/' || lpad(n::text, 4, '0');

  update public.orders
     set invoice_no = inv, invoice_date = now()
   where txnid = p_txnid and invoice_no is null
  returning invoice_no into inv;

  -- Lost a race with a concurrent call — return whatever actually got stored.
  if inv is null then
    select invoice_no into inv from public.orders where txnid = p_txnid;
  end if;

  return inv;
end;
$$;
