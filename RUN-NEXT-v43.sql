-- One-Line v43 portal-role cleanup
-- Run this ONCE in Supabase SQL Editor after uploading the v43 website files.

-- Management: product add/edit only. Staff: mark sold only. Receiver: orders only. Admin: full access.
drop policy if exists "staff orders read" on public.orders;
create policy "staff orders read" on public.orders for select using(public.has_role(array['admin','receiver']));

drop policy if exists "staff order items read" on public.order_items;
create policy "staff order items read" on public.order_items for select using(public.has_role(array['admin','receiver']));

drop policy if exists "staff stock movements read" on public.stock_movements;
create policy "staff stock movements read" on public.stock_movements for select using(public.has_role(array['admin','staff']));

drop policy if exists "activity admin management read" on public.customer_activity;
create policy "activity admin management read" on public.customer_activity for select using(public.has_role(array['admin']));

drop policy if exists "customers admin management read" on public.customers;
create policy "customers admin management read" on public.customers for select using(public.has_role(array['admin']));

drop policy if exists "customer carts admin management read" on public.customer_carts;
create policy "customer carts admin management read" on public.customer_carts for select using(public.has_role(array['admin']));

drop policy if exists "catalogue products delete" on public.products;
create policy "catalogue products delete" on public.products for delete using(public.has_role(array['admin']));

drop policy if exists "catalogue subitems insert" on public.subitems;
create policy "catalogue subitems insert" on public.subitems for insert with check(public.has_role(array['admin']));
drop policy if exists "catalogue subitems update" on public.subitems;
create policy "catalogue subitems update" on public.subitems for update using(public.has_role(array['admin'])) with check(public.has_role(array['admin']));
drop policy if exists "catalogue subitems delete" on public.subitems;
create policy "catalogue subitems delete" on public.subitems for delete using(public.has_role(array['admin']));

drop policy if exists "catalogue subvariants insert" on public.subitem_variants;
create policy "catalogue subvariants insert" on public.subitem_variants for insert with check(public.has_role(array['admin']));
drop policy if exists "catalogue subvariants update" on public.subitem_variants;
create policy "catalogue subvariants update" on public.subitem_variants for update using(public.has_role(array['admin'])) with check(public.has_role(array['admin']));
drop policy if exists "catalogue subvariants delete" on public.subitem_variants;
create policy "catalogue subvariants delete" on public.subitem_variants for delete using(public.has_role(array['admin']));

drop policy if exists "order status update" on public.orders;
create policy "order status update" on public.orders for update using(public.has_role(array['admin','receiver'])) with check(public.has_role(array['admin','receiver']));

create or replace function public.adjust_stock(p_variant uuid, p_delta integer, p_reason text default 'Manual stock adjustment') returns void
language plpgsql security definer set search_path=public as $$
declare r public.product_variants%rowtype;
begin
  if not public.has_role(array['admin','staff']) then raise exception 'Not authorized'; end if;
  if public.has_role(array['staff']) and p_delta >= 0 then raise exception 'Staff may only mark stock as sold'; end if;
  select * into r from public.product_variants where id=p_variant for update;
  if not found then raise exception 'Variant not found'; end if;
  if r.stock + p_delta < 0 then raise exception 'Stock cannot be negative'; end if;
  update public.product_variants set stock=stock+p_delta where id=p_variant;
  update public.products set stock=(select coalesce(sum(stock),0) from public.product_variants where product_id=r.product_id) where id=r.product_id;
  insert into public.stock_movements(product_id,product_variant_id,qty_delta,actor_id,reason) values(r.product_id,p_variant,p_delta,auth.uid(),p_reason);
end $$;

create or replace function public.adjust_product_stock(p_product uuid, p_delta integer, p_reason text default 'Manual stock adjustment') returns void
language plpgsql security definer set search_path=public as $$
declare current_stock integer;
begin
  if not public.has_role(array['admin','staff']) then raise exception 'Not authorized'; end if;
  if public.has_role(array['staff']) and p_delta >= 0 then raise exception 'Staff may only mark stock as sold'; end if;
  select stock into current_stock from public.products where id=p_product for update;
  if not found then raise exception 'Product not found'; end if;
  if current_stock + p_delta < 0 then raise exception 'Stock cannot be negative'; end if;
  update public.products set stock=stock+p_delta where id=p_product;
  insert into public.stock_movements(product_id,qty_delta,actor_id,reason) values(p_product,p_delta,auth.uid(),p_reason);
end $$;

create or replace function public.adjust_subitem_stock(p_variant uuid, p_delta integer, p_reason text default 'Manual subitem stock adjustment') returns void
language plpgsql security definer set search_path=public as $$
declare r public.subitem_variants%rowtype;
begin
  if not public.has_role(array['admin','staff']) then raise exception 'Not authorized'; end if;
  if public.has_role(array['staff']) and p_delta >= 0 then raise exception 'Staff may only mark stock as sold'; end if;
  select * into r from public.subitem_variants where id=p_variant for update;
  if not found then raise exception 'Subitem variant not found'; end if;
  if r.stock + p_delta < 0 then raise exception 'Stock cannot be negative'; end if;
  update public.subitem_variants set stock=stock+p_delta where id=p_variant;
  insert into public.stock_movements(subitem_id,subitem_variant_id,qty_delta,actor_id,reason) values(r.subitem_id,p_variant,p_delta,auth.uid(),p_reason);
end $$;
