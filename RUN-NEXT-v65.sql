-- One-Line v65 — T-Shirts custom catalogue fabric + quality pricing
-- Run once in Supabase SQL Editor after the earlier migrations.

alter table public.custom_catalog_items
  add column if not exists fabric_options jsonb;

create table if not exists public.custom_catalog_fabrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  premium_rate numeric(12,2) not null default 0,
  standard_rate numeric(12,2) not null default 0,
  budget_rate numeric(12,2),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_custom_catalog_fabrics_sort
  on public.custom_catalog_fabrics(active,sort_order,name);

alter table public.custom_catalog_fabrics enable row level security;

drop policy if exists "public custom catalogue fabrics read" on public.custom_catalog_fabrics;
create policy "public custom catalogue fabrics read" on public.custom_catalog_fabrics
for select using(active or public.has_role(array['admin','management']));

drop policy if exists "custom catalogue fabrics admin insert" on public.custom_catalog_fabrics;
create policy "custom catalogue fabrics admin insert" on public.custom_catalog_fabrics for insert
with check(public.has_role(array['admin','management']));

drop policy if exists "custom catalogue fabrics admin update" on public.custom_catalog_fabrics;
create policy "custom catalogue fabrics admin update" on public.custom_catalog_fabrics for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));

drop policy if exists "custom catalogue fabrics admin delete" on public.custom_catalog_fabrics;
create policy "custom catalogue fabrics admin delete" on public.custom_catalog_fabrics for delete
using(public.has_role(array['admin']));

-- First ready Custom Catalogue category.
insert into public.custom_catalog_categories(name,description,active,sort_order)
values('T Shirts','Choose a T-shirt design, then select the fabric and quality for your enquiry.',true,10)
on conflict(name) do nothing;

-- Default T-shirt fabrics and quality rates.
-- ON CONFLICT DO NOTHING protects any later Admin edits if this migration is run again.
insert into public.custom_catalog_fabrics(name,premium_rate,standard_rate,budget_rate,active,sort_order) values
  ('Mars',400,350,300,true,10),
  ('NJS',380,330,280,true,20),
  ('NJ',300,270,240,true,30),
  ('Boxknit',300,270,240,true,40),
  ('Dotknit',300,270,240,true,50),
  ('Salena',300,270,240,true,60),
  ('Honeycomb',300,270,240,true,70),
  ('Polycotton',500,450,null,true,80)
on conflict(name) do nothing;
