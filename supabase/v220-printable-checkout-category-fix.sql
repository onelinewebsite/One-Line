-- One-Line v220: checkout for every ACTIVE printable-mode custom catalogue item.
-- Root cause: legacy Edge Function accepted only two literal category names.
-- This patch synchronizes server category recognition with the customer editor.
-- It does not change order totals, stock limits, cancellation, or Ready Made.
-- Run this SQL once (safe to re-run), then deploy the v220 place-order Edge Function.
BEGIN;

-- The old v144 editor-mode CHECK did not include printable. Let Admin use it.
ALTER TABLE public.custom_catalog_categories
  DROP CONSTRAINT IF EXISTS custom_catalog_categories_editor_type_check;
ALTER TABLE public.custom_catalog_categories
  ADD CONSTRAINT custom_catalog_categories_editor_type_check
  CHECK (item_editor_type IN ('auto','catalogue','tshirt','jersey','uniform','printable'));

create or replace function public.one_line_adjust_printable_inventory(p_design jsonb, p_direction integer)
returns void language plpgsql security definer set search_path=public as $$
declare
  v_item_id uuid;
  v_item public.custom_catalog_items%rowtype;
  v_opts jsonb;
  v_sizes jsonb;
  v_row jsonb;
  v_size text;
  v_qty integer;
  v_index integer;
  v_stock integer;
  v_result integer;
  v_present boolean;
  v_category_name text;
  v_category_type text;
  v_track_inventory boolean := false;
  v_asked jsonb;
  v_current_count integer := 0;
begin
  if p_direction not in (-1,1) then raise exception 'Invalid inventory direction'; end if;
  v_item_id := nullif(p_design->>'itemId','')::uuid;
  if v_item_id is null then raise exception 'Printable item ID is missing'; end if;
  select * into v_item from public.custom_catalog_items where id=v_item_id for update;
  if not found then
    if p_direction=1 then return; end if;
    raise exception 'The selected printable item no longer exists';
  end if;
  if p_direction=-1 and v_item.active=false then raise exception 'Printable item is unavailable'; end if;
  -- Track stock for all actual printable-mode items, not just a category
  -- with one exact name. Never apply printable stock to Corporate Tee Shirt.
  -- Previously deducted orders still restore even after a category is edited.
  select lower(trim(regexp_replace(coalesce(c.name,''),'[-_[:space:]]+',' ','g'))),
         lower(trim(coalesce(c.item_editor_type,'auto')))
    into v_category_name, v_category_type
    from public.custom_catalog_categories c where c.id=v_item.category_id;
  v_track_inventory := coalesce(v_category_name='ready stock printable items',false)
    or (coalesce(v_category_name,'') <> 'corporate tee shirt' and coalesce(v_category_type,'')='printable');
  if not v_track_inventory and coalesce(p_design->>'stockDeducted','false') <> 'true' then
    return;
  end if;
  v_opts := coalesce(v_item.fabric_options,'{}'::jsonb);
  v_sizes := v_opts->'sportswear_sizes';
  if jsonb_typeof(v_sizes)<>'array' then
    if p_direction=1 then return; end if;
    raise exception 'Printable stock settings are unavailable';
  end if;
  v_asked := coalesce(p_design->'sizeQuantities','{}'::jsonb);
  if jsonb_typeof(v_asked)<>'object' then raise exception 'Invalid printable size selection'; end if;
  for v_size, v_row in select key,value from jsonb_each(v_asked) loop
    if jsonb_typeof(v_row)<>'number' then raise exception 'Invalid printable quantity'; end if;
    v_qty := (v_row #>> '{}')::integer;
    if v_qty<0 or v_qty>10000 then raise exception 'Invalid printable quantity'; end if;
    if v_qty=0 then continue; end if;
    v_current_count := v_current_count+v_qty;
    v_present := false;
    for v_row,v_index in
      select value,(ordinality-1)::integer
      from jsonb_array_elements(v_sizes) with ordinality
    loop
      if trim(coalesce(v_row->>'size',v_row #>> '{}'))<>v_size then continue; end if;
      if v_present then raise exception 'Duplicate printable size: %',v_size; end if;
      v_present := true;
      -- No stock key = legacy untracked stock; unlimited flag is explicit.
      if coalesce((v_row->>'unlimited')::boolean,false)
        or not (v_row ? 'stock')
        or v_row->>'stock' is null then continue; end if;
      v_stock := greatest(0,(v_row->>'stock')::integer);
      v_result := v_stock+p_direction*v_qty;
      if v_result<0 then raise exception 'Only % piece(s) left for size %',v_stock,v_size; end if;
      v_sizes := jsonb_set(v_sizes,array[v_index::text,'stock'],to_jsonb(v_result),false);
    end loop;
    if not v_present then raise exception 'Printable size % is no longer available',v_size; end if;
  end loop;
  if p_direction=-1 and v_current_count=0 then raise exception 'Choose a printable size quantity'; end if;
  update public.custom_catalog_items
    set fabric_options=jsonb_set(v_opts,'{sportswear_sizes}',v_sizes,true),updated_at=now()
    where id=v_item_id;
end $$;
revoke all on function public.one_line_adjust_printable_inventory(jsonb,integer) from public,anon,authenticated;
grant execute on function public.one_line_adjust_printable_inventory(jsonb,integer) to service_role;

-- Trigger handles stock inside place_bulk_order() so competing checkouts
-- lock the same catalogue row; no separate non-atomic HTTP request.
create or replace function public.one_line_deduct_printable_on_order_item()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_ready_stock boolean := false;
begin
  if coalesce(new.design_json->>'kind','') <> 'printable_order'
      or not (coalesce(new.design_json,'{}'::jsonb) ? 'validatedAt') then
    raise exception 'Printable order was not validated';
  end if;
  -- Recheck live stock in the same SQL transaction that creates the order.
  perform public.one_line_adjust_printable_inventory(new.design_json,-1);
  select (lower(trim(regexp_replace(coalesce(c.name,''),'[-_[:space:]]+',' ','g')))
             = 'ready stock printable items'
           or (lower(trim(coalesce(c.item_editor_type,'auto')))='printable'
               and lower(trim(regexp_replace(coalesce(c.name,''),'[-_[:space:]]+',' ','g')))
                   <> 'corporate tee shirt')) into v_ready_stock
    from public.custom_catalog_items i
    join public.custom_catalog_categories c on c.id=i.category_id
    where i.id=(new.design_json->>'itemId')::uuid;
  if coalesce(v_ready_stock,false) then
    new.design_json := jsonb_set(new.design_json,'{stockDeducted}','true'::jsonb,true);
  end if;
  return new;
end $$;
drop trigger if exists one_line_printable_item_inventory on public.order_items;
create trigger one_line_printable_item_inventory
before insert on public.order_items
for each row when (new.item_type='printable_order')
execute function public.one_line_deduct_printable_on_order_item();

-- Cancellation keeps using existing one_line_restore_order_stock trigger.
-- No changes to old orders, items, stock balances or account records.
COMMIT;
