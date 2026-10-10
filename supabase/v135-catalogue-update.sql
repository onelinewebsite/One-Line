begin;
alter table public.customer_addresses add column if not exists business_name text not null default '';
-- Full address is now one paragraph. Legacy fields remain readable for old orders.
alter table public.customer_addresses alter column line1 type text;
create or replace function public.reorder_custom_items(p_category uuid,p_ids uuid[])
returns void language plpgsql security definer set search_path=public as $$
begin
  if not public.has_role(array['admin','management']) then raise exception 'Not authorized'; end if;
  perform 1 from public.custom_catalog_categories where id=p_category for update;
  if cardinality(p_ids) <> (select count(*) from public.custom_catalog_items where category_id=p_category)
     or cardinality(p_ids) <> (select count(distinct id) from unnest(p_ids) id)
     or exists(select 1 from unnest(p_ids) x where not exists(select 1 from public.custom_catalog_items i where i.id=x and i.category_id=p_category))
  then raise exception 'Catalogue changed. Refresh and try again.'; end if;
  update public.custom_catalog_items i set sort_order=r.n*10,updated_at=now()
    from unnest(p_ids) with ordinality r(id,n) where i.id=r.id and i.category_id=p_category;
end $$;
revoke all on function public.reorder_custom_items(uuid,uuid[]) from public;
grant execute on function public.reorder_custom_items(uuid,uuid[]) to authenticated;
-- Remove ready-made stock from public visibility without deleting order history.
update public.products set active=false,customer_visible=false;
update public.categories set active=false;
commit;
