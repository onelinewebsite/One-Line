-- v179: Public item details + 3 standard print-size labels.
-- Run once in Supabase SQL Editor before deploying this build.
-- Admin writes to catalogue_internal_details remain restricted by existing v152 policies.
BEGIN;
GRANT SELECT (item_id, detail_1, detail_2) ON public.catalogue_internal_details TO anon;
DROP POLICY IF EXISTS "customer published catalogue details read" ON public.catalogue_internal_details;
CREATE POLICY "customer published catalogue details read" ON public.catalogue_internal_details
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.custom_catalog_items i
    JOIN public.custom_catalog_categories c ON c.id = i.category_id
    WHERE i.id = item_id AND i.active = true AND (c.active = true OR c.shareable = true)
  ));
-- Upgrade ONLY the two default v158 sizes; keep user-customized size lists untouched.
UPDATE public.custom_print_types t SET sizes =
  jsonb_build_array(
    jsonb_build_object('id','Standard','name','Logo Size','rate',(t.sizes->0->>'rate')::numeric),
    jsonb_build_object('id','Large','name','Letter Size','rate',(t.sizes->1->>'rate')::numeric),
    jsonb_build_object('id','Number','name','Number Size','rate',(t.sizes->1->>'rate')::numeric)
  )
WHERE jsonb_array_length(t.sizes)=2
  AND t.sizes->0->>'id'='Standard'
  AND t.sizes->1->>'id'='Large'
  AND t.sizes->0->>'name'='Name / Logo Size'
  AND t.sizes->1->>'name'='Large Size';
COMMIT;
