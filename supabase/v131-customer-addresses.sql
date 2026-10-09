-- v131: account-linked saved delivery addresses (accessed only through authenticated Edge Function).
create table if not exists public.customer_addresses (
 id uuid primary key default gen_random_uuid(),
 customer_id uuid not null references public.customers(id) on delete cascade,
 label text not null default 'Home',
 recipient_name text not null,
 phone text not null default '',
 line1 text not null,
 line2 text not null default '',
 city text not null,
 district text not null default '',
 state text not null default 'Kerala',
 postal_code text not null default '',
 landmark text not null default '',
 is_default boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists idx_customer_addresses_owner on public.customer_addresses(customer_id,created_at);
alter table public.customer_addresses enable row level security;
-- No public/user table policy: the customer-account Edge Function verifies the OTP session.
