-- One-Line / SHOPIZO v145: restore independent catalogue editors and live fabric pricing.
-- Includes the category-mode migration originally supplied as v144, plus the missing
-- T-shirt / sportswear tables, seed data and public-read policy repair.
-- IMPORTANT: Back up before running in Supabase SQL Editor.
-- Repeatable: never overwrites an existing admin-configured price or visibility.
BEGIN;

-- Keep the four distinct customer/admin workflows.
ALTER TABLE public.custom_catalog_categories
  ADD COLUMN IF NOT EXISTS item_editor_type text NOT NULL DEFAULT 'auto';
ALTER TABLE public.custom_catalog_categories
  DROP CONSTRAINT IF EXISTS custom_catalog_categories_editor_type_check;
ALTER TABLE public.custom_catalog_categories
  ADD CONSTRAINT custom_catalog_categories_editor_type_check
  CHECK (item_editor_type IN ('auto','catalogue','tshirt','jersey','uniform'));
ALTER TABLE public.custom_catalog_items
  ADD COLUMN IF NOT EXISTS fabric_options jsonb;

UPDATE public.custom_catalog_categories SET item_editor_type='uniform'
WHERE item_editor_type='auto' AND lower(name) ~ '(^|[^a-z])uniforms?([^a-z]|$)';
UPDATE public.custom_catalog_categories SET item_editor_type='tshirt'
WHERE item_editor_type='auto' AND lower(regexp_replace(name,'[-_]+',' ','g')) ~ '(^|[^a-z])(t shirts?|tshirts?|tee shirts?)([^a-z]|$)';
UPDATE public.custom_catalog_categories SET item_editor_type='jersey'
WHERE item_editor_type='auto' AND lower(name) ~ '(^|[^a-z])(jerseys?|sportswear|sports wear|sports kit)([^a-z]|$)';

