-- One-Line v198: per-size inventory for Ready Stock Printable Items.
-- Existing size rows WITHOUT a 'stock' key remain unlimited/legacy-compatible.
-- Explicit finite stock is debited inside the SAME order transaction and is
-- restored when an order is cancelled, including orders made with coupons.
-- Run ONCE after v197 and before deploying the new customer site.
-- v199 packaging safety fix: Corporate Tee Shirt printable orders have no
-- Ready Stock inventory requirement; keep their existing checkout working.
BEGIN;

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
  -- Track per-size stock only for Ready Stock Printable Items. Corporate Tee
  -- Shirt uses printable_order too, but does not require this stock structure.
  -- A previously deducted line still restores/rechecks even if its category
  -- name is later changed, because its stored stockDeducted flag is authoritative.
  select lower(trim(regexp_replace(coalesce(c.name,''),'[-_[:space:]]+',' ','g')))
    into v_category_name
    from public.custom_catalog_categories c where c.id=v_item.category_id;
  if v_category_name is distinct from 'ready stock printable items'
      and coalesce(p_design->>'stockDeducted','false') <> 'true' then
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
  -- Validated checkout still checks for the item's existence and availability.
  -- This adjustment is a no-op for non-Ready Stock printable categories.
  perform public.one_line_adjust_printable_inventory(new.design_json,-1);
  select lower(trim(regexp_replace(coalesce(c.name,''),'[-_[:space:]]+',' ','g')))
           = 'ready stock printable items' into v_ready_stock
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

-- Same cancellation/reactivation semantics used by uniform stock.
create or replace function public.one_line_restore_order_stock()
returns trigger language plpgsql security definer set search_path=public as $$
declare
  v_direction integer; v_line record; v_move record; v_before integer;
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status='Cancelled' and old.status is distinct from 'Cancelled' then v_direction:=1;
  elsif old.status='Cancelled' and new.status is distinct from 'Cancelled' then v_direction:=-1;
  else return new;
  end if;
  for v_line in select item_type,design_json from public.order_items
      where order_id=new.id and item_type='uniform_order' loop
    if coalesce(v_line.design_json->>'stockDeducted','false')='true' then
      perform public.one_line_adjust_uniform_inventory(v_line.design_json,v_direction);
    end if;
  end loop;
  for v_line in select item_type,design_json from public.order_items
      where order_id=new.id and item_type='printable_order' loop
    if coalesce(v_line.design_json->>'stockDeducted','false')='true' then
      perform public.one_line_adjust_printable_inventory(v_line.design_json,v_direction);
    end if;
  end loop;
  for v_move in
    select product_id,product_variant_id,qty_delta from public.stock_movements
    where order_id=new.id and reason='Customer order' and qty_delta<0
    order by id
  loop
    if v_move.product_variant_id is not null then
      select stock into v_before from public.product_variants where id=v_move.product_variant_id for update;
      if not found then continue; end if;
      if v_before+v_direction*(-v_move.qty_delta)<0 then raise exception 'Not enough stock to reactivate cancelled order'; end if;
      update public.product_variants set stock=stock+v_direction*(-v_move.qty_delta) where id=v_move.product_variant_id;
      if v_move.product_id is not null then
        update public.products set stock=(select coalesce(sum(stock),0) from public.product_variants where product_id=v_move.product_id)
        where id=v_move.product_id;
      end if;
    elsif v_move.product_id is not null then
      select stock into v_before from public.products where id=v_move.product_id for update;
      if not found then continue; end if;
      if v_before+v_direction*(-v_move.qty_delta)<0 then raise exception 'Not enough stock to reactivate cancelled order'; end if;
      update public.products set stock=stock+v_direction*(-v_move.qty_delta) where id=v_move.product_id;
    end if;
  end loop;
  return new;
end $$;
drop trigger if exists one_line_order_stock_cancellation on public.orders;
create trigger one_line_order_stock_cancellation before update of status on public.orders
for each row execute function public.one_line_restore_order_stock();
revoke all on function public.one_line_restore_order_stock() from public,anon,authenticated;
COMMIT;
