-- One-Line B2B account access + per-account full product / option pricing
-- Safe to run again on an existing B2B setup. Adds full product data and per-option pricing.

create extension if not exists pgcrypto;

alter table public.products
  add column if not exists b2b_access boolean not null default false;

alter table public.custom_catalog_items
  add column if not exists b2b_access boolean not null default false;

create table if not exists public.b2b_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text not null,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.b2b_accounts
  add column if not exists brand_name text,
  add column if not exists slug text,
  add column if not exists profile_photo_url text,
  add column if not exists whatsapp_number text;


create unique index if not exists b2b_accounts_username_lower_idx
  on public.b2b_accounts(lower(username));

create table if not exists public.b2b_item_prices (
  account_id uuid not null references public.b2b_accounts(id) on delete cascade,
  item_type text not null check (item_type in ('ready_made','custom_catalog')),
  item_id uuid not null,
  rate numeric(12,2) check(rate >= 0),
  pricing jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key(account_id,item_type,item_id)
);

alter table public.b2b_item_prices add column if not exists pricing jsonb not null default '{}'::jsonb;
alter table public.b2b_item_prices alter column rate drop not null;

create index if not exists b2b_item_prices_item_idx
  on public.b2b_item_prices(item_type,item_id);

create table if not exists public.b2b_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.b2b_accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists b2b_sessions_account_idx on public.b2b_sessions(account_id);
create index if not exists b2b_sessions_expiry_idx on public.b2b_sessions(expires_at);

alter table public.b2b_accounts enable row level security;
alter table public.b2b_item_prices enable row level security;
alter table public.b2b_sessions enable row level security;

drop policy if exists "b2b accounts admin read" on public.b2b_accounts;
create policy "b2b accounts admin read" on public.b2b_accounts
for select using(public.has_role(array['admin']));

drop policy if exists "b2b accounts admin write" on public.b2b_accounts;
create policy "b2b accounts admin write" on public.b2b_accounts
for all using(public.has_role(array['admin'])) with check(public.has_role(array['admin']));

drop policy if exists "b2b prices admin read" on public.b2b_item_prices;
create policy "b2b prices admin read" on public.b2b_item_prices
for select using(public.has_role(array['admin']));

drop policy if exists "b2b prices admin write" on public.b2b_item_prices;
create policy "b2b prices admin write" on public.b2b_item_prices
for all using(public.has_role(array['admin'])) with check(public.has_role(array['admin']));

-- No direct client policies are created for b2b_sessions. Public B2B access goes
-- through the SECURITY DEFINER RPCs below, so account passwords and session hashes
-- are never readable from the browser.

revoke all on public.b2b_accounts from anon;
revoke all on public.b2b_item_prices from anon;
revoke all on public.b2b_sessions from anon, authenticated;
grant select,insert,update,delete on public.b2b_accounts to authenticated;
grant select,insert,update,delete on public.b2b_item_prices to authenticated;

create or replace function public.admin_save_b2b_account(
  p_id uuid,
  p_name text,
  p_username text,
  p_password text,
  p_active boolean default true
) returns public.b2b_accounts
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_row public.b2b_accounts;
  v_name text := trim(coalesce(p_name,''));
  v_username text := lower(trim(coalesce(p_username,'')));
  v_password text := coalesce(p_password,'');
begin
  if not public.has_role(array['admin']) then
    raise exception 'Not authorized';
  end if;
  if v_name='' then raise exception 'B2B account name is required'; end if;
  if v_username='' or v_username !~ '^[a-z0-9._-]+$' then
    raise exception 'Use letters, numbers, dot, underscore or hyphen for B2B login ID';
  end if;

  if p_id is null then
    if length(v_password)<6 then raise exception 'Password must be at least 6 characters'; end if;
    insert into public.b2b_accounts(name,username,password_hash,active,updated_at)
    values(v_name,v_username,crypt(v_password,gen_salt('bf')),coalesce(p_active,true),now())
    returning * into v_row;
  else
    if length(v_password)>0 and length(v_password)<6 then raise exception 'Password must be at least 6 characters'; end if;
    update public.b2b_accounts
      set name=v_name,
          username=v_username,
          password_hash=case when length(v_password)>0 then crypt(v_password,gen_salt('bf')) else password_hash end,
          active=coalesce(p_active,true),
          updated_at=now()
      where id=p_id
      returning * into v_row;
    if v_row.id is null then raise exception 'B2B account not found'; end if;
    delete from public.b2b_sessions where account_id=v_row.id;
  end if;
  return v_row;
end $$;

