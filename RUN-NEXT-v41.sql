-- One-Line v41: server-authoritative customer account sync
-- Run once AFTER the original schema.sql.
-- Safe to run whether or not the v40 migration was already applied.

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

alter table public.customer_carts
  add column if not exists version bigint not null default 0,
  add column if not exists admin_items jsonb not null default '[]'::jsonb;

update public.customer_carts
   set admin_items = items
 where jsonb_array_length(coalesce(admin_items,'[]'::jsonb)) = 0
   and jsonb_array_length(coalesce(items,'[]'::jsonb)) > 0;

create index if not exists idx_customer_carts_updated_at
  on public.customer_carts(updated_at desc);

-- Atomically mutates one customer's cart while holding a row lock.
-- This prevents two phones/laptops from overwriting each other's cart changes.
create or replace function public.customer_cart_mutate(
  p_customer_id uuid,
  p_operation text,
  p_item_key text default null,
  p_item jsonb default null
)
returns table(
  items jsonb,
  piece_count integer,
  total numeric,
  version bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_items jsonb := '[]'::jsonb;
  v_next jsonb := '[]'::jsonb;
  v_found boolean := false;
  v_item jsonb;
  v_line jsonb;
  v_subitem jsonb;
  v_qty integer := 0;
  v_piece_count integer := 0;
  v_total numeric := 0;
  v_admin_items jsonb := '[]'::jsonb;
begin
  if p_customer_id is null then
    raise exception 'Customer is required';
  end if;

  insert into public.customer_carts(customer_id,items,piece_count,total,version,updated_at)
  values(p_customer_id,'[]'::jsonb,0,0,0,now())
  on conflict (customer_id) do nothing;

  select c.items
    into v_items
  from public.customer_carts c
  where c.customer_id = p_customer_id
  for update;

  v_items := coalesce(v_items,'[]'::jsonb);

  if p_operation = 'upsert' then
    if coalesce(trim(p_item_key),'') = '' or p_item is null then
      raise exception 'Cart item key and item are required';
    end if;

    select exists(
      select 1 from jsonb_array_elements(v_items) e(value)
      where e.value->>'key' = p_item_key
    ) into v_found;

    if not v_found and jsonb_array_length(v_items) >= 120 then
      raise exception 'Cart item limit reached';
    end if;

    select coalesce(
      jsonb_agg(
        case when e.value->>'key' = p_item_key then p_item else e.value end
        order by e.ord
      ),
      '[]'::jsonb
    )
    into v_next
    from jsonb_array_elements(v_items) with ordinality as e(value,ord);

    if not v_found then
      v_next := v_next || jsonb_build_array(p_item);
    end if;
    v_items := v_next;

  elsif p_operation = 'remove' then
    if coalesce(trim(p_item_key),'') = '' then
      raise exception 'Cart item key is required';
    end if;
    select coalesce(jsonb_agg(e.value order by e.ord),'[]'::jsonb)
      into v_items
    from jsonb_array_elements(v_items) with ordinality as e(value,ord)
    where e.value->>'key' is distinct from p_item_key;

  elsif p_operation = 'clear' then
    v_items := '[]'::jsonb;
  else
    raise exception 'Invalid cart operation';
  end if;

  -- Recalculate totals from the canonical server cart, never from a cached device value.
  v_piece_count := 0;
  v_total := 0;
  for v_item in select value from jsonb_array_elements(v_items)
  loop
    v_qty := 0;
    if jsonb_typeof(v_item->'bulkLines') = 'array' then
      for v_line in select value from jsonb_array_elements(v_item->'bulkLines')
      loop
        v_qty := v_qty + greatest(0,coalesce(nullif(v_line->>'qty','')::integer,0));
      end loop;
      if jsonb_typeof(v_item->'subitems') = 'array' then
        for v_subitem in select value from jsonb_array_elements(v_item->'subitems')
        loop
          if jsonb_typeof(v_subitem->'lines') = 'array' then
            for v_line in select value from jsonb_array_elements(v_subitem->'lines')
            loop
              v_qty := v_qty + greatest(0,coalesce(nullif(v_line->>'qty','')::integer,0));
            end loop;
          end if;
        end loop;
      end if;
    else
      v_qty := greatest(0,coalesce(nullif(v_item->>'qty','')::integer,0));
    end if;
    v_piece_count := v_piece_count + v_qty;

    if v_item ? 'total' then
      v_total := v_total + greatest(0,coalesce(nullif(v_item->>'total','')::numeric,0));
    else
      v_total := v_total + greatest(0,coalesce(nullif(v_item->>'price','')::numeric,0) * greatest(0,coalesce(nullif(v_item->>'qty','')::numeric,0)));
    end if;
  end loop;

  select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
    'key',v.value->>'key',
    'productId',v.value->>'productId',
    'itemType',coalesce(v.value->>'itemType','product'),
    'name',v.value->>'name',
    'code',v.value->>'code',
    'qty',v.value->'qty',
    'detail',v.value->>'detail',
    'color',v.value->>'color',
    'size',v.value->>'size',
    'total',v.value->'total',
    'price',v.value->'price',
    'bulkLines',v.value->'bulkLines',
    'subitems',v.value->'subitems',
    'sizeQuantities',v.value->'sizeQuantities'
  )) order by v.ord),'[]'::jsonb)
    into v_admin_items
  from jsonb_array_elements(v_items) with ordinality as v(value,ord);

  update public.customer_carts c
     set items = v_items,
         admin_items = v_admin_items,
         piece_count = v_piece_count,
         total = v_total,
         version = c.version + 1,
         updated_at = now()
   where c.customer_id = p_customer_id
  returning c.items,c.piece_count,c.total,c.version,c.updated_at
       into items,piece_count,total,version,updated_at;

  return next;
end;
$$;

revoke all on function public.customer_cart_mutate(uuid,text,text,jsonb) from public;
revoke all on function public.customer_cart_mutate(uuid,text,text,jsonb) from anon;
revoke all on function public.customer_cart_mutate(uuid,text,text,jsonb) from authenticated;
grant execute on function public.customer_cart_mutate(uuid,text,text,jsonb) to service_role;
