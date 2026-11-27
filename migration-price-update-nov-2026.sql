-- Price update (Nov 2026), from the owner's voice note:
--   * No 20ml below ~249 (courier cost eats the margin on cheaper bottles).
--   * The new EDP series (Magnet, Gold Chandan, White Oud EDP) must not sell 100ml below 400.
--   * Touch, Wild and White Oud attars were priced ~3x too high; bring them to ~499.
-- Run once in the Supabase SQL editor. Mirrors src/data/products.ts.

begin;

-- Magnet / Gold Chandan / White Oud EDP: 249 / 349 / 449
update public.products set
  price = 449, compare_at = 749,
  price_by_volume = '{"20ml":{"price":249,"compareAt":349},"50ml":{"price":349,"compareAt":499},"100ml":{"price":449,"compareAt":749}}'::jsonb
where id in ('p-magnet-eau-de-parfum-100-ml', 'p-gold-chandan-eau-de-parfum-100-ml', 'p-white-oud-eau-de-parfum-100-ml');

-- Secret Crush EDP: 20ml 180 -> 249
update public.products set
  price_by_volume = jsonb_set(price_by_volume, '{20ml,price}', '249')
where id = 'p-secret-crush-eau-de-parfum-100-ml';

-- Feelings EDP: 20ml 160 -> 249
update public.products set
  price_by_volume = jsonb_set(price_by_volume, '{20ml,price}', '249')
where id = 'p-feelings-eau-de-parfum-100-ml';

-- SRK EDP (20ml only): 175 -> 249
update public.products set
  price = 249,
  price_by_volume = '{"20ml":{"price":249,"compareAt":349}}'::jsonb
where id = 'p-srk-eau-de-parfum-100-ml';

-- Touch / Wild / White Oud attars: 949 -> 499
update public.products set price = 499
where id in ('a-touch', 'a-wild', 'a-white-oud');

commit;
