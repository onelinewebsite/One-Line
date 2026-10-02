-- One-Line v40 live-project migration
-- Run this ONCE after the original schema.sql has already been installed.

alter table public.customers
  add column if not exists business_name text not null default '',
  add column if not exists job_title text not null default '',
  add column if not exists updated_at timestamptz not null default now();

create table if not exists public.customer_carts (
  customer_id uuid primary key references public.customers(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  piece_count integer not null default 0 check(piece_count >= 0),
  total numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.customer_carts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='customer_carts'
      and policyname='customer carts admin management read'
  ) then
    create policy "customer carts admin management read"
      on public.customer_carts for select
      using(public.has_role(array['admin','management']));
  end if;
end $$;

create index if not exists idx_customers_last_seen_at on public.customers(last_seen_at desc);
create index if not exists idx_customer_activity_customer_created on public.customer_activity(customer_id,created_at desc);
create index if not exists idx_orders_customer_created on public.orders(customer_id,created_at desc);
