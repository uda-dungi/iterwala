-- ─────────────────────────────────────────────────────────────────────────────
-- Admin CMS schema — run once in the Supabase SQL Editor, after supabase-tables.sql.
--
-- Moves catalogue + site content out of build-time source files and into the
-- database so the admin dashboard can edit them without a redeploy.
--
-- Replaces, at runtime:
--   src/data/products.ts  → products, product_images, collections, site_settings
--   HeroCarousel.tsx      → banners
--   site.ts announcements → announcements
--
-- src/data/products.ts stays in the repo as the offline SNAPSHOT: it renders the
-- store instantly on first paint and keeps the site up if the database is
-- unreachable. The DB is the source of truth; the snapshot is the fallback.
--
-- SAFETY MODEL
--   • anon may SELECT published rows only. It may never INSERT/UPDATE/DELETE.
--   • Every write goes through /api/admin/* using the SERVICE ROLE key, which
--     bypasses RLS — so the API's own admin check is the real gate. See
--     api/_lib/adminAuth.ts.
--   • Prices live here now, which means this table decides what customers are
--     charged. api/_lib/prices.ts (the old hand-copied mirror) is retired.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Products ─────────────────────────────────────────────────────────────────
-- id is TEXT, not uuid: existing ids ("p-celebrity", "ce-shabd") are already
-- referenced by offer rules, analytics events and live orders. Regenerating them
-- would orphan historical data, so they carry over verbatim.
create table if not exists public.products (
  id                text primary key,
  slug              text unique not null,
  name              text not null,
  tagline           text,
  description       text,
  ingredients       text,

  category          text not null,          -- Perfume | Attar | Gift Set | Collector's Edition
  gender            text not null default 'Unisex',

  -- Money. numeric, never float — binary floats can't represent 0.1 exactly and
  -- rupee totals must reconcile to the paisa against PayU.
  price             numeric(10,2) not null,
  compare_at        numeric(10,2),
  price_by_volume   jsonb,                  -- {"50ml":{"price":649,"compareAt":1099}}

  volumes           text[] default '{}',    -- selectable sizes, in display order
  featured_volume   text,                   -- size the shop card prices/pictures
  variant_label     text,                   -- "Size" | "Variant" | "Lineup"
  content_by_volume jsonb,                  -- per-variant tagline/description/ingredients

  notes             jsonb default '{"top":[],"heart":[],"base":[]}'::jsonb,
  longevity         text,
  projection        text,
  occasions         text[] default '{}',
  moods             text[] default '{}',

  rating            numeric(2,1) default 4.5,
  reviews_count     integer default 0,

  badge             text,                   -- "Bestseller" | "Signature" | …
  best_seller       boolean default false,
  new_arrival       boolean default false,
  trending          boolean default false,
  amazon_choice     boolean default false,
  amazon_url        text,
  video_url         text,

  -- Soft delete. Hard-deleting breaks the product URL and any live ad pointing at
  -- it, and orphans the order history that references this id.
  archived          boolean default false,
  position          integer default 0,      -- manual sort within the shop grid

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists products_slug_idx     on public.products (slug) where archived = false;
create index if not exists products_category_idx on public.products (category) where archived = false;

-- ── Product images ───────────────────────────────────────────────────────────
-- One row per photo so galleries can be reordered without rewriting a JSON blob.
--
-- Two hosting sources, deliberately:
--   'repo'      — the 851 images already committed under src/assets/. Served free
--                 from Vercel's CDN with immutable content-hash caching. `storage_key`
--                 is the path below src/assets/, resolved through a Vite glob map at
--                 runtime (the built URL carries a build-specific hash, so the final
--                 URL can never be stored here).
--   'cloudinary'— anything uploaded from the admin dashboard. `url` is absolute.
--
-- Keeping both means zero migration of existing photography and no bandwidth bill
-- for it, while new uploads still work instantly. The image host is swappable later
-- by adding a source value — the storefront reads through one resolver.
create table if not exists public.product_images (
  id           uuid primary key default gen_random_uuid(),
  product_id   text not null references public.products(id) on delete cascade,

  -- null = the product's general gallery. A value scopes this photo to one size,
  -- mirroring galleryByVolume in the old Product type.
  volume       text,

  source       text not null default 'cloudinary' check (source in ('repo','cloudinary')),
  storage_key  text,   -- source='repo':       "product-gallery-3/Maati/321.jpg"
  url          text,   -- source='cloudinary': absolute https URL
  alt          text,
  position     integer default 0,
  created_at   timestamptz default now(),

  -- Whichever source is set must carry its own locator.
  constraint product_images_locator check (
    (source = 'repo'       and storage_key is not null) or
    (source = 'cloudinary' and url         is not null)
  )
);

create index if not exists product_images_product_idx on public.product_images (product_id, volume, position);

-- ── Hero banners ─────────────────────────────────────────────────────────────
create table if not exists public.banners (
  id           uuid primary key default gen_random_uuid(),
  source       text not null default 'cloudinary' check (source in ('repo','cloudinary')),
  storage_key  text,
  url          text,
  -- Separate mobile art. Optional: falls back to the desktop image when unset.
  -- Mobile artwork carries its own baked-in headline, so the phone carousel shows the
  -- image plus a CTA and none of the text fields below.
  mobile_source      text check (mobile_source in ('repo','cloudinary')),
  mobile_storage_key text,
  mobile_url         text,
  -- 'cover' fills the 9:16 frame; 'contain' letterboxes. Artwork shot at 4:5 loses
  -- roughly a third of its width to a 9:16 cover crop, taking the baked-in headline
  -- with it, so those need 'contain'.
  mobile_fit         text default 'cover' check (mobile_fit in ('cover','contain')),

  eyebrow      text,
  headline     text,
  -- Second line, rendered under the headline in italic gold ("Buy 1 Get 1 Free").
  -- Desktop only — mobile artwork carries its own copy.
  highlight    text,
  subtext      text,
  cta_label    text,
  cta_href     text,

  position     integer default 0,
  active       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Existing installs: `create table if not exists` above will not add a column to a
-- table that already exists, so bring mobile_fit in explicitly.
alter table public.banners add column if not exists mobile_fit text default 'cover';
alter table public.banners add column if not exists highlight  text;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'banners_mobile_fit_check'
  ) then
    alter table public.banners
      add constraint banners_mobile_fit_check check (mobile_fit in ('cover','contain'));
  end if;
end $$;

-- ── Announcement bar ─────────────────────────────────────────────────────────
create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  position   integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

-- ── Shop-by-collection tiles ─────────────────────────────────────────────────
create table if not exists public.collections (
  id           uuid primary key default gen_random_uuid(),
  key          text unique not null,   -- matches products.category
  title        text not null,
  blurb        text,
  sub          text[] default '{}',    -- tag chips under the title
  source       text default 'repo' check (source in ('repo','cloudinary')),
  storage_key  text,
  url          text,
  position     integer default 0,
  active       boolean default true,
  updated_at   timestamptz default now()
);

-- ── Site settings ────────────────────────────────────────────────────────────
-- Key/value so a new setting never needs a migration. Values are jsonb, so a
-- setting can hold a string, a number, or a list (e.g. new_launch_slugs).
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

-- ── Audit log ────────────────────────────────────────────────────────────────
-- Prices are editable through a web form now. When a total looks wrong, this is
-- what answers "who changed it, to what, and when".
create table if not exists public.admin_audit (
  id          uuid primary key default gen_random_uuid(),
  actor_email text,
  action      text not null,          -- 'create' | 'update' | 'delete' | 'reorder'
  entity      text not null,          -- 'product' | 'banner' | …
  entity_id   text,
  before      jsonb,
  after       jsonb,
  created_at  timestamptz default now()
);

create index if not exists admin_audit_created_idx on public.admin_audit (created_at desc);

-- ── Row level security ───────────────────────────────────────────────────────
-- Public read of published rows; no public writes anywhere. Admin writes run with
-- the service role key, which bypasses RLS entirely — so there is deliberately no
-- INSERT/UPDATE/DELETE policy for anon or authenticated on any table below.
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.banners        enable row level security;
alter table public.announcements  enable row level security;
alter table public.collections    enable row level security;
alter table public.site_settings  enable row level security;
alter table public.admin_audit    enable row level security;

drop policy if exists "public read products"       on public.products;
drop policy if exists "public read product_images" on public.product_images;
drop policy if exists "public read banners"        on public.banners;
drop policy if exists "public read announcements"  on public.announcements;
drop policy if exists "public read collections"    on public.collections;
drop policy if exists "public read site_settings"  on public.site_settings;

create policy "public read products" on public.products
  for select to anon, authenticated using (archived = false);

-- Images of archived products stay hidden too, or a delisted product's photos
-- would still be enumerable.
create policy "public read product_images" on public.product_images
  for select to anon, authenticated using (
    exists (select 1 from public.products p where p.id = product_id and p.archived = false)
  );

create policy "public read banners"       on public.banners       for select to anon, authenticated using (active);
create policy "public read announcements" on public.announcements for select to anon, authenticated using (active);
create policy "public read collections"   on public.collections   for select to anon, authenticated using (active);
create policy "public read site_settings" on public.site_settings for select to anon, authenticated using (true);

-- admin_audit gets no select policy at all: it records who changed prices and is
-- readable only through the service role.

-- ── updated_at maintenance ───────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch    on public.products;
drop trigger if exists banners_touch     on public.banners;
drop trigger if exists collections_touch on public.collections;

create trigger products_touch    before update on public.products    for each row execute function public.touch_updated_at();
create trigger banners_touch     before update on public.banners     for each row execute function public.touch_updated_at();
create trigger collections_touch before update on public.collections for each row execute function public.touch_updated_at();