create or replace function public.admin_delete_b2b_account(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
begin
  if not public.has_role(array['admin']) then raise exception 'Not authorized'; end if;
  delete from public.b2b_accounts where id=p_id;
  return found;
end $$;

create or replace function public.b2b_login(p_username text,p_password text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_account public.b2b_accounts;
  v_token text;
  v_exp timestamptz;
begin
  select * into v_account
  from public.b2b_accounts
  where lower(username)=lower(trim(coalesce(p_username,'')))
    and active
  limit 1;

  if v_account.id is null or crypt(coalesce(p_password,''),v_account.password_hash)<>v_account.password_hash then
    raise exception 'Invalid B2B login ID or password';
  end if;

  delete from public.b2b_sessions where expires_at<=now();
  v_token:=encode(gen_random_bytes(32),'hex');
  v_exp:=now()+interval '30 days';
  insert into public.b2b_sessions(account_id,token_hash,expires_at)
  values(v_account.id,encode(digest(v_token,'sha256'),'hex'),v_exp);

  return jsonb_build_object(
    'token',v_token,
    'expiresAt',v_exp,
    'account',jsonb_build_object('id',v_account.id,'name',v_account.name,'username',v_account.username,'brandName',coalesce(nullif(v_account.brand_name,''),v_account.name),'slug',coalesce(v_account.slug,''),'profilePhoto',coalesce(v_account.profile_photo_url,''),'whatsappNumber',coalesce(v_account.whatsapp_number,''))
  );
end $$;

create or replace function public.b2b_logout(p_token text)
returns boolean
language plpgsql
security definer
set search_path=public,extensions
as $$
begin
  delete from public.b2b_sessions
  where token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex');
  return true;
end $$;

create or replace function public.b2b_catalog(p_token text)
returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_account public.b2b_accounts;
  v_result jsonb;
begin
  select a.* into v_account
  from public.b2b_sessions s
  join public.b2b_accounts a on a.id=s.account_id
  where s.token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex')
    and s.expires_at>now()
    and a.active
  order by s.created_at desc
  limit 1;

  if v_account.id is null then raise exception 'B2B session expired. Please sign in again.'; end if;

  with catalog_items as (
    select
      'ready_made:'||p.id::text as id,
      'ready_made'::text as source_type,
      p.id as source_id,
      p.name,
      p.description,
      c.name as category,
      c.id as category_id,
      coalesce(sc.name,'') as subcategory,
      p.code,
      p.images,
      bp.rate,
      coalesce(bp.pricing,'{}'::jsonb) as pricing,
      p.product_type,
      p.option_title,
      p.stock,
      p.mrp,
      null::jsonb as fabric_options,
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id',v.id,
          'color',v.color,
          'size',v.size,
          'stock',v.stock,
          'barcode',v.barcode,
          'image',v.image_url,
          'active',v.active
        ) order by v.color,v.size)
        from public.product_variants v
        where v.product_id=p.id and v.active
      ),'[]'::jsonb) as variants,
      p.updated_at
    from public.products p
    join public.categories c on c.id=p.category_id
    left join public.subcategories sc on sc.id=p.subcategory_id
    left join public.b2b_item_prices bp
      on bp.account_id=v_account.id and bp.item_type='ready_made' and bp.item_id=p.id
    where p.active and p.b2b_access and c.active

    union all

    select
      'custom_catalog:'||i.id::text as id,
      'custom_catalog'::text as source_type,
      i.id as source_id,
      i.title as name,
      i.description,
      c.name as category,
      c.id as category_id,
      ''::text as subcategory,
      ''::text as code,
      i.images,
      bp.rate,
      coalesce(bp.pricing,'{}'::jsonb) as pricing,
      'Custom Catalogue'::text as product_type,
      ''::text as option_title,
      0::integer as stock,
      0::numeric as mrp,
      coalesce(i.fabric_options,'{}'::jsonb) as fabric_options,
      '[]'::jsonb as variants,
      i.updated_at
    from public.custom_catalog_items i
    join public.custom_catalog_categories c on c.id=i.category_id
    left join public.b2b_item_prices bp
      on bp.account_id=v_account.id and bp.item_type='custom_catalog' and bp.item_id=i.id
    where i.active and i.b2b_access and c.active
  )
  select jsonb_build_object(
    'account',jsonb_build_object('id',v_account.id,'name',v_account.name,'username',v_account.username,'brandName',coalesce(nullif(v_account.brand_name,''),v_account.name),'slug',coalesce(v_account.slug,''),'profilePhoto',coalesce(v_account.profile_photo_url,''),'whatsappNumber',coalesce(v_account.whatsapp_number,'')),
    'items',coalesce(jsonb_agg(jsonb_build_object(
      'id',id,
      'sourceType',source_type,
      'sourceId',source_id,
      'name',name,
      'description',description,
      'category',category,
      'categoryId',category_id,
      'subcategory',subcategory,
      'code',code,
      'images',images,
      'rate',rate,
      'pricing',pricing,
      'productType',product_type,
      'optionTitle',option_title,
      'stock',stock,
      'mrp',mrp,
      'fabricOptions',fabric_options,
      'variants',variants,
      'updatedAt',updated_at
    ) order by category,name),'[]'::jsonb)
  ) into v_result
  from catalog_items;

  return coalesce(v_result,jsonb_build_object(
    'account',jsonb_build_object('id',v_account.id,'name',v_account.name,'username',v_account.username,'brandName',coalesce(nullif(v_account.brand_name,''),v_account.name),'slug',coalesce(v_account.slug,''),'profilePhoto',coalesce(v_account.profile_photo_url,''),'whatsappNumber',coalesce(v_account.whatsapp_number,'')),
    'items','[]'::jsonb
  ));
