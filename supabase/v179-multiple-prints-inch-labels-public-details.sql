-- One-Line v179: multi-print labels and read-only customer display of two item details.
-- Run ONCE in the existing Supabase SQL Editor before/with deploying v179.
-- No security policies are relaxed on catalogue_internal_details.
-- CAUTION: the two formerly private Admin detail fields will be intentionally public
-- on ACTIVE catalogue items. Review their existing contents before running.
BEGIN;

-- Upgrade existing print sizes without changing any configured rates or custom sizes.
-- Previous 'Standard' -> Logo size; 'Large' -> Number size.
-- New Letter size starts with the existing Standard/Logo rate; adjust in Admin.
UPDATE public.custom_print_types AS p SET sizes = (
  SELECT
    COALESCE(jsonb_agg(
      CASE
        WHEN part.value->>'id' = 'Standard' THEN jsonb_set(part.value, '{name}', to_jsonb('Logo size'::text))
        WHEN part.value->>'id' = 'Large' THEN jsonb_set(part.value, '{name}', to_jsonb('Number size'::text))
        WHEN part.value->>'id' = 'Letter' THEN jsonb_set(part.value, '{name}', to_jsonb('Letter size'::text))
        ELSE part.value
      END ORDER BY part.ordinality
    ), '[]'::jsonb)
    || (CASE WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(p.sizes,'[]'::jsonb)) v WHERE v->>'id'='Standard') THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object('id','Standard','name','Logo size','rate',p.standard_rate)) END)
    || (CASE WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(p.sizes,'[]'::jsonb)) v WHERE v->>'id'='Letter') THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object('id','Letter','name','Letter size','rate',p.standard_rate)) END)
    || (CASE WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(COALESCE(p.sizes,'[]'::jsonb)) v WHERE v->>'id'='Large') THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object('id','Large','name','Number size','rate',p.large_rate)) END)
  FROM jsonb_array_elements(COALESCE(p.sizes,'[]'::jsonb)) WITH ORDINALITY AS part(value,ordinality)
);

-- Preserve restrictive policies on public.catalogue_internal_details.
-- Only explicitly chosen fields for currently visible items are returned.
CREATE OR REPLACE FUNCTION public.public_catalogue_display_details()
RETURNS TABLE(item_id uuid, detail_1 text, detail_2 text)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT d.item_id, d.detail_1, d.detail_2
  FROM public.catalogue_internal_details AS d
  JOIN public.custom_catalog_items AS i ON i.id = d.item_id
  JOIN public.custom_catalog_categories AS c ON c.id = i.category_id
  WHERE i.active IS TRUE AND (c.active IS TRUE OR c.shareable IS TRUE)
$$;
REVOKE ALL ON FUNCTION public.public_catalogue_display_details() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_catalogue_display_details() TO anon, authenticated;

COMMIT;
