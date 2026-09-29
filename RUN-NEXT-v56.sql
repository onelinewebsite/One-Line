-- One-Line v56 — customizer pricing
-- Run this once in Supabase SQL Editor before using the new Admin pricing controls.

alter table public.store_settings add column if not exists custom_tshirt_base_price numeric(12,2) not null default 350;
alter table public.store_settings add column if not exists custom_polo_base_price numeric(12,2) not null default 400;
alter table public.store_settings add column if not exists custom_standard_extra numeric(12,2) not null default 50;
alter table public.store_settings add column if not exists custom_premium_extra numeric(12,2) not null default 100;
alter table public.store_settings add column if not exists custom_qty_tier2_min integer not null default 11;
alter table public.store_settings add column if not exists custom_qty_tier3_min integer not null default 51;
alter table public.store_settings add column if not exists custom_qty_tier4_min integer not null default 101;
alter table public.store_settings add column if not exists custom_qty_11_50_discount numeric(12,2) not null default 30;
alter table public.store_settings add column if not exists custom_qty_51_100_discount numeric(12,2) not null default 60;
alter table public.store_settings add column if not exists custom_qty_101_plus_discount numeric(12,2) not null default 100;
alter table public.store_settings add column if not exists custom_large_print_threshold_pct numeric(6,2) not null default 20;
alter table public.store_settings alter column custom_large_print_threshold_pct set default 20;
update public.store_settings set custom_large_print_threshold_pct=20 where id=1;
alter table public.store_settings add column if not exists custom_dtf_small numeric(12,2) not null default 10;
alter table public.store_settings add column if not exists custom_dtf_large numeric(12,2) not null default 20;
alter table public.store_settings add column if not exists custom_screen_small numeric(12,2) not null default 10;
alter table public.store_settings add column if not exists custom_screen_large numeric(12,2) not null default 20;
alter table public.store_settings add column if not exists custom_embroidery_small numeric(12,2) not null default 50;
alter table public.store_settings add column if not exists custom_embroidery_large numeric(12,2) not null default 100;
alter table public.store_settings add column if not exists custom_sublimation_small numeric(12,2) not null default 10;
alter table public.store_settings add column if not exists custom_sublimation_large numeric(12,2) not null default 20;
alter table public.store_settings alter column custom_standard_extra set default 50;
alter table public.store_settings alter column custom_embroidery_small set default 50;
-- Repair only the mistaken v55 migration defaults; other admin-set values are left alone.
update public.store_settings set custom_standard_extra=50 where id=1 and custom_standard_extra=20;
update public.store_settings set custom_embroidery_small=50 where id=1 and custom_embroidery_small=20;

insert into public.store_settings(id) values(1) on conflict(id) do nothing;

update public.print_types set price=10 where lower(name) like 'dtf%';
update public.print_types set price=10 where lower(name) like 'screen%';
update public.print_types set price=50 where lower(name) like 'embroid%';
update public.print_types set price=10 where lower(name) like 'sublim%';

-- Server-side customizer pricing. The browser sends the design geometry; the database applies the live admin pricing rules.
create or replace function public.custom_design_unit_price(p_design jsonb,p_qty integer)
returns numeric language plpgsql stable security definer set search_path=public as $$
declare
  s public.store_settings%rowtype;
  v_type text := coalesce(p_design->>'garmentType','');
  v_material text := coalesce(p_design->>'materialQuality','Budget');
  v_print text := lower(coalesce(p_design->>'printType','DTF Print'));
  v_base numeric := 0;
  v_extra numeric := 0;
  v_discount numeric := 0;
  v_small numeric := 10;
  v_large numeric := 20;
  v_print_cost numeric := 0;
  v_surface jsonb;
  v_layer jsonb;
  v_width numeric := 0;
  v_threshold numeric := 20;
  v_print_count integer := 0;
