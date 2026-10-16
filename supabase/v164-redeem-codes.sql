-- One-Line v164: fixed-amount redeem codes, single-use per customer by default.
-- Run the ENTIRE migration once in Supabase SQL Editor, after earlier required v159 schema migrations.
-- Does not delete, reprice or change existing orders, products or inventory.
begin;
create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]{3,32}$'),
  amount numeric(12,2) not null check (amount > 0),
  min_order_total numeric(12,2) not null default 0 check (min_order_total >= 0),
  active boolean not null default true,
  max_uses integer check (max_uses is null or max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  per_customer_limit integer not null default 1 check (per_customer_limit > 0),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.redeem_redemptions (
  id uuid primary key default gen_random_uuid(),
  redeem_code_id uuid not null references public.redeem_codes(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  discount numeric(12,2) not null check (discount >= 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_redeem_customer_code on public.redeem_redemptions(customer_id, redeem_code_id);
create index if not exists idx_redeem_active on public.redeem_codes(active, code);
alter table public.redeem_codes enable row level security;
alter table public.redeem_redemptions enable row level security;
drop policy if exists "redeem_admin_read" on public.redeem_codes;
create policy "redeem_admin_read" on public.redeem_codes for select to authenticated using (public.has_role(array['admin']));
drop policy if exists "redeem_admin_insert" on public.redeem_codes;
create policy "redeem_admin_insert" on public.redeem_codes for insert to authenticated with check (public.has_role(array['admin']));
drop policy if exists "redeem_admin_update" on public.redeem_codes;
create policy "redeem_admin_update" on public.redeem_codes for update to authenticated using (public.has_role(array['admin'])) with check (public.has_role(array['admin']));
drop policy if exists "redeem_admin_delete" on public.redeem_codes;
create policy "redeem_admin_delete" on public.redeem_codes for delete to authenticated using (public.has_role(array['admin']));
revoke all on public.redeem_codes from anon,authenticated;
grant select,insert,update,delete on public.redeem_codes to authenticated;
revoke all on public.redeem_redemptions from anon,authenticated;
-- Example code: active and usable once per account. Change or deactivate in Admin Settings.
insert into public.redeem_codes (code, amount, active, per_customer_limit)
values ('ONE03X001', 50, true, 1)
on conflict (code) do nothing;
-- Wrapper calls existing, stock-safe place_bulk_order in the SAME SQL transaction.
-- Validation, order, usage count, and discounted total commit or roll back together.
create or replace function public.place_bulk_order_redeem (
  p_customer_id uuid, p_customer_name text, p_phone text, p_address text,
  p_business text, p_delivery text, p_payment text, p_items jsonb,
  p_redeem_code text
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_code public.redeem_codes%rowtype;
  v_placed jsonb;
  v_order_id uuid;
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_customer_uses integer;
begin
  select * into v_code from public.redeem_codes
    where code = upper(trim(coalesce(p_redeem_code,''))) for update;
  if not found or not v_code.active then raise exception 'Redeem code is not available'; end if;
  if v_code.expires_at is not null and v_code.expires_at <= now() then raise exception 'Redeem code has expired'; end if;
  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then raise exception 'Redeem code usage limit reached'; end if;
  select count(*) into v_customer_uses from public.redeem_redemptions
    where redeem_code_id = v_code.id and customer_id = p_customer_id;
  if v_customer_uses >= v_code.per_customer_limit then raise exception 'You have already used this code'; end if;
  -- Calls the currently installed place_bulk_order implementation. Stock checks are preserved.
  v_placed := public.place_bulk_order(p_customer_id, p_customer_name, p_phone, p_address,
    p_business, p_delivery, p_payment, p_items);
  v_order_id := (v_placed->>'id')::uuid;
  select total into v_subtotal from public.orders where id=v_order_id for update;
  if v_subtotal is null or v_subtotal <= 0 then raise exception 'Discount requires a paid order'; end if;
  if v_subtotal < v_code.min_order_total then raise exception 'Order does not meet code minimum amount'; end if;
  v_discount := least(v_subtotal, v_code.amount);
  update public.orders
  set total = v_subtotal - v_discount,
      metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
        'redeem',jsonb_build_object('code',v_code.code,'discount',v_discount,
         'subtotal',v_subtotal))
  where id = v_order_id;
  insert into public.redeem_redemptions(redeem_code_id,customer_id,order_id,discount)
    values (v_code.id,p_customer_id,v_order_id,v_discount);
  update public.redeem_codes
    set used_count=used_count+1, updated_at=now()
    where id=v_code.id;
  return v_placed || jsonb_build_object('total',v_subtotal-v_discount,'subtotal',v_subtotal,
    'discount',v_discount,'redeemCode',v_code.code);
end $$;
revoke all on function public.place_bulk_order_redeem(uuid,text,text,text,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.place_bulk_order_redeem(uuid,text,text,text,text,text,text,jsonb,text) to service_role;
commit;
