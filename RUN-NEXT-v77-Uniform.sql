-- One-Line v77 — Uniform Custom Catalogue
-- Run once in Supabase SQL Editor on an existing project.
-- No new table or column is required: uniform feature highlights are stored
-- inside custom_catalog_items.fabric_options.

insert into public.custom_catalog_categories(name,description,image_url,active,sort_order)
values(
  'Uniform',
  'Custom uniforms with a starting price and simple highlighted features.',
  '',
  true,
  30
)
on conflict(name) do nothing;
