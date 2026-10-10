-- V136: run after existing v135 schema. No catalogue or order data is deleted.
BEGIN;
ALTER TABLE public.custom_catalog_categories
  ADD COLUMN IF NOT EXISTS catalogue_section text NOT NULL DEFAULT 'custom';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='custom_catalog_categories_section_check' AND conrelid='public.custom_catalog_categories'::regclass) THEN
    ALTER TABLE public.custom_catalog_categories ADD CONSTRAINT custom_catalog_categories_section_check CHECK (catalogue_section IN ('custom','ready'));
  END IF;
END $$;
-- Allow the same category name in the two separate catalogues.
ALTER TABLE public.custom_catalog_categories DROP CONSTRAINT IF EXISTS custom_catalog_categories_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS custom_catalog_categories_section_name_key ON public.custom_catalog_categories(catalogue_section,name);
CREATE INDEX IF NOT EXISTS custom_catalog_categories_section_sort_idx ON public.custom_catalog_categories(catalogue_section,sort_order);
CREATE INDEX IF NOT EXISTS custom_catalog_items_category_sort_idx ON public.custom_catalog_items(category_id,sort_order);
CREATE INDEX IF NOT EXISTS order_items_order_id_v136_idx ON public.order_items(order_id);
COMMIT;
