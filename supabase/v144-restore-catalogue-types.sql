-- One-Line v144: distinct Custom Catalogue, T-Shirt, Jersey and Uniform flows.
-- Run in Supabase SQL Editor BEFORE deploying v144 web files.
-- Safe to re-run; does not modify or remove any existing item or fabric_options.
ALTER TABLE public.custom_catalog_categories
  ADD COLUMN IF NOT EXISTS item_editor_type text NOT NULL DEFAULT 'auto';

ALTER TABLE public.custom_catalog_categories
  DROP CONSTRAINT IF EXISTS custom_catalog_categories_editor_type_check;
ALTER TABLE public.custom_catalog_categories
  ADD CONSTRAINT custom_catalog_categories_editor_type_check
  CHECK (item_editor_type IN ('auto', 'catalogue', 'tshirt', 'jersey', 'uniform'));

-- Explicitly restore the original behavior of the legacy category names,
-- including Full Sublimation Jerseys which v143 did not recognise.
UPDATE public.custom_catalog_categories SET item_editor_type='uniform'
WHERE item_editor_type='auto' AND lower(name) ~ '(^|[^a-z])uniforms?([^a-z]|$)';
UPDATE public.custom_catalog_categories SET item_editor_type='tshirt'
WHERE item_editor_type='auto' AND lower(regexp_replace(name, '[-_]+', ' ', 'g')) ~ '(^|[^a-z])(t shirts?|tshirts?|tee shirts?)([^a-z]|$)';
UPDATE public.custom_catalog_categories SET item_editor_type='jersey'
WHERE item_editor_type='auto' AND lower(name) ~ '(^|[^a-z])(jerseys?|sportswear|sports wear|sports kit)([^a-z]|$)';

-- Leave every other category on auto (normal Custom Catalogue variants).
-- Existing item rows, images, prices, stock, orders and enquiries are retained.
