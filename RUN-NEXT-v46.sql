-- One-Line v46 — Ready Made / Customize Catalogue management split
-- Run this ONCE in Supabase SQL Editor after uploading the v46 website files.
-- Safe to run on the current v45 database. It also creates the customize tables if v45 was skipped.

create table if not exists public.custom_catalog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  image_url text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_catalog_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.custom_catalog_categories(id) on delete cascade,
  title text not null,
  description text not null default '',
  images text[] not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_catalog_categories_sort on public.custom_catalog_categories(active,sort_order,name);
create index if not exists idx_custom_catalog_items_category_sort on public.custom_catalog_items(category_id,active,sort_order,created_at);

alter table public.custom_catalog_categories enable row level security;
alter table public.custom_catalog_items enable row level security;

-- Admin and Management can see hidden customize-catalogue records while editing.
drop policy if exists "public custom catalogue categories read" on public.custom_catalog_categories;
create policy "public custom catalogue categories read" on public.custom_catalog_categories
for select using(active or public.has_role(array['admin','management']));

drop policy if exists "public custom catalogue items read" on public.custom_catalog_items;
create policy "public custom catalogue items read" on public.custom_catalog_items
for select using(
  public.has_role(array['admin','management'])
  or (active and exists(select 1 from public.custom_catalog_categories c where c.id=category_id and c.active))
);

-- Management can add/edit Customize Catalogue categories/items. Destructive deletes stay Admin-only.
drop policy if exists "custom catalogue categories admin insert" on public.custom_catalog_categories;
drop policy if exists "custom catalogue categories manage insert" on public.custom_catalog_categories;
create policy "custom catalogue categories manage insert" on public.custom_catalog_categories for insert
with check(public.has_role(array['admin','management']));

drop policy if exists "custom catalogue categories admin update" on public.custom_catalog_categories;
drop policy if exists "custom catalogue categories manage update" on public.custom_catalog_categories;
create policy "custom catalogue categories manage update" on public.custom_catalog_categories for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));

drop policy if exists "custom catalogue categories admin delete" on public.custom_catalog_categories;
create policy "custom catalogue categories admin delete" on public.custom_catalog_categories for delete
using(public.has_role(array['admin']));

drop policy if exists "custom catalogue items admin insert" on public.custom_catalog_items;
drop policy if exists "custom catalogue items manage insert" on public.custom_catalog_items;
create policy "custom catalogue items manage insert" on public.custom_catalog_items for insert
with check(public.has_role(array['admin','management']));

drop policy if exists "custom catalogue items admin update" on public.custom_catalog_items;
drop policy if exists "custom catalogue items manage update" on public.custom_catalog_items;
create policy "custom catalogue items manage update" on public.custom_catalog_items for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));

drop policy if exists "custom catalogue items admin delete" on public.custom_catalog_items;
create policy "custom catalogue items admin delete" on public.custom_catalog_items for delete
using(public.has_role(array['admin']));

-- Product edit uses delete + reinsert for exact variants, so Management must be able
-- to replace variant rows without receiving permission to delete the product itself.
drop policy if exists "catalogue variants delete" on public.product_variants;
create policy "catalogue variants delete" on public.product_variants for delete
using(public.has_role(array['admin','management']));

-- Subitems are part of product management in v46. Management can add/edit them,
-- while deleting the reusable subitem itself remains Admin-only.
drop policy if exists "catalogue subitems insert" on public.subitems;
create policy "catalogue subitems insert" on public.subitems for insert
with check(public.has_role(array['admin','management']));

drop policy if exists "catalogue subitems update" on public.subitems;
create policy "catalogue subitems update" on public.subitems for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));

drop policy if exists "catalogue subitems delete" on public.subitems;
create policy "catalogue subitems delete" on public.subitems for delete
using(public.has_role(array['admin']));

drop policy if exists "catalogue subvariants insert" on public.subitem_variants;
create policy "catalogue subvariants insert" on public.subitem_variants for insert
with check(public.has_role(array['admin','management']));

drop policy if exists "catalogue subvariants update" on public.subitem_variants;
create policy "catalogue subvariants update" on public.subitem_variants for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));

drop policy if exists "catalogue subvariants delete" on public.subitem_variants;
create policy "catalogue subvariants delete" on public.subitem_variants for delete
using(public.has_role(array['admin','management']));
