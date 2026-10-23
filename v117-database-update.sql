-- One-Line v117 — Uniform pricing + category sharing migration
-- Run this once in Supabase SQL Editor before using the new Visible / Shareable controls.

alter table public.custom_catalog_categories
  add column if not exists shareable boolean not null default true;

do $$
declare
  old_id uuid;
  new_id uuid;
begin
  select id into old_id from public.custom_catalog_categories where lower(trim(name))='kids uniform' limit 1;
  select id into new_id from public.custom_catalog_categories where lower(trim(name))='uniform' limit 1;
  if old_id is not null and new_id is null then
    update public.custom_catalog_categories
       set name='Uniform',
           description=replace(replace(description,'Kids uniform','Uniform'),'Kids Uniform','Uniform'),
           updated_at=now()
     where id=old_id;
  elsif old_id is not null and new_id is not null and old_id<>new_id then
    update public.custom_catalog_items set category_id=new_id where category_id=old_id;
    delete from public.custom_catalog_categories where id=old_id;
  end if;
end $$;

update public.custom_catalog_categories
set description=replace(replace(description,'Kids uniform','Uniform'),'Kids Uniform','Uniform')
where lower(trim(name))='uniform';

drop policy if exists "public custom catalogue categories read" on public.custom_catalog_categories;
create policy "public custom catalogue categories read" on public.custom_catalog_categories
for select using(active or shareable or public.has_role(array['admin','management']));

drop policy if exists "public custom catalogue items read" on public.custom_catalog_items;
create policy "public custom catalogue items read" on public.custom_catalog_items
for select using(
  public.has_role(array['admin','management'])
  or (active and exists(
    select 1 from public.custom_catalog_categories c
    where c.id=category_id and (c.active or c.shareable)
  ))
);

-- Uniform MRP / Final Rate data uses the existing fabric_options JSONB field.
-- No new custom_catalog_items column is required.
