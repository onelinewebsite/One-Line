-- One-Line v143: Run after v142 and v137, before deploying v143 Edge Function.
-- Unlimited is stored per custom-catalogue / Ready Made catalogue variant size
-- within fabric_options.uniform_config JSON. Finite stock is preserved unchanged.
BEGIN;
create or replace function public.one_line_adjust_uniform_inventory(p_design jsonb, p_direction integer)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_id uuid; v_item public.custom_catalog_items%rowtype;
  v_config jsonb; v_selection jsonb; v_selected jsonb;
  v_section text; v_variant jsonb; v_sizes jsonb; v_row jsonb;
  v_vi int; v_si int; v_qty int; v_before int; v_after int;
  v_size text; v_option_id text; v_found boolean;
  v_path text[]; v_sections text[]; v_common jsonb; v_common_row jsonb;
  v_limit int; v_left int; v_common_stock int;
begin
  if p_direction not in (-1,1) then raise exception 'Invalid stock adjustment'; end if;
  v_id := nullif(p_design->>'itemId','')::uuid;
  if v_id is null then raise exception 'The ordered item is missing'; end if;
  select * into v_item from public.custom_catalog_items where id=v_id for update;
  -- Deleted catalogue entries cannot be restocked; never silently confirm a deleted item.
  if not found then
    if p_direction=1 then return; end if;
    raise exception 'This item is no longer available';
  end if;
  if p_direction=-1 and coalesce(v_item.active,true)=false then
    raise exception 'This item is no longer available';
  end if;
  v_config := v_item.fabric_options->'uniform_config';
  if v_config is null or jsonb_typeof(v_config)<>'object' then
    raise exception 'Stock configuration is missing for this item';
  end if;
  v_sections := case when jsonb_typeof(v_config->'top')='array' or jsonb_typeof(v_config->'bottom')='array'
    then array['top','bottom']::text[] else array['items']::text[] end;
  v_selection := coalesce(p_design->'selectedItems','[]'::jsonb);
  if jsonb_typeof(v_selection)<>'array' or jsonb_array_length(v_selection)=0 then
    raise exception 'Choose an available size before placing the order';
  end if;
  for v_selected in select value from jsonb_array_elements(v_selection) loop
    v_option_id := coalesce(v_selected->>'id','');
    if v_option_id='' then raise exception 'An ordered option is missing'; end if;
    v_found := false;
    foreach v_section in array v_sections loop
      for v_variant,v_vi in select value, (ordinality-1)::int from jsonb_array_elements(case when jsonb_typeof(v_config->v_section)='array' then v_config->v_section else '[]'::jsonb end) with ordinality loop
        if coalesce(v_variant->>'id','')<>v_option_id then continue; end if;
        if v_found then raise exception 'Duplicate option ID in item configuration'; end if;
        v_found := true;
        if p_direction=-1 and coalesce((v_variant->>'enabled')::boolean,true)=false then
          raise exception 'Selected option is unavailable';
        end if;
        v_sizes := case when jsonb_typeof(v_variant->'sizes')='array' then v_variant->'sizes' else '[]'::jsonb end;
        -- Older catalogue configurations kept one common size table and
        -- a stock limit per variant. Normalize that one variant on first use.
        if jsonb_array_length(v_sizes)=0 and jsonb_typeof(v_config->'sizes')='array' then
          v_common := v_config->'sizes'; v_sizes := '[]'::jsonb;
          v_limit := greatest(0,coalesce((v_variant->>'stock')::int,0)); v_left := v_limit;
          for v_common_row in select value from jsonb_array_elements(v_common) loop
            v_common_stock := greatest(0,coalesce((v_common_row->>'stock')::int,0));
            if v_limit=0 then v_common_stock:=0;
            else v_common_stock:=least(v_common_stock,v_left);v_left:=greatest(0,v_left-v_common_stock);end if;
            v_sizes := v_sizes || jsonb_build_array(jsonb_set(
              case when jsonb_typeof(v_common_row)='object' then v_common_row else jsonb_build_object('size',v_common_row #>> '{}') end,
              '{stock}',to_jsonb(v_common_stock),true));
          end loop;
          v_config := jsonb_set(v_config,array[v_section,v_vi::text,'sizes'],v_sizes,true);
        end if;
        for v_size,v_qty in select key, (value #>> '{}')::integer from jsonb_each(coalesce(v_selected->'sizeQuantities','{}'::jsonb)) loop
          if v_qty <= 0 then continue; end if;
          if v_qty > 1000000 then raise exception 'Invalid quantity'; end if;
          declare v_size_found boolean := false;
          begin
            for v_row,v_si in select value,(ordinality-1)::int from jsonb_array_elements(v_sizes) with ordinality loop
              if trim(coalesce(v_row->>'size',''))<>v_size then continue; end if;
              if v_size_found then raise exception 'Duplicate size in item configuration'; end if;
              v_size_found := true;
              -- A configured size with no tracked stock is not debited; only
              -- explicitly recorded stock numbers are inventory controlled.
              if coalesce((v_row->>'unlimited')::boolean,false) then continue; end if;
              if not (v_row ? 'stock') or v_row->>'stock' is null then continue; end if;
              v_before := greatest(0,(v_row->>'stock')::integer);
              v_after := v_before + p_direction*v_qty;
              if v_after < 0 then
                raise exception '% size % has only % left in stock', coalesce(v_variant->>'name','Item'),v_size,v_before;
              end if;
              v_path := array[v_section,v_vi::text,'sizes',v_si::text,'stock'];
              v_config := jsonb_set(v_config,v_path,to_jsonb(v_after),false);
            end loop;
            if not v_size_found then
              raise exception 'Size % is no longer available',v_size;
            end if;
          end;
        end loop;
      end loop;
    end loop;
    if not v_found then raise exception 'The ordered option is no longer available'; end if;
  end loop;
  update public.custom_catalog_items
     set fabric_options=jsonb_set(coalesce(fabric_options,'{}'::jsonb),'{uniform_config}',v_config,true)
   where id=v_id;
end $$;

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
        IF coalesce((size_row->>'unlimited')::boolean,false) THEN
          RAISE EXCEPTION 'Unlimited stock sizes do not have a quantity to deduct';
        END IF;
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
COMMIT;
NOTIFY pgrst, 'reload schema';
