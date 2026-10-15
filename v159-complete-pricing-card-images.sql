-- One-Line v159 — COMPLETE print type + editable print sizes setup, server-validated orders.
-- Standalone: v155-v157 print SQL are NOT prerequisites. Execute whole script in one query.
-- Print sizes are a JSON array per type. Legacy Standard/Large sizes are imported automatically, preserving prices.
-- Run this WHOLE file in Supabase SQL Editor (do not select individual column lines).
begin;
-- Distinct 3:4 card cover; existing 1:1 gallery photos remain untouched.
alter table public.custom_catalog_items add column if not exists card_image_url text;
alter table public.products add column if not exists card_image_url text;
create table if not exists public.custom_print_types (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 standard_rate numeric(12,2) not null default 0 check (standard_rate>=0),
 large_rate numeric(12,2) not null default 0 check (large_rate>=0),
 sizes jsonb not null default '[]'::jsonb check (jsonb_typeof(sizes)='array'),
 active boolean not null default true,
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
-- In an existing v155/v156 installation, add the sizes column without replacing the table.
alter table public.custom_print_types add column if not exists sizes jsonb not null default '[]'::jsonb;
-- Migrate existing rates once; rerunning never changes configured print sizes.
update public.custom_print_types
set sizes = jsonb_build_array(
  jsonb_build_object('id','Standard','name','Logo Size','rate',standard_rate),
  jsonb_build_object('id','Large','name','Large Size','rate',large_rate)
)
where sizes is null or sizes='[]'::jsonb;
-- Starter print types: uses the prices already present in One-Line's printDefaults.
-- Review all rates in Admin before accepting real orders. Existing names/rates are never overwritten.
insert into public.custom_print_types (name,standard_rate,large_rate,sizes,active,sort_order)
select starter.name,starter.small,starter.large,
       jsonb_build_array(
         jsonb_build_object('id','Standard','name','Logo Size','rate',starter.small),
         jsonb_build_object('id','Large','name','Large Size','rate',starter.large)
       ),true,starter.ord
from (values
  ('DTF Print',10::numeric,20::numeric,10),
  ('Embroidery',50::numeric,100::numeric,20),
  ('Sublimation',10::numeric,20::numeric,30),
  ('Screen Print',10::numeric,20::numeric,40)
) as starter(name,small,large,ord)
where not exists (
  select 1 from public.custom_print_types existing
  where lower(regexp_replace(existing.name,'[^a-zA-Z0-9]','','g')) like
    case starter.name when 'DTF Print' then 'dtf%' when 'Embroidery' then 'embroider%' when 'Sublimation' then 'sublim%' when 'Screen Print' then 'screen%' end
);

-- Rename only the historical default name; leave custom Admin size names and rates unchanged.
update public.custom_print_types t set sizes=(
 select coalesce(jsonb_agg(case when part->>'name'='Name / Logo Size' then jsonb_set(part,'{name}','"Logo Size"'::jsonb,true) else part end order by ord),'[]'::jsonb)
 from jsonb_array_elements(t.sizes) with ordinality as parts(part,ord)
) where exists (select 1 from jsonb_array_elements(t.sizes) part where part->>'name'='Name / Logo Size');
create index if not exists idx_custom_print_types_active on public.custom_print_types(active,sort_order,name);
alter table public.custom_print_types enable row level security;
drop policy if exists "printable public read" on public.custom_print_types;
create policy "printable public read" on public.custom_print_types for select using(active or public.has_role(array['admin','management']));
drop policy if exists "printable admin insert" on public.custom_print_types;
create policy "printable admin insert" on public.custom_print_types for insert with check(public.has_role(array['admin','management']));
drop policy if exists "printable admin update" on public.custom_print_types;
create policy "printable admin update" on public.custom_print_types for update using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));
drop policy if exists "printable admin delete" on public.custom_print_types;
create policy "printable admin delete" on public.custom_print_types for delete using(public.has_role(array['admin']));
grant select on public.custom_print_types to anon,authenticated;
grant insert,update,delete on public.custom_print_types to authenticated;
-- Print types/sizes/rates are managed in Admin. Historical legacy rates are kept for compatibility.
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
    elsif coalesce(v_item->>'itemType','product')='jersey_order' then
      v_design := coalesce(v_item->'design','{}'::jsonb);
      if v_design->>'kind' is distinct from 'jersey_order' or not (v_design ? 'validatedAt') then
        raise exception 'Jersey order must be verified through customer API';
      end if;
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1));
      v_uniform_amount := greatest(0,coalesce((v_design->>'totalAmount')::numeric,0));
      v_price := round(v_uniform_amount/v_qty,2);
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'jersey_order',coalesce(v_item->>'name','Jersey'),coalesce(v_item->>'code','JERSEY'),v_qty,v_price,v_design,coalesce(v_item->>'groupKey',''));
      v_total := v_total + v_uniform_amount;
      continue;
    elsif coalesce(v_item->>'itemType','product')='printable_order' then
      -- Edge Function has re-priced every type, fabric, size and print against Admin rows.
      v_design := coalesce(v_item->'design','{}'::jsonb);
      if v_design->>'kind' is distinct from 'printable_order' or not (v_design ? 'validatedAt') then
        raise exception 'Printable order must be re-verified through the customer API';
      end if;
      v_qty := greatest(1,coalesce((v_item->>'qty')::int,1));
      v_uniform_amount := greatest(0,coalesce((v_design->>'totalAmount')::numeric,0));
      v_price := round(v_uniform_amount/v_qty,2);
      insert into public.order_items(order_id,item_type,item_name,item_code,qty,unit_price,design_json,group_key)
      values(v_order_id,'printable_order',coalesce(v_item->>'name','Printable item'),coalesce(v_item->>'code','PRINT'),v_qty,v_price,v_design,coalesce(v_item->>'groupKey',''));
      v_total := v_total + v_uniform_amount;
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

commit;
