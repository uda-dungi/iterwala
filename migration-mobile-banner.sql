-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: separate mobile artwork per hero banner.
--
-- Run this in the Supabase SQL Editor if admin-schema.sql was applied BEFORE the
-- mobile banner feature existed. Re-running admin-schema.sql in full does the same
-- thing — everything in it is idempotent — this is just the smaller, focused version.
--
-- Safe to run more than once.
--
-- WHY: banners already carried mobile_source / mobile_storage_key / mobile_url, but
-- nothing recorded how the artwork should fill the frame. Phone artwork shot at 4:5
-- loses roughly a third of its width to a 9:16 cover crop — and the headline is baked
-- into that artwork, so the crop takes the message with it. mobile_fit lets each
-- banner choose.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.banners add column if not exists mobile_source      text;
alter table public.banners add column if not exists mobile_storage_key text;
alter table public.banners add column if not exists mobile_url         text;
alter table public.banners add column if not exists mobile_fit         text default 'cover';

-- Constraints can't be declared "if not exists", so add them only when absent.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'banners_mobile_fit_check') then
    alter table public.banners
      add constraint banners_mobile_fit_check check (mobile_fit in ('cover','contain'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'banners_mobile_source_check') then
    alter table public.banners
      add constraint banners_mobile_source_check
      check (mobile_source is null or mobile_source in ('repo','cloudinary'));
  end if;
end $$;

-- Existing rows predate the column and would otherwise be NULL, which the storefront
-- would read as "no preference". Default them to the common case.
update public.banners set mobile_fit = 'cover' where mobile_fit is null;
