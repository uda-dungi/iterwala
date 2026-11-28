-- Shabd / Ehsaas / Kahani Premium Attars (10ml). Safe to re-run; touches only these ids.
begin;

insert into public.products (
  id, slug, name, tagline, description, ingredients, category, gender,
  price, compare_at, price_by_volume, volumes, featured_volume, variant_label,
  content_by_volume, notes, longevity, projection, occasions, moods,
  rating, reviews_count, badge, best_seller, new_arrival, trending,
  amazon_choice, amazon_url, video_url, position
) values (
  'a-shabd-premium-attar', 'shabd-premium-attar', 'Shabd Premium Attar', 'Premium concentrated attar', 'Shabd (शब्द – ''word'') Premium Attar brings Itrawala''s Shabd fragrance to a concentrated attar oil. It opens with the rich elegance of saffron and rose, moves into a smoky, smooth heart of bakhoor incense and settles into deep agarwood (oud) for a warm, woody finish.

Fragrance profile: The top notes are Saffron and Rose; the heart brings Bakhoor (Incense); and the base settles on Agarwood (Oud). Together these notes give Shabd Premium Attar an oriental, smoky and woody character, presented as a concentrated attar fragrance oil to be dabbed on the pulse points.

Its saffron-and-oud character suits evenings, weddings and festive wear, and makes a thoughtful gift for oud lovers.

Shabd is also available as an Extrait De Parfum. Order Shabd Premium Attar from Itrawala and find the fragrance that speaks without words.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Saffron","Rose"],"heart":["Bakhoor (Incense)"],"base":["Agarwood (Oud)"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  111
)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, tagline = excluded.tagline,
  description = excluded.description, ingredients = excluded.ingredients,
  category = excluded.category, gender = excluded.gender,
  price = excluded.price, compare_at = excluded.compare_at,
  price_by_volume = excluded.price_by_volume, volumes = excluded.volumes,
  featured_volume = excluded.featured_volume, variant_label = excluded.variant_label,
  content_by_volume = excluded.content_by_volume, notes = excluded.notes,
  longevity = excluded.longevity, projection = excluded.projection,
  occasions = excluded.occasions, moods = excluded.moods,
  rating = excluded.rating, reviews_count = excluded.reviews_count,
  badge = excluded.badge, best_seller = excluded.best_seller,
  new_arrival = excluded.new_arrival, trending = excluded.trending,
  amazon_choice = excluded.amazon_choice, amazon_url = excluded.amazon_url,
  video_url = excluded.video_url, position = excluded.position;

insert into public.products (
  id, slug, name, tagline, description, ingredients, category, gender,
  price, compare_at, price_by_volume, volumes, featured_volume, variant_label,
  content_by_volume, notes, longevity, projection, occasions, moods,
  rating, reviews_count, badge, best_seller, new_arrival, trending,
  amazon_choice, amazon_url, video_url, position
) values (
  'a-ehsaas-premium-attar', 'ehsaas-premium-attar', 'Ehsaas Premium Attar', 'Premium concentrated attar', 'Ehsaas (एहसास – ''feeling'') Premium Attar brings Itrawala''s Ehsaas fragrance to a concentrated attar oil. It opens with the juicy freshness of ripe pomegranate, unfolds into the soft floral richness of tuberose and rests on a smooth, comforting trail of creamy vanilla.

Fragrance profile: It opens with Pomegranate, unfolds into a heart of Tuberose and rests on a base of Vanilla. Together these notes give Ehsaas Premium Attar a fruity, floral and sweet character, presented as a concentrated attar fragrance oil to be dabbed on the pulse points.

Its bright, gentle character works for daily wear and all seasons, and is a graceful choice for gifting.

Ehsaas is also available as an Extrait De Parfum. Shop Ehsaas Premium Attar online at Itrawala and wear a fragrance that feels personal.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Pomegranate"],"heart":["Tuberose"],"base":["Vanilla"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  112
)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, tagline = excluded.tagline,
  description = excluded.description, ingredients = excluded.ingredients,
  category = excluded.category, gender = excluded.gender,
  price = excluded.price, compare_at = excluded.compare_at,
  price_by_volume = excluded.price_by_volume, volumes = excluded.volumes,
  featured_volume = excluded.featured_volume, variant_label = excluded.variant_label,
  content_by_volume = excluded.content_by_volume, notes = excluded.notes,
  longevity = excluded.longevity, projection = excluded.projection,
  occasions = excluded.occasions, moods = excluded.moods,
  rating = excluded.rating, reviews_count = excluded.reviews_count,
  badge = excluded.badge, best_seller = excluded.best_seller,
  new_arrival = excluded.new_arrival, trending = excluded.trending,
  amazon_choice = excluded.amazon_choice, amazon_url = excluded.amazon_url,
  video_url = excluded.video_url, position = excluded.position;