begin
  select * into s from public.store_settings where id=1;
  if not found then raise exception 'Store pricing settings are missing'; end if;
  if v_type='T-Shirt' then v_base:=s.custom_tshirt_base_price;
  elsif v_type='Polo' then v_base:=s.custom_polo_base_price;
  else raise exception 'This saved custom garment type is no longer available. Please redesign it as T-Shirt or Polo.';
  end if;

  if lower(v_material)='standard' then v_extra:=s.custom_standard_extra;
  elsif lower(v_material)='premium' then v_extra:=s.custom_premium_extra;
  else v_extra:=0;
  end if;

  if greatest(1,coalesce(p_qty,1))>=s.custom_qty_tier4_min then v_discount:=s.custom_qty_101_plus_discount;
  elsif greatest(1,coalesce(p_qty,1))>=s.custom_qty_tier3_min then v_discount:=s.custom_qty_51_100_discount;
  elsif greatest(1,coalesce(p_qty,1))>=s.custom_qty_tier2_min then v_discount:=s.custom_qty_11_50_discount;
  end if;

  if v_print like '%embroid%' then v_small:=s.custom_embroidery_small;v_large:=s.custom_embroidery_large;
  elsif v_print like '%screen%' then v_small:=s.custom_screen_small;v_large:=s.custom_screen_large;
  elsif v_print like '%sublim%' then v_small:=s.custom_sublimation_small;v_large:=s.custom_sublimation_large;
  else v_small:=s.custom_dtf_small;v_large:=s.custom_dtf_large;
  end if;
  v_threshold:=greatest(1,coalesce(s.custom_large_print_threshold_pct,20));

  for v_surface in select value from jsonb_each(coalesce(p_design->'surfaceDesigns','{}'::jsonb)) loop
    for v_layer in select value from jsonb_array_elements(coalesce(v_surface->'layers','[]'::jsonb)) loop
      v_width:=greatest(0,coalesce(nullif(v_layer->>'pricingWidthPct','')::numeric,nullif(v_layer->>'scale','')::numeric,0));
      v_print_cost:=v_print_cost + case when v_width>v_threshold then v_large else v_small end;
      v_print_count:=v_print_count+1;
    end loop;
  end loop;

  -- Compatibility with a legacy front-only design that predates surfaceDesigns/layers.
  if v_print_count=0 and (coalesce(p_design->>'text','')<>'' or coalesce(p_design->>'uploadedImage','')<>'') then
    v_width:=greatest(coalesce(nullif(p_design->>'textScale','')::numeric,0),coalesce(nullif(p_design->>'imageScale','')::numeric,0));
    v_print_cost:=case when v_width>v_threshold then v_large else v_small end;
  end if;

  return greatest(0,v_base+v_extra+v_print_cost-v_discount);
end $$;