end $$;

grant execute on function public.admin_save_b2b_account(uuid,text,text,text,boolean) to authenticated;
grant execute on function public.admin_delete_b2b_account(uuid) to authenticated;
grant execute on function public.b2b_login(text,text) to anon,authenticated;
grant execute on function public.b2b_logout(text) to anon,authenticated;
grant execute on function public.b2b_catalog(text) to anon,authenticated;

create or replace function public.cleanup_b2b_product_prices()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  delete from public.b2b_item_prices where item_type='ready_made' and item_id=old.id;
  return old;
end $$;
drop trigger if exists trg_cleanup_b2b_product_prices on public.products;
create trigger trg_cleanup_b2b_product_prices after delete on public.products
for each row execute function public.cleanup_b2b_product_prices();

create or replace function public.cleanup_b2b_custom_prices()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  delete from public.b2b_item_prices where item_type='custom_catalog' and item_id=old.id;
  return old;
end $$;
drop trigger if exists trg_cleanup_b2b_custom_prices on public.custom_catalog_items;
create trigger trg_cleanup_b2b_custom_prices after delete on public.custom_catalog_items
for each row execute function public.cleanup_b2b_custom_prices();
-- B2B public reseller storefront -------------------------------------------------
-- Each B2B account gets a branded public catalogue. Public RPCs NEVER return
-- account B2B rates/pricing. Published visitors can only ask the reseller for price.
alter table public.b2b_accounts
  add column if not exists brand_name text,
  add column if not exists slug text,
  add column if not exists profile_photo_url text,
  add column if not exists whatsapp_number text;

update public.b2b_accounts
set brand_name=coalesce(nullif(trim(brand_name),''),name),
    slug=coalesce(nullif(trim(slug),''),trim(both '-' from regexp_replace(lower(username),'[^a-z0-9]+','-','g')))
where brand_name is null or trim(brand_name)='' or slug is null or trim(slug)='';

create unique index if not exists b2b_accounts_slug_lower_idx
  on public.b2b_accounts(lower(slug)) where slug is not null and trim(slug)<>'';

create or replace function public.b2b_account_storefront_defaults()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.brand_name is null or trim(new.brand_name)='' then new.brand_name:=new.name; end if;
  if new.slug is null or trim(new.slug)='' then
    new.slug:=trim(both '-' from regexp_replace(lower(coalesce(new.username,'')),'[^a-z0-9]+','-','g'));
  end if;
  return new;
end $$;

drop trigger if exists trg_b2b_account_storefront_defaults on public.b2b_accounts;
create trigger trg_b2b_account_storefront_defaults
before insert or update on public.b2b_accounts
for each row execute function public.b2b_account_storefront_defaults();

create or replace function public.b2b_update_storefront(
  p_token text,
  p_brand_name text,
  p_whatsapp_number text,
  p_profile_photo text
) returns jsonb
language plpgsql
security definer
set search_path=public,extensions
as $$
declare
  v_account public.b2b_accounts;
  v_brand text:=trim(coalesce(p_brand_name,''));
  v_phone text:=regexp_replace(coalesce(p_whatsapp_number,''),'[^0-9]','','g');
  v_photo text:=coalesce(p_profile_photo,'');
  v_base text;
  v_slug text;
  v_n integer:=1;
