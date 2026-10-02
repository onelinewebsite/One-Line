-- One-Line v45 — Customization Catalogue + enquiry support
-- Run this ONCE in Supabase SQL Editor on the current One-Line database.

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

drop policy if exists "public custom catalogue categories read" on public.custom_catalog_categories;
create policy "public custom catalogue categories read" on public.custom_catalog_categories
for select using(active or public.has_role(array['admin']));

drop policy if exists "public custom catalogue items read" on public.custom_catalog_items;
create policy "public custom catalogue items read" on public.custom_catalog_items
for select using(
  public.has_role(array['admin'])
  or (active and exists(select 1 from public.custom_catalog_categories c where c.id=category_id and c.active))
);

drop policy if exists "custom catalogue categories admin insert" on public.custom_catalog_categories;
create policy "custom catalogue categories admin insert" on public.custom_catalog_categories for insert
with check(public.has_role(array['admin']));
drop policy if exists "custom catalogue categories admin update" on public.custom_catalog_categories;
create policy "custom catalogue categories admin update" on public.custom_catalog_categories for update
using(public.has_role(array['admin'])) with check(public.has_role(array['admin']));
drop policy if exists "custom catalogue categories admin delete" on public.custom_catalog_categories;
create policy "custom catalogue categories admin delete" on public.custom_catalog_categories for delete
using(public.has_role(array['admin']));

drop policy if exists "custom catalogue items admin insert" on public.custom_catalog_items;
create policy "custom catalogue items admin insert" on public.custom_catalog_items for insert
with check(public.has_role(array['admin']));
drop policy if exists "custom catalogue items admin update" on public.custom_catalog_items;
create policy "custom catalogue items admin update" on public.custom_catalog_items for update
using(public.has_role(array['admin'])) with check(public.has_role(array['admin']));
drop policy if exists "custom catalogue items admin delete" on public.custom_catalog_items;
create policy "custom catalogue items admin delete" on public.custom_catalog_items for delete
using(public.has_role(array['admin']));

-- Enquiries are stored as verified customer_activity events with event_type
-- custom_catalog_enquiry. The existing customer-event Edge Function validates
-- the customer's OTP session token before writing them, so no anonymous insert
-- policy is added here.
