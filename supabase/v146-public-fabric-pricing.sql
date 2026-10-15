-- v146: Ensure public customers can read visible T-Shirt and Sportswear options.
-- Existing fabric/type rows, prices, item settings and orders are NOT changed.
-- Run in Supabase SQL Editor if older RLS rules may hide admin-configured options.
-- Hidden (active=false) options stay visible only to admin / management.

ALTER TABLE public.custom_catalog_fabrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom catalogue fabrics read" ON public.custom_catalog_fabrics;
CREATE POLICY "public custom catalogue fabrics read" ON public.custom_catalog_fabrics
FOR SELECT USING (active OR public.has_role(ARRAY['admin','management']));

ALTER TABLE public.custom_sportswear_fabrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom sportswear fabrics read" ON public.custom_sportswear_fabrics;
CREATE POLICY "public custom sportswear fabrics read" ON public.custom_sportswear_fabrics
FOR SELECT USING (active OR public.has_role(ARRAY['admin','management']));

ALTER TABLE public.custom_sportswear_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public custom sportswear types read" ON public.custom_sportswear_types;
CREATE POLICY "public custom sportswear types read" ON public.custom_sportswear_types
FOR SELECT USING (active OR public.has_role(ARRAY['admin','management']));

-- No price seeding is needed: customer pages fetch existing live Admin rows.
