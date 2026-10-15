-- One-Line / SHOPIZO v148: ONLY TWO category modes and public fabric SELECT fixes.
-- Run this ENTIRE script in Supabase SQL Editor > New query > Run.
-- Do not highlight/select only a fragment. Does not replace or delete any item or fabric.
-- It uses your existing Admin fabrics, qualities, prices and garment adjustments.
BEGIN;

-- Existing category names are kept. Their saved items remain in their categories.
ALTER TABLE public.custom_catalog_categories
  ADD COLUMN IF NOT EXISTS item_editor_type text NOT NULL DEFAULT 'auto';

UPDATE public.custom_catalog_categories
SET item_editor_type = 'tshirt'
WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) = 'ready stock printable items'
  AND item_editor_type IS DISTINCT FROM 'tshirt';

UPDATE public.custom_catalog_categories
SET item_editor_type = 'jersey'
WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) = 'full sublimation jerseys'
  AND item_editor_type IS DISTINCT FROM 'jersey';

-- Read existing visible fabric + sportswear type options directly from Admin.
-- Admin/Management retain read access to hidden options through existing has_role().
ALTER TABLE public.custom_catalog_fabrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom catalogue fabrics read" ON public.custom_catalog_fabrics;
CREATE POLICY "public custom catalogue fabrics read"
  ON public.custom_catalog_fabrics FOR SELECT
  USING (active OR public.has_role(ARRAY['admin','management']));

ALTER TABLE public.custom_sportswear_fabrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom sportswear fabrics read" ON public.custom_sportswear_fabrics;
CREATE POLICY "public custom sportswear fabrics read"
  ON public.custom_sportswear_fabrics FOR SELECT
  USING (active OR public.has_role(ARRAY['admin','management']));

ALTER TABLE public.custom_sportswear_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom sportswear types read" ON public.custom_sportswear_types;
CREATE POLICY "public custom sportswear types read"
  ON public.custom_sportswear_types FOR SELECT
  USING (active OR public.has_role(ARRAY['admin','management']));

GRANT SELECT ON public.custom_catalog_fabrics, public.custom_sportswear_fabrics,
  public.custom_sportswear_types TO anon, authenticated;
COMMIT;

-- Verification (read-only): should show one row for each named category.
SELECT name, item_editor_type
FROM public.custom_catalog_categories
WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
  IN ('ready stock printable items', 'full sublimation jerseys')
ORDER BY name;
