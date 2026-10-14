-- One-Line v142. Run ONCE in the Supabase SQL Editor before deploying v142.
-- Uses a shared database sequence for all newly created catalogue and product
-- item IDs. The original UUID primary keys, barcodes and order links stay intact.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.one_line_item_sequence START WITH 101;
ALTER TABLE public.custom_catalog_items ADD COLUMN IF NOT EXISTS display_id text;

-- Avoid assigning numbers that already exist on Ready Made products.
LOCK TABLE public.products, public.custom_catalog_items IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE highest bigint;
BEGIN
  SELECT greatest(100,coalesce(max(substring(code from '^ONE-([0-9]+)$')::bigint),0),
                   coalesce((SELECT max(substring(display_id from '^ONE-([0-9]+)$')::bigint)
                             FROM public.custom_catalog_items),0))
  INTO highest FROM public.products;
  PERFORM setval('public.one_line_item_sequence',
    greatest(highest,(SELECT CASE WHEN is_called THEN last_value ELSE 100 END FROM public.one_line_item_sequence)),true);
END $$;

-- Existing catalogue records that never had a unique ID receive one now.
-- UUIDs, product codes already in use, and order history are NOT changed.
UPDATE public.custom_catalog_items
  SET display_id='ONE-' || lpad(nextval('public.one_line_item_sequence')::text,5,'0')
  WHERE display_id IS NULL OR btrim(display_id)='';

-- Blank codes in legacy products get a real globally generated ID, too.
UPDATE public.products
  SET code='ONE-' || lpad(nextval('public.one_line_item_sequence')::text,5,'0')
  WHERE code IS NULL OR btrim(code)='';

CREATE UNIQUE INDEX IF NOT EXISTS custom_catalog_items_display_id_unique
  ON public.custom_catalog_items(display_id);

CREATE OR REPLACE FUNCTION public.one_line_enforce_item_id() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE candidate text; sequence_no bigint;
BEGIN
  -- Serialise manual-ID checks across BOTH item tables; nextval is concurrent-safe.
  PERFORM pg_advisory_xact_lock(240142,101);
  IF TG_TABLE_NAME='products' THEN candidate:=nullif(btrim(NEW.code),'');
  ELSE candidate:=nullif(btrim(NEW.display_id),''); END IF;

  IF candidate IS NULL THEN
    LOOP
      sequence_no:=nextval('public.one_line_item_sequence');
      candidate:='ONE-' || lpad(sequence_no::text,greatest(5,length(sequence_no::text)),'0');
      EXIT WHEN NOT EXISTS(SELECT 1 FROM public.products WHERE code=candidate)
             AND NOT EXISTS(SELECT 1 FROM public.custom_catalog_items WHERE display_id=candidate);
    END LOOP;
  END IF;
  IF TG_TABLE_NAME='products' THEN
    IF EXISTS(SELECT 1 FROM public.custom_catalog_items WHERE display_id=candidate) THEN
      RAISE EXCEPTION 'Item ID % is already assigned to a catalogue item', candidate;
    END IF;
    NEW.code:=candidate;
  ELSE
    IF EXISTS(SELECT 1 FROM public.products WHERE code=candidate) THEN
      RAISE EXCEPTION 'Item ID % is already assigned to a product', candidate;
    END IF;
    NEW.display_id:=candidate;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS one_line_unique_product_item_id ON public.products;
CREATE TRIGGER one_line_unique_product_item_id BEFORE INSERT OR UPDATE OF code
ON public.products FOR EACH ROW EXECUTE FUNCTION public.one_line_enforce_item_id();
DROP TRIGGER IF EXISTS one_line_unique_custom_item_id ON public.custom_catalog_items;
CREATE TRIGGER one_line_unique_custom_item_id BEFORE INSERT OR UPDATE OF display_id
ON public.custom_catalog_items FOR EACH ROW EXECUTE FUNCTION public.one_line_enforce_item_id();

-- Staff may read private/hidden inventory and its category name but not edit
-- the catalogue itself. The normal public-visitor restrictions stay in place.
DROP POLICY IF EXISTS "public custom catalogue categories read" ON public.custom_catalog_categories;
CREATE POLICY "public custom catalogue categories read" ON public.custom_catalog_categories
FOR SELECT USING(active OR shareable OR public.has_role(ARRAY['admin','management','staff']));
DROP POLICY IF EXISTS "public custom catalogue items read" ON public.custom_catalog_items;
CREATE POLICY "public custom catalogue items read" ON public.custom_catalog_items
FOR SELECT USING(public.has_role(ARRAY['admin','management','staff'])
  OR (active AND EXISTS (SELECT 1 FROM public.custom_catalog_categories c
    WHERE c.id=category_id AND (c.active OR c.shareable))));

