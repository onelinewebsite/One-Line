-- One-Line v70 — Sportswear Custom Catalogue
-- Run this ONCE in Supabase SQL Editor before using the new Sportswear pricing manager.
-- Safe to run again: existing admin-edited rows are not overwritten.

create table if not exists public.custom_sportswear_fabrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  premium_rate numeric(12,2) not null default 0,
  standard_rate numeric(12,2) not null default 0,
  budget_rate numeric(12,2) not null default 0,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_sportswear_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  price_adjustment numeric(12,2) not null default 0,
  is_base boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_custom_sportswear_one_base
  on public.custom_sportswear_types(is_base)
  where is_base = true;
create index if not exists idx_custom_sportswear_fabrics_sort
  on public.custom_sportswear_fabrics(active,sort_order,name);
create index if not exists idx_custom_sportswear_types_sort
  on public.custom_sportswear_types(active,sort_order,name);

alter table public.custom_sportswear_fabrics enable row level security;
alter table public.custom_sportswear_types enable row level security;

drop policy if exists "public custom sportswear fabrics read" on public.custom_sportswear_fabrics;
create policy "public custom sportswear fabrics read" on public.custom_sportswear_fabrics
for select using(active or public.has_role(array['admin','management']));

drop policy if exists "custom sportswear fabrics admin insert" on public.custom_sportswear_fabrics;
create policy "custom sportswear fabrics admin insert" on public.custom_sportswear_fabrics for insert
with check(public.has_role(array['admin','management']));
drop policy if exists "custom sportswear fabrics admin update" on public.custom_sportswear_fabrics;
create policy "custom sportswear fabrics admin update" on public.custom_sportswear_fabrics for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));
drop policy if exists "custom sportswear fabrics admin delete" on public.custom_sportswear_fabrics;
create policy "custom sportswear fabrics admin delete" on public.custom_sportswear_fabrics for delete
using(public.has_role(array['admin']));

drop policy if exists "public custom sportswear types read" on public.custom_sportswear_types;
create policy "public custom sportswear types read" on public.custom_sportswear_types
for select using(active or public.has_role(array['admin','management']));

drop policy if exists "custom sportswear types admin insert" on public.custom_sportswear_types;
create policy "custom sportswear types admin insert" on public.custom_sportswear_types for insert
with check(public.has_role(array['admin','management']));
drop policy if exists "custom sportswear types admin update" on public.custom_sportswear_types;
create policy "custom sportswear types admin update" on public.custom_sportswear_types for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));
drop policy if exists "custom sportswear types admin delete" on public.custom_sportswear_types;
create policy "custom sportswear types admin delete" on public.custom_sportswear_types for delete
using(public.has_role(array['admin']));

-- Sportswear category. Existing category content is preserved if it already exists.
insert into public.custom_catalog_categories(name,description,image_url,active,sort_order)
values(
  'Sportswear',
  'Choose your sportswear style, then select fabric and quality for an exact enquiry rate.',
  'assets/team-sportswear-user.jpg',
  true,
  20
)
on conflict(name) do nothing;

-- Default Sportswear catalogue item so the category is immediately visible to customers.
insert into public.custom_catalog_items(category_id,title,description,rate,images,active,sort_order)
select
  c.id,
  'Customized Sportswear',
  'Choose Round Neck, V Neck, Polo or Semi Collar, then select the fabric and quality that fits your team or event.',
  null,
  array['assets/sports-jersey.webp','assets/sports-jersey-back.webp']::text[],
  true,
  10
from public.custom_catalog_categories c
where lower(c.name)='sportswear'
  and not exists (
    select 1 from public.custom_catalog_items i
    where i.category_id=c.id and lower(i.title)='customized sportswear'
  );

-- Round Neck base prices requested for Sportswear.
insert into public.custom_sportswear_fabrics(name,premium_rate,standard_rate,budget_rate,active,sort_order) values
  ('Mars',500,450,400,true,10),
  ('NJ',400,350,300,true,20),
  ('Boxknit',350,300,300,true,30),
  ('Dotknit',350,300,300,true,40),
  ('Salena',350,300,300,true,50),
  ('Honeycomb',350,300,250,true,60),
  ('PP',300,270,240,true,70)
on conflict(name) do nothing;

-- Type prices are calculated from the selected Round Neck fabric/quality price.
insert into public.custom_sportswear_types(name,price_adjustment,is_base,active,sort_order) values
  ('Round Neck',0,true,true,10),
  ('V Neck',-50,false,true,20),
  ('Polo',50,false,true,30),
  ('Semi Collar',30,false,true,40)
on conflict(name) do nothing;
