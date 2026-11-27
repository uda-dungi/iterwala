-- New products from ITRAWALA SEO Optimized Product Upload (28). Safe to re-run; touches only these ids.
begin;

insert into public.products (
  id, slug, name, tagline, description, ingredients, category, gender,
  price, compare_at, price_by_volume, volumes, featured_volume, variant_label,
  content_by_volume, notes, longevity, projection, occasions, moods,
  rating, reviews_count, badge, best_seller, new_arrival, trending,
  amazon_choice, amazon_url, video_url, position
) values (
  'a-srk-premium-attar', 'srk-premium-attar', 'SRK Premium Attar', 'Premium concentrated attar', 'SRK Premium Attar is a premium attar described as a majestic blend of woods, spices and timeless elegance.

Fragrance profile: The top notes are Italian Cypress, Myrtle and Rose; the heart brings Sandalwood and Cedar; and the base settles on Brazilian Rosewood, Spices, Amber and White Musk. Together these notes give SRK Premium Attar a woody, spicy and amber character, presented as a concentrated attar fragrance oil.

Its woody-spicy character suits evening wear, special occasions and gifting.

Explore SRK Premium Attar at Itrawala and add a distinctive premium attar to your collection.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Italian Cypress","Myrtle","Rose"],"heart":["Sandalwood","Cedar"],"base":["Brazilian Rosewood","Spices","Amber","White Musk"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  83
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
  'p-srk-eau-de-parfum-100-ml', 'srk-eau-de-parfum-100-ml', 'SRK Eau De Parfum', 'Long-lasting Eau De Parfum', 'SRK Eau De Parfum 100 ml is an Eau De Parfum described as a majestic blend of woods, spices and timeless elegance.

Fragrance profile: It opens with Italian Cypress, Myrtle and Rose, unfolds into a heart of Sandalwood and Cedar and rests on a base of Brazilian Rosewood, Spices, Amber and White Musk. Together these notes give SRK Eau De Parfum a woody, spicy and amber character, presented as a ready-to-spray Eau De Parfum in a 100 ml bottle.

Its woody-spicy character suits evening wear and special occasions, and the 100 ml bottle makes a generous gift.

Shop SRK Eau De Parfum (100 ml) online at Itrawala and add a distinctive Eau De Parfum to your collection.', 'Premium fragrance oils, French-grade base.',
  'Perfume', 'Unisex',
  249, 349, '{"20ml":{"price":249,"compareAt":349}}'::jsonb,
  ARRAY['20ml']::text[], '20ml', NULL,
  NULL, '{"top":["Italian Cypress","Myrtle","Rose"],"heart":["Sandalwood","Cedar"],"base":["Brazilian Rosewood","Spices","Amber","White Musk"]}'::jsonb,
  '18 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  84
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
  'a-omg-premium-attar', 'omg-premium-attar', 'OMG Premium Attar', 'Premium concentrated attar', 'OMG Premium Attar is a premium attar described as a bold blend of spices, sweet indulgence and lasting sensuality.

Fragrance profile: Top notes of Cinnamon, Cardamom and Ginger lead into heart notes of Praline, Candied Fruits and White Flowers, finishing on base notes of Coffee Arabica, Vanilla, Tonka Bean, Benzoin and Musk. Together these notes give OMG Premium Attar a gourmand, spicy and sweet character, presented as a concentrated attar fragrance oil.

Its sweet-spicy, gourmand character is made for evenings, celebrations and gifting.

Order OMG Premium Attar from Itrawala and make it part of your fragrance routine.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Cinnamon","Cardamom","Ginger"],"heart":["Praline","Candied Fruits","White Flowers"],"base":["Coffee Arabica","Vanilla","Tonka Bean","Benzoin","Musk"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  85
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
  'a-oud-forest-premium-attar', 'oud-forest-premium-attar', 'Oud Forest Premium Attar', 'Premium concentrated attar', 'Oud Forest Premium Attar is a premium attar described as a refreshing blend of citrus, exotic oud and warm amber.

Fragrance profile: The top notes are Grapefruit, Rosemary and Sea Shore Citrus; the heart brings Agarwood, Rose and Spicy; and the base settles on Musky and Ambery. Together these notes give Oud Forest Premium Attar an oud, citrus and amber character, presented as a concentrated attar fragrance oil.

Its fresh-meets-woody character fits a wide range of occasions and makes a distinctive gift for oud lovers.

Find Oud Forest Premium Attar at Itrawala and enjoy a premium attar that stands apart from the usual.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Grapefruit","Rosemary","Sea Shore Citrus"],"heart":["Agarwood","Rose","Spicy"],"base":["Musky","Ambery"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  86
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
  'a-wanted-premium-attar', 'wanted-premium-attar', 'Wanted premium attar', 'Premium concentrated attar', 'Wanted Premium Attar is a premium attar built on a cardamom opening, a toffee heart and an amberwood base.

Fragrance profile: It opens with Cardamom, unfolds into a heart of Toffee and rests on a base of Amberwood. Together these notes give Wanted Premium Attar a spicy, sweet and amber character, presented as a concentrated attar fragrance oil.

Its warm, sweet-spicy profile suits evenings and makes a fitting gift.

Shop Wanted Premium Attar online at Itrawala and bring home a fragrance with real character.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Men',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Cardamom"],"heart":["Toffee"],"base":["Amberwood"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  87
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
  'a-rebel-premium-attar', 'rebel-premium-attar', 'Rebel Premium Attar', 'Premium concentrated attar', 'Rebel Premium Attar is a premium attar described as bold, earthy and unforgettable, with a fruity opening over a woody base.

Fragrance profile: It opens with Pineapple, Mandarin and Granny Smith Apple, unfolds into a heart of Cedarwood, Oakmoss and Vanilla and rests on a base of Caramel, Dry Woods, Ambergris and Musk. Together these notes give Rebel Premium Attar a fruity, woody and earthy character, presented as a concentrated attar fragrance oil.

Its bold, woody-fruity character suits those who like a statement scent, and works well as a gift.

Discover Rebel Premium Attar online at Itrawala, a thoughtful pick for yourself or someone special.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Pineapple","Mandarin","Granny Smith Apple"],"heart":["Cedarwood","Oakmoss","Vanilla"],"base":["Caramel","Dry Woods","Ambergris","Musk"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  88
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
  'a-poetry-premium-attar', 'poetry-premium-attar', 'Poetry Premium Attar', 'Premium concentrated attar', 'Poetry Premium Attar is a premium attar that opens with sparkling citrus and flows into a fruity-floral heart.

Fragrance profile: Top notes of Orange, Bergamot and Grapefruit lead into heart notes of Litchi, Rose and Italian Jasmine, finishing on base notes of Indonesian Patchouli, Haitian Vetiver, Bourbon Vanilla and White Musk. Together these notes give Poetry Premium Attar a citrus, floral and fruity character, presented as a concentrated attar fragrance oil.

Its bright, floral-fruity character is a graceful choice for gifting and special days.

Add Poetry Premium Attar to your cart at Itrawala and experience its character for yourself.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Orange","Bergamot","Grapefruit"],"heart":["Litchi","Rose","Italian Jasmine"],"base":["Indonesian Patchouli","Haitian Vetiver","Bourbon Vanilla","White Musk"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  89
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
  'a-forever-jasmine-premium-attar', 'forever-jasmine-premium-attar', 'Forever Jasmine Premium Attar', 'Premium concentrated attar', 'Forever Jasmine Premium Attar is a premium jasmine attar that opens with fresh jasmine blossoms and a green floral accord before settling into a mogra heart.

Fragrance profile: Top notes of Fresh Jasmine Blossoms and Green Floral Accord lead into heart notes of Mogra (Arabian Jasmine - Jasminum Sambac), finishing on base notes of Soft Sweet Floral, Light Musk and Warm Undertones. Together these notes give Forever Jasmine Premium Attar a jasmine, floral and mogra character, presented as a concentrated attar fragrance oil.

Its soft white-floral character suits festive wear and gifting to jasmine lovers.

Add Forever Jasmine Premium Attar to your cart at Itrawala and experience its character for yourself.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Fresh Jasmine Blossoms","Green Floral Accord"],"heart":["Mogra (Arabian Jasmine - Jasminum Sambac)"],"base":["Soft Sweet Floral","Light Musk","Warm Undertones"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  90
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
  'a-aura-premium-attar', 'aura-premium-attar', 'Aura Premium Attar', 'Premium concentrated attar', 'Aura Premium Attar is a premium attar that opens with warm spices and grapefruit and rests on a woody-amber base.

Fragrance profile: It opens with Cinnamon, Nutmeg, Cardamom and Grapefruit, unfolds into a heart of Lavender and rests on a base of Licorice, Sandalwood, Amber, Patchouli and Haitian Vetiver. Together these notes give Aura Premium Attar a spicy, aromatic and woody character, presented as a concentrated attar fragrance oil.

Its aromatic-spicy character suits those who prefer a warm, woody scent, and works well as a gift.

Shop Aura Premium Attar online at Itrawala and bring home a fragrance with real character.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Cinnamon","Nutmeg","Cardamom","Grapefruit"],"heart":["Lavender"],"base":["Licorice","Sandalwood","Amber","Patchouli","Haitian Vetiver"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  91
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
  'a-miracle-garden-attar', 'miracle-garden-attar', 'Miracle Garden Attar', 'Premium concentrated attar', 'Miracle Garden Attar is a floral attar that opens with lavender and bergamot and blooms into a heart of desert lily, coco palm tree blossom and orange blossom.

Fragrance profile: Top notes of Lavender and Bergamot lead into heart notes of Desert Lily, Coco Palm Tree Blossom, Orange Blossom and Diva Lavender, finishing on base notes of Vanilla. Together these notes give Miracle Garden Attar a floral, lavender and vanilla character, presented as a concentrated attar fragrance oil.

Its garden-flower character makes it an easy pick for gifting and special days.

Order Miracle Garden Attar from Itrawala and make it part of your fragrance routine.', 'Premium fragrance oils, French-grade base.',
  'Attar', 'Unisex',
  499, 1299, '{"10ml":{"price":499,"compareAt":1299}}'::jsonb,
  ARRAY['10ml']::text[], '10ml', NULL,
  NULL, '{"top":["Lavender","Bergamot"],"heart":["Desert Lily","Coco Palm Tree Blossom","Orange Blossom","Diva Lavender"],"base":["Vanilla"]}'::jsonb,
  '24 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  92
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
  'p-white-oud-eau-de-parfum-100-ml', 'white-oud-eau-de-parfum-100-ml', 'White Oud Eau De Parfum', 'Long-lasting Eau De Parfum', 'White Oud Eau De Parfum 100 ml is an Eau De Parfum that pairs a smoky woods opening with the depth of aged oud.

Fragrance profile: The top notes are Smoke Woods; the heart brings Aged Oud and Spices; and the base settles on Amber, Musk and Resin. Together these notes give White Oud Eau De Parfum an oud, smoky and woody character, presented as a ready-to-spray Eau De Parfum in a 100 ml bottle.

Its smoky, resinous profile suits evenings and special occasions, and makes a generous 100 ml gift for oud lovers.

Find White Oud Eau De Parfum (100 ml) at Itrawala and enjoy an Eau De Parfum that stands apart from the usual.', 'Premium fragrance oils, French-grade base.',
  'Perfume', 'Unisex',
  449, 749, '{"20ml":{"price":249,"compareAt":349},"50ml":{"price":349,"compareAt":499},"100ml":{"price":449,"compareAt":749}}'::jsonb,
  ARRAY['20ml','50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":["Smoke Woods"],"heart":["Aged Oud","Spices"],"base":["Amber","Musk","Resin"]}'::jsonb,
  '18 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  93
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
  'p-magnet-eau-de-parfum-100-ml', 'magnet-eau-de-parfum-100-ml', 'Magnet Eau De Parfum', 'Long-lasting Eau De Parfum', 'Magnet Eau De Parfum 100 ml is an aromatic Eau De Parfum that opens with lavender, rosemary, basil and verbena.

Fragrance profile: Top notes of Lavender, Rosemary, Basil and Verbena lead into heart notes of Angelica, Cinnamon, Coriander and Juniper Berry, finishing on base notes of Balsam Fir, Patchouli, Vetiver and Oakmoss. Together these notes give Magnet Eau De Parfum an aromatic, herbal and woody character, presented as a ready-to-spray Eau De Parfum in a 100 ml bottle.

Its herbal-woody character suits those who like aromatic, fresh scents, and the 100 ml size makes a generous gift.

Add Magnet Eau De Parfum (100 ml) to your cart at Itrawala and experience its character for yourself.', 'Premium fragrance oils, French-grade base.',
  'Perfume', 'Unisex',
  449, 749, '{"20ml":{"price":249,"compareAt":349},"50ml":{"price":349,"compareAt":499},"100ml":{"price":449,"compareAt":749}}'::jsonb,
  ARRAY['20ml','50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":["Lavender","Rosemary","Basil","Verbena"],"heart":["Angelica","Cinnamon","Coriander","Juniper Berry"],"base":["Balsam Fir","Patchouli","Vetiver","Oakmoss"]}'::jsonb,
  '18 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  94
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
  'p-secret-crush-eau-de-parfum-100-ml', 'secret-crush-eau-de-parfum-100-ml', 'Secret Crush Eau De Parfum', 'Long-lasting Eau De Parfum', 'Secret Crush Eau De Parfum 100 ml is an Eau De Parfum that opens with Sicilian mandarin and blooms into jasmine, ylang-ylang and orange blossom.

Fragrance profile: It opens with Sicilian Mandarin, unfolds into a heart of Jasmine Absolute, Ylang-Ylang and Tunisian Orange Blossom and rests on a base of Indonesian Patchouli, Tonka Bean and Benzoin. Together these notes give Secret Crush Eau De Parfum a floral, citrus and sweet character, presented as a ready-to-spray Eau De Parfum in a 100 ml bottle.

Its romantic white-floral character suits gifting and special evenings, in a generous 100 ml bottle.

Shop Secret Crush Eau De Parfum (100 ml) online at Itrawala and bring home a fragrance with real character.', 'Premium fragrance oils, French-grade base.',
  'Perfume', 'Unisex',
  540, 899, '{"20ml":{"price":249,"compareAt":349},"50ml":{"price":360,"compareAt":599},"100ml":{"price":540,"compareAt":899}}'::jsonb,
  ARRAY['20ml','50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":["Sicilian Mandarin"],"heart":["Jasmine Absolute","Ylang-Ylang","Tunisian Orange Blossom"],"base":["Indonesian Patchouli","Tonka Bean","Benzoin"]}'::jsonb,
  '18 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  95
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
  'p-gold-chandan-eau-de-parfum-100-ml', 'gold-chandan-eau-de-parfum-100-ml', 'Gold Chandan Eau De Parfum', 'Long-lasting Eau De Parfum', 'Gold Chandan Eau De Parfum 100 ml is an Eau De Parfum centred on Indian sandalwood, lifted by bergamot and floral notes and deepened with cedar and oud.

Fragrance profile: The top notes are Musk, Floral and Bergamot; the heart brings Jasmine, Ylang-Ylang and Amber; and the base settles on Indian Sandalwood, Cedar, Benzoin, Musk and Oud. Together these notes give Gold Chandan Eau De Parfum a sandalwood, floral and woody character, presented as a ready-to-spray Eau De Parfum in a 100 ml bottle.

Its creamy sandalwood character suits festive wear and gifting, in a generous 100 ml bottle.

Explore Gold Chandan Eau De Parfum (100 ml) at Itrawala and add a distinctive Eau De Parfum to your collection.', 'Premium fragrance oils, French-grade base.',
  'Perfume', 'Unisex',
  449, 749, '{"20ml":{"price":249,"compareAt":349},"50ml":{"price":349,"compareAt":499},"100ml":{"price":449,"compareAt":749}}'::jsonb,
  ARRAY['20ml','50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":["Musk","Floral","Bergamot"],"heart":["Jasmine","Ylang-Ylang","Amber"],"base":["Indian Sandalwood","Cedar","Benzoin","Musk","Oud"]}'::jsonb,
  '18 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  96
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
  'p-feelings-eau-de-parfum-100-ml', 'feelings-eau-de-parfum-100-ml', 'Feelings Eau De Parfum', 'Long-lasting Eau De Parfum', 'Feelings Eau De Parfum 100 ml is an Eau De Parfum that opens with saffron and jasmine before turning to a woody-amber heart.

Fragrance profile: Top notes of Saffron and Jasmine lead into heart notes of Amberwood and Ambergris (Ambroxan), finishing on base notes of Fir Resin, Cedar and Sugar (Ethyl Maltol). Together these notes give Feelings Eau De Parfum a saffron, amber and woody character, presented as a ready-to-spray Eau De Parfum in a 100 ml bottle.

Its warm, sweet-amber character suits evening wear and gifting, in a generous 100 ml bottle.

Order Feelings Eau De Parfum (100 ml) from Itrawala and make it part of your fragrance routine.', 'Premium fragrance oils, French-grade base.',
  'Perfume', 'Unisex',
  449, 749, '{"20ml":{"price":249,"compareAt":349},"50ml":{"price":299,"compareAt":499},"100ml":{"price":449,"compareAt":749}}'::jsonb,
  ARRAY['20ml','50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":["Saffron","Jasmine"],"heart":["Amberwood","Ambergris (Ambroxan)"],"base":["Fir Resin","Cedar","Sugar (Ethyl Maltol)"]}'::jsonb,
  '18 hrs', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  97
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
  'h-aqua-cool-air-freshener', 'aqua-cool-air-freshener', 'Aqua Cool Air Freshener', 'Hanging car air freshener', 'Aqua Cool Air Freshener is a hanging air freshener in the Aqua Cool fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Aqua Cool is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Aqua Cool Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  98
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
  'h-darbar-attar-air-freshener', 'darbar-attar-air-freshener', 'Darbar Attar Air Freshener', 'Hanging car air freshener', 'Darbar Attar Air Freshener is a hanging air freshener in the Darbar Attar fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Darbar Attar is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Darbar Attar Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  99
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
  'h-divine-mogra-air-freshener', 'divine-mogra-air-freshener', 'Divine Mogra Air Freshener', 'Hanging car air freshener', 'Divine Mogra Air Freshener is a hanging air freshener in the Divine Mogra fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Divine Mogra is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Divine Mogra Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  100
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
  'h-floral-fantasy-air-freshener', 'floral-fantasy-air-freshener', 'Floral Fantasy Air Freshener', 'Hanging car air freshener', 'Floral Fantasy Air Freshener is a hanging air freshener in the Floral Fantasy fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Floral Fantasy is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Floral Fantasy Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  101
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
  'h-fresh-forest-air-freshener', 'fresh-forest-air-freshener', 'Fresh Forest Air Freshener', 'Hanging car air freshener', 'Fresh Forest Air Freshener is a hanging air freshener in the Fresh Forest fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Fresh Forest is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Fresh Forest Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  102
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
  'h-fruit-basket-air-freshener', 'fruit-basket-air-freshener', 'Fruit Basket Air Freshener', 'Hanging car air freshener', 'Fruit Basket Air Freshener is a hanging air freshener in the Fruit Basket fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Fruit Basket is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Fruit Basket Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  103
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
  'h-garden-of-eden-air-freshener', 'garden-of-eden-air-freshener', 'Garden of Eden Air Freshener', 'Hanging car air freshener', 'Garden of Eden Air Freshener is a hanging air freshener in the Garden of Eden fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Garden of Eden is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Garden of Eden Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  104
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
  'h-lavenderous-air-freshener', 'lavenderous-air-freshener', 'Lavenderous Air Freshener', 'Hanging car air freshener', 'Lavenderous Air Freshener is a hanging air freshener in the Lavenderous fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

Lavenderous is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop Lavenderous Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  105
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
  'h-true-lemon-air-freshener', 'true-lemon-air-freshener', 'True Lemon Air Freshener', 'Hanging car air freshener', 'True Lemon Air Freshener is a hanging air freshener in the True Lemon fragrance, made to give your car a long-lasting scent.

Product features: it comes in a glass bottle with a non-spill design and a premium hanging rope, so it is easy to hang in your car.

True Lemon is one of several fragrances in the range, so you can choose the one that suits your taste.

Shop True Lemon Air Freshener online at Itrawala to add a long-lasting fragrance to your car.', 'Premium fragrance oils, French-grade base.',
  'Air Freshener', 'Unisex',
  174, 349, '{"50ml":{"price":124,"compareAt":299},"100ml":{"price":174,"compareAt":349}}'::jsonb,
  ARRAY['50ml','100ml']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  106
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
  'h-pure-natural-camphor', 'pure-natural-camphor', 'Pure & Natural Camphor', '100% pure & natural', 'Pure & Natural Camphor is 100% pure and natural camphor, made for use at home, in the temple, during rituals and for meditation.

Use it to purify your surroundings and create a calm atmosphere for puja, meditation or quiet time at home.

Shop Pure & Natural Camphor online at Itrawala for a simple, traditional addition to your home.', '100% pure and natural camphor.',
  'Camphor', 'Unisex',
  175, 300, '{"20ml":{"price":35,"compareAt":85},"50ml":{"price":175,"compareAt":300}}'::jsonb,
  ARRAY['20ml','50ml']::text[], '50ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  107
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
  'h-gugal-pure-resin', 'gugal-pure-resin', 'Gugal Pure Resin', 'Traditional natural resin', 'Gugal Pure Resin is a traditional natural resin for home, office and prayer spaces.

Burn it to help refresh the air in your space and promote positive energy.

Shop Gugal Pure Resin online at Itrawala for a simple, traditional addition to your home.', 'Natural gugal resin.',
  'Resin', 'Unisex',
  80, 240, '{"20ml":{"price":40,"compareAt":120},"50ml":{"price":80,"compareAt":240}}'::jsonb,
  ARRAY['20ml','50ml']::text[], '50ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  108
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
  'h-loban-resin', 'loban-resin', 'Loban Resin', 'Traditional natural resin', 'Loban Resin is a traditional home fragrance resin with a rich, resinous aroma.

Use it for rituals and to set a fragrant ambience at home.

Shop Loban Resin online at Itrawala for a simple, traditional addition to your home.', 'Natural loban resin.',
  'Resin', 'Unisex',
  80, 240, '{"20ml":{"price":40,"compareAt":120},"50ml":{"price":80,"compareAt":240}}'::jsonb,
  ARRAY['20ml','50ml']::text[], '50ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  109
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
  'h-kevada-jal-pure-floral-water', 'kevada-jal-pure-floral-water', 'Kevada Jal (Pure Floral Water)', '100% pure steam-distilled floral water', 'Kevada Jal (Pure Floral Water) is 100% pure and natural floral water, steam-distilled from Kevada flowers and described as skin-friendly, gentle and free of added chemicals.

Kevada floral water is a traditional choice for home rituals and gentle floral fragrance.

Shop Kevada Jal (Pure Floral Water) online at Itrawala for a gentle, traditional floral water.', '100% pure, steam-distilled Kevada floral water.',
  'Floral Water', 'Unisex',
  28, 55, '{"100ml":{"price":28,"compareAt":55},"225ml":{"price":50,"compareAt":95},"500ml":{"price":120,"compareAt":195},"1L":{"price":220,"compareAt":370}}'::jsonb,
  ARRAY['100ml','225ml','500ml','1L']::text[], '100ml', NULL,
  NULL, '{"top":[],"heart":[],"base":[]}'::jsonb,
  '', '', '{}', '{}',
  4.6, 0, NULL,
  false, true, false,
  false, NULL, NULL,
  110
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

delete from public.product_images where product_id in ('a-aura-premium-attar', 'a-forever-jasmine-premium-attar', 'a-miracle-garden-attar', 'a-omg-premium-attar', 'a-oud-forest-premium-attar', 'a-poetry-premium-attar', 'a-rebel-premium-attar', 'a-srk-premium-attar', 'a-wanted-premium-attar', 'h-aqua-cool-air-freshener', 'h-darbar-attar-air-freshener', 'h-divine-mogra-air-freshener', 'h-floral-fantasy-air-freshener', 'h-fresh-forest-air-freshener', 'h-fruit-basket-air-freshener', 'h-garden-of-eden-air-freshener', 'h-gugal-pure-resin', 'h-kevada-jal-pure-floral-water', 'h-lavenderous-air-freshener', 'h-loban-resin', 'h-pure-natural-camphor', 'h-true-lemon-air-freshener', 'p-feelings-eau-de-parfum-100-ml', 'p-gold-chandan-eau-de-parfum-100-ml', 'p-magnet-eau-de-parfum-100-ml', 'p-secret-crush-eau-de-parfum-100-ml', 'p-srk-eau-de-parfum-100-ml', 'p-white-oud-eau-de-parfum-100-ml');
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-srk-premium-attar', NULL, 'repo', 'product-gallery-3/SRK Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-srk-premium-attar', NULL, 'repo', 'product-gallery-3/SRK Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-srk-premium-attar', NULL, 'repo', 'product-gallery-3/SRK Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-srk-premium-attar', NULL, 'repo', 'product-gallery-3/SRK Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-srk-premium-attar', NULL, 'repo', 'product-gallery-3/SRK Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-srk-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/SRK Eau De Parfum/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-srk-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/SRK Eau De Parfum/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-srk-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/SRK Eau De Parfum/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-srk-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/SRK Eau De Parfum/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-srk-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/SRK Eau De Parfum/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-omg-premium-attar', NULL, 'repo', 'product-gallery-3/OMG Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-omg-premium-attar', NULL, 'repo', 'product-gallery-3/OMG Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-omg-premium-attar', NULL, 'repo', 'product-gallery-3/OMG Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-omg-premium-attar', NULL, 'repo', 'product-gallery-3/OMG Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-omg-premium-attar', NULL, 'repo', 'product-gallery-3/OMG Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-oud-forest-premium-attar', NULL, 'repo', 'product-gallery-3/Oud Forest Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-oud-forest-premium-attar', NULL, 'repo', 'product-gallery-3/Oud Forest Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-oud-forest-premium-attar', NULL, 'repo', 'product-gallery-3/Oud Forest Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-oud-forest-premium-attar', NULL, 'repo', 'product-gallery-3/Oud Forest Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-oud-forest-premium-attar', NULL, 'repo', 'product-gallery-3/Oud Forest Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-wanted-premium-attar', NULL, 'repo', 'product-gallery-3/Wanted premium attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-wanted-premium-attar', NULL, 'repo', 'product-gallery-3/Wanted premium attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-wanted-premium-attar', NULL, 'repo', 'product-gallery-3/Wanted premium attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-wanted-premium-attar', NULL, 'repo', 'product-gallery-3/Wanted premium attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-wanted-premium-attar', NULL, 'repo', 'product-gallery-3/Wanted premium attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-rebel-premium-attar', NULL, 'repo', 'product-gallery-3/Rebel Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-rebel-premium-attar', NULL, 'repo', 'product-gallery-3/Rebel Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-rebel-premium-attar', NULL, 'repo', 'product-gallery-3/Rebel Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-rebel-premium-attar', NULL, 'repo', 'product-gallery-3/Rebel Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-rebel-premium-attar', NULL, 'repo', 'product-gallery-3/Rebel Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-poetry-premium-attar', NULL, 'repo', 'product-gallery-3/Poetry Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-poetry-premium-attar', NULL, 'repo', 'product-gallery-3/Poetry Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-poetry-premium-attar', NULL, 'repo', 'product-gallery-3/Poetry Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-poetry-premium-attar', NULL, 'repo', 'product-gallery-3/Poetry Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-poetry-premium-attar', NULL, 'repo', 'product-gallery-3/Poetry Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-forever-jasmine-premium-attar', NULL, 'repo', 'product-gallery-3/Forever Jasmine Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-forever-jasmine-premium-attar', NULL, 'repo', 'product-gallery-3/Forever Jasmine Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-forever-jasmine-premium-attar', NULL, 'repo', 'product-gallery-3/Forever Jasmine Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-forever-jasmine-premium-attar', NULL, 'repo', 'product-gallery-3/Forever Jasmine Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-forever-jasmine-premium-attar', NULL, 'repo', 'product-gallery-3/Forever Jasmine Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-aura-premium-attar', NULL, 'repo', 'product-gallery-3/Aura Premium Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-aura-premium-attar', NULL, 'repo', 'product-gallery-3/Aura Premium Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-aura-premium-attar', NULL, 'repo', 'product-gallery-3/Aura Premium Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-aura-premium-attar', NULL, 'repo', 'product-gallery-3/Aura Premium Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-aura-premium-attar', NULL, 'repo', 'product-gallery-3/Aura Premium Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-miracle-garden-attar', NULL, 'repo', 'product-gallery-3/Miracle Garden Attar/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-miracle-garden-attar', NULL, 'repo', 'product-gallery-3/Miracle Garden Attar/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-miracle-garden-attar', NULL, 'repo', 'product-gallery-3/Miracle Garden Attar/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-miracle-garden-attar', NULL, 'repo', 'product-gallery-3/Miracle Garden Attar/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('a-miracle-garden-attar', NULL, 'repo', 'product-gallery-3/Miracle Garden Attar/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-white-oud-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/White Oud Eau De Parfum/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-white-oud-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/White Oud Eau De Parfum/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-white-oud-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/White Oud Eau De Parfum/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-white-oud-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/White Oud Eau De Parfum/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-white-oud-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/White Oud Eau De Parfum/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-magnet-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Magnet Eau De Parfum/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-magnet-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Magnet Eau De Parfum/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-magnet-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Magnet Eau De Parfum/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-magnet-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Magnet Eau De Parfum/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-magnet-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Magnet Eau De Parfum/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-secret-crush-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Secret Crush Eau De Parfum/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-secret-crush-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Secret Crush Eau De Parfum/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-secret-crush-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Secret Crush Eau De Parfum/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-secret-crush-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Secret Crush Eau De Parfum/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-secret-crush-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Secret Crush Eau De Parfum/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-gold-chandan-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Gold Chandan Eau De Parfum/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-gold-chandan-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Gold Chandan Eau De Parfum/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-gold-chandan-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Gold Chandan Eau De Parfum/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-gold-chandan-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Gold Chandan Eau De Parfum/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-gold-chandan-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Gold Chandan Eau De Parfum/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-feelings-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Feelings Eau De Parfum/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-feelings-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Feelings Eau De Parfum/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-feelings-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Feelings Eau De Parfum/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-feelings-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Feelings Eau De Parfum/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('p-feelings-eau-de-parfum-100-ml', NULL, 'repo', 'product-gallery-3/Feelings Eau De Parfum/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-aqua-cool-air-freshener', NULL, 'repo', 'product-gallery-3/Aqua Cool Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-aqua-cool-air-freshener', NULL, 'repo', 'product-gallery-3/Aqua Cool Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-aqua-cool-air-freshener', NULL, 'repo', 'product-gallery-3/Aqua Cool Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-aqua-cool-air-freshener', NULL, 'repo', 'product-gallery-3/Aqua Cool Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-aqua-cool-air-freshener', NULL, 'repo', 'product-gallery-3/Aqua Cool Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-darbar-attar-air-freshener', NULL, 'repo', 'product-gallery-3/Darbar Attar Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-darbar-attar-air-freshener', NULL, 'repo', 'product-gallery-3/Darbar Attar Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-darbar-attar-air-freshener', NULL, 'repo', 'product-gallery-3/Darbar Attar Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-darbar-attar-air-freshener', NULL, 'repo', 'product-gallery-3/Darbar Attar Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-darbar-attar-air-freshener', NULL, 'repo', 'product-gallery-3/Darbar Attar Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-divine-mogra-air-freshener', NULL, 'repo', 'product-gallery-3/Divine Mogra Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-divine-mogra-air-freshener', NULL, 'repo', 'product-gallery-3/Divine Mogra Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-divine-mogra-air-freshener', NULL, 'repo', 'product-gallery-3/Divine Mogra Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-divine-mogra-air-freshener', NULL, 'repo', 'product-gallery-3/Divine Mogra Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-divine-mogra-air-freshener', NULL, 'repo', 'product-gallery-3/Divine Mogra Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-floral-fantasy-air-freshener', NULL, 'repo', 'product-gallery-3/Floral Fantasy Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-floral-fantasy-air-freshener', NULL, 'repo', 'product-gallery-3/Floral Fantasy Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-floral-fantasy-air-freshener', NULL, 'repo', 'product-gallery-3/Floral Fantasy Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-floral-fantasy-air-freshener', NULL, 'repo', 'product-gallery-3/Floral Fantasy Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-floral-fantasy-air-freshener', NULL, 'repo', 'product-gallery-3/Floral Fantasy Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fresh-forest-air-freshener', NULL, 'repo', 'product-gallery-3/Fresh Forest Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fresh-forest-air-freshener', NULL, 'repo', 'product-gallery-3/Fresh Forest Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fresh-forest-air-freshener', NULL, 'repo', 'product-gallery-3/Fresh Forest Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fresh-forest-air-freshener', NULL, 'repo', 'product-gallery-3/Fresh Forest Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fresh-forest-air-freshener', NULL, 'repo', 'product-gallery-3/Fresh Forest Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fruit-basket-air-freshener', NULL, 'repo', 'product-gallery-3/Fruit Basket Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fruit-basket-air-freshener', NULL, 'repo', 'product-gallery-3/Fruit Basket Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fruit-basket-air-freshener', NULL, 'repo', 'product-gallery-3/Fruit Basket Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fruit-basket-air-freshener', NULL, 'repo', 'product-gallery-3/Fruit Basket Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-fruit-basket-air-freshener', NULL, 'repo', 'product-gallery-3/Fruit Basket Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-garden-of-eden-air-freshener', NULL, 'repo', 'product-gallery-3/Garden of Eden Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-garden-of-eden-air-freshener', NULL, 'repo', 'product-gallery-3/Garden of Eden Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-garden-of-eden-air-freshener', NULL, 'repo', 'product-gallery-3/Garden of Eden Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-garden-of-eden-air-freshener', NULL, 'repo', 'product-gallery-3/Garden of Eden Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-garden-of-eden-air-freshener', NULL, 'repo', 'product-gallery-3/Garden of Eden Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-lavenderous-air-freshener', NULL, 'repo', 'product-gallery-3/Lavenderous Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-lavenderous-air-freshener', NULL, 'repo', 'product-gallery-3/Lavenderous Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-lavenderous-air-freshener', NULL, 'repo', 'product-gallery-3/Lavenderous Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-lavenderous-air-freshener', NULL, 'repo', 'product-gallery-3/Lavenderous Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-lavenderous-air-freshener', NULL, 'repo', 'product-gallery-3/Lavenderous Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-true-lemon-air-freshener', NULL, 'repo', 'product-gallery-3/True Lemon Air Freshener/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-true-lemon-air-freshener', NULL, 'repo', 'product-gallery-3/True Lemon Air Freshener/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-true-lemon-air-freshener', NULL, 'repo', 'product-gallery-3/True Lemon Air Freshener/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-true-lemon-air-freshener', NULL, 'repo', 'product-gallery-3/True Lemon Air Freshener/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-true-lemon-air-freshener', NULL, 'repo', 'product-gallery-3/True Lemon Air Freshener/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-pure-natural-camphor', NULL, 'repo', 'product-gallery-3/Pure & Natural Camphor/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-pure-natural-camphor', NULL, 'repo', 'product-gallery-3/Pure & Natural Camphor/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-pure-natural-camphor', NULL, 'repo', 'product-gallery-3/Pure & Natural Camphor/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-pure-natural-camphor', NULL, 'repo', 'product-gallery-3/Pure & Natural Camphor/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-pure-natural-camphor', NULL, 'repo', 'product-gallery-3/Pure & Natural Camphor/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-gugal-pure-resin', NULL, 'repo', 'product-gallery-3/Gugal Pure Resin/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-gugal-pure-resin', NULL, 'repo', 'product-gallery-3/Gugal Pure Resin/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-gugal-pure-resin', NULL, 'repo', 'product-gallery-3/Gugal Pure Resin/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-gugal-pure-resin', NULL, 'repo', 'product-gallery-3/Gugal Pure Resin/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-gugal-pure-resin', NULL, 'repo', 'product-gallery-3/Gugal Pure Resin/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-loban-resin', NULL, 'repo', 'product-gallery-3/Loban Resin/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-loban-resin', NULL, 'repo', 'product-gallery-3/Loban Resin/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-loban-resin', NULL, 'repo', 'product-gallery-3/Loban Resin/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-loban-resin', NULL, 'repo', 'product-gallery-3/Loban Resin/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-loban-resin', NULL, 'repo', 'product-gallery-3/Loban Resin/5.jpg', 4);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-kevada-jal-pure-floral-water', NULL, 'repo', 'product-gallery-3/Kevada Jal (Pure Floral Water)/1.jpg', 0);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-kevada-jal-pure-floral-water', NULL, 'repo', 'product-gallery-3/Kevada Jal (Pure Floral Water)/2.jpg', 1);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-kevada-jal-pure-floral-water', NULL, 'repo', 'product-gallery-3/Kevada Jal (Pure Floral Water)/3.jpg', 2);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-kevada-jal-pure-floral-water', NULL, 'repo', 'product-gallery-3/Kevada Jal (Pure Floral Water)/4.jpg', 3);
insert into public.product_images (product_id, volume, source, storage_key, position) values ('h-kevada-jal-pure-floral-water', NULL, 'repo', 'product-gallery-3/Kevada Jal (Pure Floral Water)/5.jpg', 4);

commit;
