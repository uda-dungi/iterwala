-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: dispatch tracking + the two transactional emails around it.
--
-- Run in the Supabase SQL Editor. Safe to run more than once.
--
-- Adds:
--   1. Tracking details the admin fills in once a courier has collected the parcel.
--   2. Timestamps recording which emails have already gone out.
--
-- The timestamps matter more than they look. PayU can post its payment callback more
-- than once for the same order, and the admin can save the tracking form twice. Both
-- send paths check their timestamp first, so a repeat never sends a duplicate email to
-- a customer or re-notifies the shop.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders add column if not exists tracking_id   text;
alter table public.orders add column if not exists carrier       text;
-- Full tracking URL. Stored rather than derived: courier URL formats change, and a
-- link saved with the order keeps working for an old order after that happens.
alter table public.orders add column if not exists tracking_url  text;
alter table public.orders add column if not exists dispatched_at timestamptz;

-- Email idempotency guards.
alter table public.orders add column if not exists admin_notified_at    timestamptz;
alter table public.orders add column if not exists shipped_email_sent_at timestamptz;

-- Finding "everything paid but not yet dispatched" is the admin's daily job, so it
-- gets an index rather than a full scan of the orders table.
create index if not exists orders_awaiting_dispatch_idx
  on public.orders (created_at desc)
  where status = 'paid' and tracking_id is null;