begin
  select a.* into v_account
  from public.b2b_sessions s
  join public.b2b_accounts a on a.id=s.account_id
  where s.token_hash=encode(digest(coalesce(p_token,''),'sha256'),'hex')
    and s.expires_at>now() and a.active
  order by s.created_at desc limit 1;
  if v_account.id is null then raise exception 'B2B session expired. Please sign in again.'; end if;
  if v_brand='' then raise exception 'Brand name is required'; end if;
  if char_length(v_brand)>80 then raise exception 'Brand name is too long'; end if;
  if length(v_phone)=10 then v_phone:='91'||v_phone; end if;
  if length(v_phone)<8 or length(v_phone)>15 then raise exception 'Enter a valid WhatsApp number with country code'; end if;
  if char_length(v_photo)>500000 then raise exception 'Profile photo is too large'; end if;
  if v_photo<>'' and v_photo !~ '^data:image/' and v_photo !~ '^https?://' then
    raise exception 'Invalid profile photo';
  end if;

  if lower(coalesce(v_account.brand_name,''))=lower(v_brand) and coalesce(v_account.slug,'')<>'' then
    v_slug:=v_account.slug;
  else
    v_base:=trim(both '-' from regexp_replace(lower(v_brand),'[^a-z0-9]+','-','g'));
    if v_base='' then v_base:=trim(both '-' from regexp_replace(lower(v_account.username),'[^a-z0-9]+','-','g')); end if;
    if v_base='' then v_base:='store'; end if;
    v_slug:=v_base;
    while exists(select 1 from public.b2b_accounts where lower(slug)=lower(v_slug) and id<>v_account.id) loop
      v_n:=v_n+1; v_slug:=v_base||'-'||v_n::text;
    end loop;
  end if;

  update public.b2b_accounts
  set brand_name=v_brand,
      slug=v_slug,
      whatsapp_number=v_phone,
      profile_photo_url=nullif(v_photo,''),
      updated_at=now()
  where id=v_account.id
  returning * into v_account;

  return jsonb_build_object('account',jsonb_build_object(
    'id',v_account.id,'name',v_account.name,'username',v_account.username,
    'brandName',v_account.brand_name,'slug',v_account.slug,
    'profilePhoto',coalesce(v_account.profile_photo_url,''),
    'whatsappNumber',coalesce(v_account.whatsapp_number,'')
  ));
end $$;

create or replace function public.b2b_public_catalog(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_account public.b2b_accounts;
  v_result jsonb;
begin
  select * into v_account from public.b2b_accounts
  where lower(slug)=lower(trim(coalesce(p_slug,''))) and active limit 1;
  if v_account.id is null then raise exception 'Catalogue not found'; end if;

  with catalog_items as (
    select
      'ready_made:'||p.id::text as id,
      'ready_made'::text as source_type,
      p.id as source_id,
      p.name,
      p.description,
      c.name as category,
      c.id as category_id,
      coalesce(c.image_url,'') as category_image,
      coalesce(c.subtitle,'') as category_description,
      coalesce(sc.name,'') as subcategory,
      p.code,
      p.images,
      p.product_type,
      p.option_title,
      coalesce((select jsonb_agg(jsonb_build_object(
        'id',v.id,'color',v.color,'size',v.size,'image',v.image_url,'active',v.active
      ) order by v.color,v.size) from public.product_variants v
      where v.product_id=p.id and v.active),'[]'::jsonb) as variants,
      p.updated_at
    from public.products p
    join public.categories c on c.id=p.category_id
    left join public.subcategories sc on sc.id=p.subcategory_id
    where p.active and p.b2b_access and c.active

    union all

    select
      'custom_catalog:'||i.id::text,
      'custom_catalog'::text,
      i.id,
      i.title,
      i.description,
      c.name,
      c.id,
      coalesce(c.image_url,''),
      coalesce(c.description,''),
      ''::text,
      ''::text,
      i.images,
      'Custom Catalogue'::text,
      ''::text,
      '[]'::jsonb,
      i.updated_at
    from public.custom_catalog_items i
    join public.custom_catalog_categories c on c.id=i.category_id
    where i.active and i.b2b_access and c.active
  )
  select jsonb_build_object(
    'store',jsonb_build_object(
      'brandName',coalesce(nullif(v_account.brand_name,''),v_account.name),
      'slug',v_account.slug,
      'profilePhoto',coalesce(v_account.profile_photo_url,''),
      'whatsappNumber',coalesce(v_account.whatsapp_number,'')
    ),
    'items',coalesce(jsonb_agg(jsonb_build_object(
      'id',id,'sourceType',source_type,'sourceId',source_id,
      'name',name,'description',description,'category',category,'categoryId',category_id,
      'categoryImage',category_image,'categoryDescription',category_description,
      'subcategory',subcategory,'code',code,'images',images,
      'productType',product_type,'optionTitle',option_title,'variants',variants,'updatedAt',updated_at
    ) order by category,name),'[]'::jsonb)
  ) into v_result from catalog_items;

  return coalesce(v_result,jsonb_build_object(
    'store',jsonb_build_object(
      'brandName',coalesce(nullif(v_account.brand_name,''),v_account.name),
      'slug',v_account.slug,'profilePhoto',coalesce(v_account.profile_photo_url,''),
      'whatsappNumber',coalesce(v_account.whatsapp_number,'')
    ),'items','[]'::jsonb
  ));
end $$;

grant execute on function public.b2b_update_storefront(text,text,text,text) to anon,authenticated;
grant execute on function public.b2b_public_catalog(text) to anon,authenticated;

