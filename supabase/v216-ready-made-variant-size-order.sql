-- One-Line v216 — persist Ready Made size/option order.
-- Run ONCE in the existing One-Line Supabase SQL Editor before deploying v216.
-- Does not modify order, inventory, pricing, or product image data.
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Preserve the existing visible order (previously by UUID id) for rows
-- that have not had an explicit order saved yet. Safe to run again.
WITH original_positions AS (
  SELECT id, product_id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY id) - 1 AS position
  FROM public.product_variants
), unordered_products AS (
  SELECT product_id
  FROM public.product_variants
  GROUP BY product_id
  HAVING COUNT(*) FILTER (WHERE sort_order <> 0) = 0
)
UPDATE public.product_variants AS variants
SET sort_order = positions.position
FROM original_positions AS positions
JOIN unordered_products AS untouched ON untouched.product_id = positions.product_id
WHERE variants.id = positions.id AND variants.sort_order = 0;

NOTIFY pgrst, 'reload schema';
