-- ONE-LINE v185: secure admin-only customer address directory and short item tags.
-- Existing historical detail values are NOT altered or shortened by this migration.
BEGIN;
GRANT SELECT ON public.customer_addresses TO authenticated;
DROP POLICY IF EXISTS "customer addresses admin directory read" ON public.customer_addresses;
CREATE POLICY "customer addresses admin directory read" ON public.customer_addresses FOR SELECT TO authenticated USING (public.has_role(ARRAY['admin']));
-- New edits are restricted; old records are left unchanged until deliberately saved.
CREATE OR REPLACE FUNCTION public.limit_catalogue_item_detail_tags() RETURNS trigger
LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF char_length(NEW.detail_1)>8 OR char_length(NEW.detail_2)>8 OR NEW.detail_1 ~ '[[:space:]]' OR NEW.detail_2 ~ '[[:space:]]' THEN
  RAISE EXCEPTION 'Each catalogue detail may contain at most eight non-space characters';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS v185_catalogue_item_detail_tags ON public.catalogue_internal_details;
CREATE TRIGGER v185_catalogue_item_detail_tags BEFORE INSERT OR UPDATE ON public.catalogue_internal_details FOR EACH ROW EXECUTE FUNCTION public.limit_catalogue_item_detail_tags();
COMMIT;
