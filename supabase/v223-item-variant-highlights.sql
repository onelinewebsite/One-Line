-- One-Line v223: Name/Value details for Ready Made items and their exact variants.
-- Custom Catalogue and its uniform variants already store details in fabric_options JSONB.
-- Apply this once in the same Supabase project as One-Line.
BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb;
COMMIT;