-- Fabric and style lists used by customer T-Shirt / Jersey detail selectors.
CREATE TABLE IF NOT EXISTS public.custom_catalog_fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  premium_rate numeric(12,2) NOT NULL DEFAULT 0,
  standard_rate numeric(12,2) NOT NULL DEFAULT 0,
  budget_rate numeric(12,2),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.custom_sportswear_fabrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  premium_rate numeric(12,2) NOT NULL DEFAULT 0,
  standard_rate numeric(12,2) NOT NULL DEFAULT 0,
  budget_rate numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.custom_sportswear_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  price_adjustment numeric(12,2) NOT NULL DEFAULT 0,
  is_base boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_custom_catalog_fabrics_sort
  ON public.custom_catalog_fabrics(active, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_custom_sportswear_fabrics_sort
  ON public.custom_sportswear_fabrics(active, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_custom_sportswear_types_sort
  ON public.custom_sportswear_types(active, sort_order, name);

-- Seed MISSING options only. Do not change prices, active flags or IDs that
-- Admin has already edited. The frontend always uses the live rows from here.
INSERT INTO public.custom_catalog_fabrics
  (name,premium_rate,standard_rate,budget_rate,active,sort_order)
VALUES
  ('Mars',400,350,300,true,10),
  ('NJS',380,330,280,true,20),
  ('NJ',300,270,240,true,30),
  ('Boxknit',300,270,240,true,40),
  ('Dotknit',300,270,240,true,50),
  ('Salena',300,270,240,true,60),
  ('Honeycomb',300,270,240,true,70),
  ('Polycotton',500,450,NULL,true,80)
ON CONFLICT(name) DO NOTHING;

INSERT INTO public.custom_sportswear_fabrics
  (name,premium_rate,standard_rate,budget_rate,active,sort_order)
VALUES
  ('Mars',500,450,400,true,10),
  ('NJ',400,350,300,true,20),
  ('Boxknit',350,300,300,true,30),
  ('Dotknit',350,300,300,true,40),
  ('Salena',350,300,300,true,50),
  ('Honeycomb',350,300,250,true,60),
  ('PP',300,270,240,true,70)
ON CONFLICT(name) DO NOTHING;

INSERT INTO public.custom_sportswear_types
  (name,price_adjustment,is_base,active,sort_order)
VALUES
  ('Round Neck',0,true,true,10),
  ('V Neck',-50,false,true,20),
  ('Polo',50,false,true,30),
  ('Semi Collar',30,false,true,40)
ON CONFLICT DO NOTHING;

-- Correct the old T-Shirt policy that referenced a nonexistent `shareable`
-- column on custom_catalog_fabrics, causing public fabric SELECT to fail.
ALTER TABLE public.custom_catalog_fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sportswear_fabrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sportswear_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom catalogue fabrics read" ON public.custom_catalog_fabrics;
CREATE POLICY "public custom catalogue fabrics read" ON public.custom_catalog_fabrics
  FOR SELECT USING (active OR public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "public custom sportswear fabrics read" ON public.custom_sportswear_fabrics;
CREATE POLICY "public custom sportswear fabrics read" ON public.custom_sportswear_fabrics
  FOR SELECT USING (active OR public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "public custom sportswear types read" ON public.custom_sportswear_types;
CREATE POLICY "public custom sportswear types read" ON public.custom_sportswear_types
  FOR SELECT USING (active OR public.has_role(ARRAY['admin','management']));

-- Restore Admin / Management write policies if the fabric tables did not exist.
DROP POLICY IF EXISTS "custom catalogue fabrics admin insert" ON public.custom_catalog_fabrics;
CREATE POLICY "custom catalogue fabrics admin insert" ON public.custom_catalog_fabrics
  FOR INSERT WITH CHECK(public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "custom catalogue fabrics admin update" ON public.custom_catalog_fabrics;
CREATE POLICY "custom catalogue fabrics admin update" ON public.custom_catalog_fabrics
  FOR UPDATE USING(public.has_role(ARRAY['admin','management']))
  WITH CHECK(public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "custom catalogue fabrics admin delete" ON public.custom_catalog_fabrics;
CREATE POLICY "custom catalogue fabrics admin delete" ON public.custom_catalog_fabrics
  FOR DELETE USING(public.has_role(ARRAY['admin']));
DROP POLICY IF EXISTS "custom sportswear fabrics admin insert" ON public.custom_sportswear_fabrics;
CREATE POLICY "custom sportswear fabrics admin insert" ON public.custom_sportswear_fabrics
  FOR INSERT WITH CHECK(public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "custom sportswear fabrics admin update" ON public.custom_sportswear_fabrics;
CREATE POLICY "custom sportswear fabrics admin update" ON public.custom_sportswear_fabrics
  FOR UPDATE USING(public.has_role(ARRAY['admin','management']))
  WITH CHECK(public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "custom sportswear fabrics admin delete" ON public.custom_sportswear_fabrics;
CREATE POLICY "custom sportswear fabrics admin delete" ON public.custom_sportswear_fabrics
  FOR DELETE USING(public.has_role(ARRAY['admin']));
DROP POLICY IF EXISTS "custom sportswear types admin insert" ON public.custom_sportswear_types;
CREATE POLICY "custom sportswear types admin insert" ON public.custom_sportswear_types
  FOR INSERT WITH CHECK(public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "custom sportswear types admin update" ON public.custom_sportswear_types;
CREATE POLICY "custom sportswear types admin update" ON public.custom_sportswear_types
  FOR UPDATE USING(public.has_role(ARRAY['admin','management']))
  WITH CHECK(public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "custom sportswear types admin delete" ON public.custom_sportswear_types;
CREATE POLICY "custom sportswear types admin delete" ON public.custom_sportswear_types
  FOR DELETE USING(public.has_role(ARRAY['admin']));

GRANT SELECT ON TABLE public.custom_catalog_fabrics,
  public.custom_sportswear_fabrics, public.custom_sportswear_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custom_catalog_fabrics,
  public.custom_sportswear_fabrics, public.custom_sportswear_types TO authenticated;
COMMIT;

-- Optional check after running:
-- SELECT name,premium_rate,standard_rate,budget_rate,active FROM public.custom_catalog_fabrics ORDER BY sort_order;
-- SELECT name,price_adjustment,active FROM public.custom_sportswear_types ORDER BY sort_order;
-- SELECT name,premium_rate,standard_rate,budget_rate,active FROM public.custom_sportswear_fabrics ORDER BY sort_order;
-- SELECT name,item_editor_type FROM public.custom_catalog_categories ORDER BY sort_order;