-- Staff can only deduct *sold* quantities from an exact catalogue
-- variant/size. The row lock prevents over-selling during simultaneous edits.
CREATE OR REPLACE FUNCTION public.mark_custom_variant_sold(
  p_item uuid, p_variant text, p_size text, p_quantity integer
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  item_row public.custom_catalog_items%rowtype;
  cfg jsonb;
  group_name text;
  variant jsonb;
  size_row jsonb;
  variant_idx integer;
  size_idx integer;
  previous_stock integer;
  remaining integer;
  matches integer:=0;
  groups text[];
BEGIN
  IF NOT public.has_role(ARRAY['admin','staff']) THEN
    RAISE EXCEPTION 'Not authorized to mark sold items';
  END IF;
  IF p_quantity IS NULL OR p_quantity<1 OR p_quantity>1000000 THEN
    RAISE EXCEPTION 'Enter a valid sold quantity';
  END IF;
  IF nullif(trim(p_variant),'') IS NULL OR nullif(trim(p_size),'') IS NULL THEN
    RAISE EXCEPTION 'Select an exact variant and size';
  END IF;
  SELECT * INTO item_row FROM public.custom_catalog_items
    WHERE id=p_item FOR UPDATE;
  IF NOT FOUND OR item_row.active IS FALSE THEN RAISE EXCEPTION 'This item is unavailable'; END IF;
  cfg:=item_row.fabric_options->'uniform_config';
  IF cfg IS NULL OR jsonb_typeof(cfg)<>'object' THEN
    RAISE EXCEPTION 'This item does not have tracked variant stock';
  END IF;
  groups:=CASE WHEN cfg ? 'top' OR cfg ? 'bottom'
    THEN ARRAY['top','bottom']::text[] ELSE ARRAY['items']::text[] END;
  FOREACH group_name IN ARRAY groups LOOP
    FOR variant,variant_idx IN
      SELECT value,(ordinality-1)::integer FROM jsonb_array_elements(
        CASE WHEN jsonb_typeof(cfg->group_name)='array' THEN cfg->group_name ELSE '[]'::jsonb END
      ) WITH ORDINALITY
    LOOP
      IF variant->>'id' IS DISTINCT FROM p_variant THEN CONTINUE; END IF;
      IF coalesce((variant->>'enabled')::boolean,true)=false THEN
        RAISE EXCEPTION 'This option is disabled';
      END IF;
      FOR size_row,size_idx IN
        SELECT value,(ordinality-1)::integer FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(variant->'sizes')='array' THEN variant->'sizes' ELSE '[]'::jsonb END
        ) WITH ORDINALITY
      LOOP
        IF trim(coalesce(size_row->>'size',''))<>trim(p_size) THEN CONTINUE; END IF;
        matches:=matches+1;
        IF matches>1 THEN RAISE EXCEPTION 'Duplicate variant and size configuration'; END IF;
        IF NOT size_row ? 'stock' OR size_row->>'stock' IS NULL THEN
          RAISE EXCEPTION 'Stock is not tracked for this size';
        END IF;
        previous_stock:=(size_row->>'stock')::integer;
        remaining:=previous_stock-p_quantity;
        IF remaining<0 THEN
          RAISE EXCEPTION 'Only % pieces available for % / %',previous_stock,coalesce(variant->>'name','Variant'),p_size;
        END IF;
        cfg:=jsonb_set(cfg,ARRAY[group_name,variant_idx::text,'sizes',size_idx::text,'stock'],to_jsonb(remaining),false);
      END LOOP;
    END LOOP;
  END LOOP;
  IF matches<>1 THEN RAISE EXCEPTION 'Variant or size was not found'; END IF;
  UPDATE public.custom_catalog_items
    SET fabric_options=jsonb_set(coalesce(fabric_options,'{}'::jsonb),'{uniform_config}',cfg,true),updated_at=now()
    WHERE id=p_item;
  RETURN remaining;
END $$;

REVOKE ALL ON FUNCTION public.mark_custom_variant_sold(uuid,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mark_custom_variant_sold(uuid,text,text,integer) TO authenticated;
REVOKE ALL ON FUNCTION public.one_line_enforce_item_id() FROM PUBLIC,anon,authenticated;
COMMIT;

NOTIFY pgrst, 'reload schema';
