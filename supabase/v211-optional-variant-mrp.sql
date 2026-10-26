-- One-Line v211: optional display-only MRP for individual Ready Made product variants.
-- Run ONCE before deploying v211. This does not change checkout/stock pricing.
-- Transactional, additive, and idempotent. Existing variants retain NULL (no MRP).
BEGIN;
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS mrp numeric(12,2);
COMMIT;

-- Optional read-only verification:
-- SELECT column_name, is_nullable FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='product_variants' AND column_name='mrp';
