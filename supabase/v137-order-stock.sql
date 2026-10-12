BEGIN;
-- v137: atomic availability check + stock deduction at confirmation,
-- with a single reversal (or re-reservation) when Admin changes cancellation status.
-- Run this migration in Supabase SQL Editor BEFORE deploying place-order.

-- This helper locks the current catalogue row. Every confirmation checks CURRENT
-- variant/size quantities inside the same database transaction as order creation.
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
revoke all on function public.one_line_adjust_uniform_inventory(jsonb,integer) from public,anon,authenticated;
grant execute on function public.one_line_adjust_uniform_inventory(jsonb,integer) to service_role;

-- Replace only the ordering RPC; other database functions / behaviour stay intact.
create or replace function public.place_bulk_order(
  p_customer_id uuid, p_customer_name text, p_phone text, p_address text,
  p_business text, p_delivery text, p_payment text, p_items jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_code text := 'OL-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_item jsonb; v_line jsonb; v_total numeric := 0; v_price numeric;
  v_qty int; v_stock int; v_variant uuid; v_name text; v_code text;
  v_design jsonb; v_uniform_amount numeric;
begin
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
  insert into public.orders(id,order_code,customer_id,customer_name,phone,address,business,delivery,payment,status,total,metadata)
  values(v_order_id,v_order_code,p_customer_id,coalesce(p_customer_name,''),coalesce(p_phone,''),coalesce(p_address,''),coalesce(p_business,''),coalesce(p_delivery,''),coalesce(p_payment,''),'Confirmed',0,'{}');
  for v_item in select value from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'itemType','product')='custom_design' then
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1));
      v_price := public.custom_design_unit_price(coalesce(v_item->'design','{}'::jsonb),v_qty);
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'custom_design',coalesce(v_item->>'name','Custom design'),coalesce(v_item->>'code',''),v_qty,v_price,v_item->'design',coalesce(v_item->>'groupKey',''));
      v_total := v_total + v_qty*v_price;
      continue;
    elsif coalesce(v_item->>'itemType','product')='team_design' then
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1));
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'team_design',coalesce(v_item->>'name','Team design'),coalesce(v_item->>'code',''),v_qty,0,v_item->'design',coalesce(v_item->>'groupKey',''));
      continue;
    elsif coalesce(v_item->>'itemType','product')='uniform_order' then
      v_design := coalesce(v_item->'design','{}'::jsonb);
      -- Deduct the current variant/size stock under row lock, before confirming.
      perform public.one_line_adjust_uniform_inventory(v_design,-1);
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1));
      v_uniform_amount := greatest(0,coalesce((v_design->>'totalAmount')::numeric,0));
      v_price := round(v_uniform_amount/v_qty,2);
      -- The stockDeducted marker prevents restoring stock on legacy orders
      -- whose inventory had never been decreased.
      v_design := jsonb_set(v_design,'{stockDeducted}','true'::jsonb,true);
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'uniform_order',coalesce(v_item->>'name','Uniform'),coalesce(v_item->>'code','UNIFORM'),v_qty,v_price,v_design,coalesce(v_item->>'groupKey',''));
      v_total := v_total + v_uniform_amount;
      continue;
    end if;
    -- Existing Ready Made product-variant stock behaviour, still atomic.
    for v_line in select value from jsonb_array_elements(coalesce(v_item->'lines','[]'::jsonb)) loop
      v_qty := greatest(0,coalesce((v_line->>'qty')::int,0)); if v_qty=0 then continue; end if;
      v_variant := nullif(v_line->>'variantId','')::uuid;
      if v_variant is not null then
        select pv.stock,pv.price,p.name,p.code into v_stock,v_price,v_name,v_code
        from public.product_variants pv join public.products p on p.id=pv.product_id
        where pv.id=v_variant and pv.product_id=(v_item->>'productId')::uuid and pv.active and p.active and p.customer_visible
        for update of pv,p;
        if not found or v_stock<v_qty then raise exception 'Stock changed or product is unavailable'; end if;
        update public.product_variants set stock=stock-v_qty where id=v_variant;
        update public.products set stock=(select coalesce(sum(stock),0) from public.product_variants where product_id=(v_item->>'productId')::uuid) where id=(v_item->>'productId')::uuid;
      else
        select p.stock,p.price,p.name,p.code into v_stock,v_price,v_name,v_code from public.products p
        where p.id=(v_item->>'productId')::uuid and p.active and p.customer_visible for update;
        if not found or v_stock<v_qty then raise exception 'Stock changed or product is unavailable'; end if;
        update public.products set stock=stock-v_qty where id=(v_item->>'productId')::uuid;
      end if;
      v_price:=greatest(0,coalesce(v_price,0));
      insert into public.order_items(order_id,product_id,item_type,item_name,item_code,color,size,qty,unit_price,design_json,group_key)
      values(v_order_id,(v_item->>'productId')::uuid,'product',v_name,v_code,coalesce(v_line->>'color',''),coalesce(v_line->>'size',''),v_qty,v_price,v_item->'design',coalesce(v_item->>'groupKey',''));
      insert into public.stock_movements(product_id,product_variant_id,qty_delta,reason,order_id)
      values((v_item->>'productId')::uuid,v_variant,-v_qty,'Customer order',v_order_id);
      v_total:=v_total+v_qty*v_price;
    end loop;
  end loop;
  update public.orders set total=v_total where id=v_order_id;
  return jsonb_build_object('id',v_order_id,'orderCode',v_order_code,'total',v_total,'status','Confirmed');
end $$;
revoke all on function public.place_bulk_order(uuid,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.place_bulk_order(uuid,text,text,text,text,text,text,jsonb) to service_role;

-- Admin status changes and inventory move in the SAME transaction; crossing
-- into Cancelled restores exactly once, crossing back rechecks and reserves.
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
  for v_line in select item_type,design_json from public.order_items where order_id=new.id and item_type='uniform_order' loop
    if coalesce(v_line.design_json->>'stockDeducted','false')='true' then
      perform public.one_line_adjust_uniform_inventory(v_line.design_json,v_direction);
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