-- Atomic order creation + stock validation/decrement. Called only from the place-order Edge Function using a server secret.
create or replace function public.place_bulk_order(
  p_customer_id uuid,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_business text,
  p_delivery text,
  p_payment text,
  p_items jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_order_code text := 'OL-' || to_char(now(),'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  v_item jsonb; v_line jsonb; v_sub jsonb; v_total numeric := 0; v_price numeric; v_qty int; v_stock int; v_variant uuid; v_subvariant uuid; v_name text; v_code text;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
  insert into public.orders(id,order_code,customer_id,customer_name,phone,address,business,delivery,payment,status,total,metadata)
  values(v_order_id,v_order_code,p_customer_id,coalesce(p_customer_name,''),coalesce(p_phone,''),coalesce(p_address,''),coalesce(p_business,''),coalesce(p_delivery,''),coalesce(p_payment,''),'Confirmed',0,'{}');

  for v_item in select * from jsonb_array_elements(p_items) loop
    if coalesce(v_item->>'itemType','product')='custom_design' then
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1));
      v_price := public.custom_design_unit_price(coalesce(v_item->'design','{}'::jsonb),v_qty);
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'custom_design',coalesce(v_item->>'name','Custom design'),coalesce(v_item->>'code',''),v_qty,v_price,v_item->'design',coalesce(v_item->>'groupKey',''));
      v_total := v_total + v_qty*v_price;
      continue;
    elsif coalesce(v_item->>'itemType','product')='team_design' then
      -- Team-upload designs remain enquiry/quote items.
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1)); v_price := 0;
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'team_design',coalesce(v_item->>'name','Team design'),coalesce(v_item->>'code',''),v_qty,v_price,v_item->'design',coalesce(v_item->>'groupKey',''));
      continue;
    end if;

    for v_line in select * from jsonb_array_elements(coalesce(v_item->'lines','[]'::jsonb)) loop
      v_qty := greatest(0,coalesce((v_line->>'qty')::int,0)); if v_qty=0 then continue; end if;
      v_variant := nullif(v_line->>'variantId','')::uuid;
      if v_variant is not null then
        select pv.stock,pv.price,p.name,p.code into v_stock,v_price,v_name,v_code
        from public.product_variants pv join public.products p on p.id=pv.product_id
        where pv.id=v_variant and pv.product_id=(v_item->>'productId')::uuid and pv.active and p.active and p.customer_visible and not p.b2b_only
        for update of pv,p;
        if not found or v_stock < v_qty then raise exception 'Stock changed or product is unavailable'; end if;
        update public.product_variants set stock=stock-v_qty where id=v_variant;
        update public.products set stock=(select coalesce(sum(stock),0) from public.product_variants where product_id=(v_item->>'productId')::uuid) where id=(v_item->>'productId')::uuid;
      else
        select p.stock,p.price,p.name,p.code into v_stock,v_price,v_name,v_code
        from public.products p
        where p.id=(v_item->>'productId')::uuid and p.active and p.customer_visible and not p.b2b_only
        for update;
        if not found or v_stock < v_qty then raise exception 'Stock changed or product is unavailable'; end if;
        update public.products set stock=stock-v_qty where id=(v_item->>'productId')::uuid;
      end if;
      -- Never trust catalogue identity or pricing supplied by the browser; use locked database values.
      v_price := greatest(0,coalesce(v_price,0));
      insert into public.order_items(order_id,product_id,item_type,item_name,item_code,color,size,qty,unit_price,design_json,group_key)
      values(v_order_id,(v_item->>'productId')::uuid,'product',v_name,v_code,coalesce(v_line->>'color',''),coalesce(v_line->>'size',''),v_qty,v_price,v_item->'design',coalesce(v_item->>'groupKey',''));
      insert into public.stock_movements(product_id,product_variant_id,qty_delta,reason,order_id) values((v_item->>'productId')::uuid,v_variant,-v_qty,'Customer order',v_order_id);
      v_total := v_total + v_qty*v_price;
    end loop;

    for v_sub in select * from jsonb_array_elements(coalesce(v_item->'subitems','[]'::jsonb)) loop
      if not exists(
        select 1 from public.product_subitems ps
        where ps.product_id=(v_item->>'productId')::uuid and ps.subitem_id=(v_sub->>'subitemId')::uuid
      ) then raise exception 'Subitem is not linked to this product'; end if;
      for v_line in select * from jsonb_array_elements(coalesce(v_sub->'lines','[]'::jsonb)) loop
        v_qty := greatest(0,coalesce((v_line->>'qty')::int,0)); if v_qty=0 then continue; end if;
        v_subvariant := nullif(v_line->>'variantId','')::uuid;
        select sv.stock,sv.price,si.name,si.code into v_stock,v_price,v_name,v_code
        from public.subitem_variants sv join public.subitems si on si.id=sv.subitem_id
        where sv.id=v_subvariant and sv.subitem_id=(v_sub->>'subitemId')::uuid and sv.active and si.active
        for update of sv,si;
        if not found or v_stock < v_qty then raise exception 'Stock changed or subitem is unavailable'; end if;
        update public.subitem_variants set stock=stock-v_qty where id=v_subvariant;
        -- Never trust subitem identity or pricing supplied by the browser; use locked database values.
        v_price := greatest(0,coalesce(v_price,0));
        insert into public.order_items(order_id,subitem_id,item_type,item_name,item_code,color,size,qty,unit_price,group_key)
        values(v_order_id,(v_sub->>'subitemId')::uuid,'subitem',v_name,v_code,coalesce(v_line->>'color',''),coalesce(v_line->>'size',''),v_qty,v_price,coalesce(v_item->>'groupKey',''));
        insert into public.stock_movements(subitem_id,subitem_variant_id,qty_delta,reason,order_id) values((v_sub->>'subitemId')::uuid,v_subvariant,-v_qty,'Customer order',v_order_id);
        v_total := v_total + v_qty*v_price;
      end loop;
    end loop;
  end loop;
  update public.orders set total=v_total where id=v_order_id;
  return jsonb_build_object('id',v_order_id,'orderCode',v_order_code,'total',v_total,'status','Confirmed');
exception when others then
  delete from public.orders where id=v_order_id;
  raise;
end $$;

-- Only the server-side Edge Function may execute the stock-deducting order RPC.
revoke all on function public.place_bulk_order(uuid,text,text,text,text,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.custom_design_unit_price(jsonb,integer) from public, anon, authenticated;
grant execute on function public.custom_design_unit_price(jsonb,integer) to service_role;
grant execute on function public.place_bulk_order(uuid,text,text,text,text,text,text,jsonb) to service_role;
