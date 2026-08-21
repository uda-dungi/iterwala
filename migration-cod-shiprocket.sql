-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Cash on Delivery + Shiprocket fulfillment.
--
-- Run in the Supabase SQL Editor. Safe to run more than once.
--
-- 'payu' orders keep the existing pending -> paid|failed lifecycle from PayU's
-- callback. 'cod' orders are written directly by api/checkout/cod.ts with status
-- 'pending' and stay there — there's no separate payment-confirmation step the way
-- PayU has, so 'pending' for a COD order means "confirmed order, cash collected on
-- delivery", not "abandoned". api/admin/orders.ts, api/admin/invoice.ts and
-- api/admin/label.ts all treat payment_method = 'cod' as dispatchable/invoiceable
-- regardless of `status`.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.orders add column if not exists payment_method text not null default 'payu';

-- Shiprocket's own order/shipment ids, stored for reference when the create-order API
-- call succeeds (api/_lib/shiprocket.ts) — null if Shiprocket wasn't configured or the
-- call failed, which never blocks the order itself from being placed.
alter table public.orders add column if not exists shiprocket_order_id text;
alter table public.orders add column if not exists shiprocket_shipment_id text;

-- Finding "COD orders not yet in Shiprocket" is a plausible ops query, same reasoning
-- as orders_awaiting_dispatch_idx in migration-order-tracking.sql.
create index if not exists orders_cod_unsynced_idx
  on public.orders (created_at desc)
  where payment_method = 'cod' and shiprocket_order_id is null;