insert into public.products (
  id, slug, name, tagline, description, ingredients, category, gender,
  price, compare_at, price_by_volume, volumes, featured_volume, variant_label,
  content_by_volume, notes, longevity, projection, occasions, moods,
  rating, reviews_count, badge, best_seller, new_arrival, trending,
  amazon_choice, amazon_url, video_url, position
) values (
  'a-kahani-premium-attar', 'kahani-premium-attar', 'Kahani Premium Attar', 'Premium concentrated attar', 'Kahani (कहानी – ''story'') Premium Attar brings Itrawala''s Kahani fragrance to a concentrated attar oil. It opens with the sparkle of grapefruit and the subtle warmth of pink pepper, moves into a heart of gentle ginger spice and jasmine, and finishes on rich incense blended with creamy sandalwood.

Fragrance profile: Top notes of Grapefruit and Pink Pepper lead into heart notes of Ginger and Jasmine, finishing on base notes of Incense and Sandalwood. Together these notes give Kahani Premium Attar a citrus, spicy and woody character, presented as a concentrated attar fragrance oil to be dabbed on the pulse points.

Its fresh-to-warm character moves easily from work to evening outings and celebrations, and makes a thoughtful gift.

Kahani is also available as an Extrait De Parfum. Add Kahani Premium Attar to your cart at Itrawala and let every wear tell its own story.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Grapefruit","Pink Pepper"],"heart":["Ginger","Jasmine"],"base":["Incense","Sandalwood"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  113
)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, tagline = excluded.tagline,
  description = excluded.description, ingredients = excluded.ingredients,
  category = excluded.category, gender = excluded.gender,
  price = excluded.price, compare_at = excluded.compare_at,
  price_by_volume = excluded.price_by_volume, volumes = excluded.volumes,
  featured_volume = excluded.featured_volume, variant_label = excluded.variant_label,
  content_by_volume = excluded.content_by_volume, notes = excluded.notes,
  longevity = excluded.longevity, projection = excluded.projection,
  occasions = excluded.occasions, moods = excluded.moods,
  rating = excluded.rating, reviews_count = excluded.reviews_count,
  badge = excluded.badge, best_seller = excluded.best_seller,
  new_arrival = excluded.new_arrival, trending = excluded.trending,
  amazon_choice = excluded.amazon_choice, amazon_url = excluded.amazon_url,
  video_url = excluded.video_url, position = excluded.position;

delete from public.product_images where product_id in ('a-shabd-premium-attar', 'a-ehsaas-premium-attar', 'a-kahani-premium-attar');
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-shabd-premium-attar', NULL, 'repo', 'product-gallery-3/Shabd Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-shabd-premium-attar', NULL, 'repo', 'product-gallery-3/Shabd Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-shabd-premium-attar', NULL, 'repo', 'product-gallery-3/Shabd Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-shabd-premium-attar', NULL, 'repo', 'product-gallery-3/Shabd Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-shabd-premium-attar', NULL, 'repo', 'product-gallery-3/Shabd Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-ehsaas-premium-attar', NULL, 'repo', 'product-gallery-3/Ehsaas Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-ehsaas-premium-attar', NULL, 'repo', 'product-gallery-3/Ehsaas Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-ehsaas-premium-attar', NULL, 'repo', 'product-gallery-3/Ehsaas Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-ehsaas-premium-attar', NULL, 'repo', 'product-gallery-3/Ehsaas Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-ehsaas-premium-attar', NULL, 'repo', 'product-gallery-3/Ehsaas Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-kahani-premium-attar', NULL, 'repo', 'product-gallery-3/Kahani Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-kahani-premium-attar', NULL, 'repo', 'product-gallery-3/Kahani Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-kahani-premium-attar', NULL, 'repo', 'product-gallery-3/Kahani Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-kahani-premium-attar', NULL, 'repo', 'product-gallery-3/Kahani Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-kahani-premium-attar', NULL, 'repo', 'product-gallery-3/Kahani Premium Attar/5.jpg', 4);

commit;
