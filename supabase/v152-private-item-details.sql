-- ONE-LINE / SHOPIZO v152: private Admin-only item details
-- Run this entire statement in Supabase SQL Editor before deploying v152.
-- Private values NEVER live in customer-readable custom_catalog_items rows.
BEGIN;
CREATE TABLE IF NOT EXISTS public.catalogue_internal_details (
  item_id uuid PRIMARY KEY REFERENCES public.custom_catalog_items(id) ON DELETE CASCADE,
  detail_1 text NOT NULL DEFAULT '',
  detail_2 text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalogue_internal_detail_1_length CHECK (char_length(detail_1) <= 500),
  CONSTRAINT catalogue_internal_detail_2_length CHECK (char_length(detail_2) <= 500)
);
ALTER TABLE public.catalogue_internal_details ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.catalogue_internal_details FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.catalogue_internal_details TO authenticated;
DROP POLICY IF EXISTS "catalogue internal staff read" ON public.catalogue_internal_details;
CREATE POLICY "catalogue internal staff read" ON public.catalogue_internal_details
  FOR SELECT TO authenticated USING (public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "catalogue internal staff insert" ON public.catalogue_internal_details;
CREATE POLICY "catalogue internal staff insert" ON public.catalogue_internal_details
  FOR INSERT TO authenticated WITH CHECK (public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "catalogue internal staff update" ON public.catalogue_internal_details;
CREATE POLICY "catalogue internal staff update" ON public.catalogue_internal_details
  FOR UPDATE TO authenticated USING (public.has_role(ARRAY['admin','management']))
  WITH CHECK (public.has_role(ARRAY['admin','management']));
DROP POLICY IF EXISTS "catalogue internal staff delete" ON public.catalogue_internal_details;
CREATE POLICY "catalogue internal staff delete" ON public.catalogue_internal_details
  FOR DELETE TO authenticated USING (public.has_role(ARRAY['admin','management']));
COMMIT;
