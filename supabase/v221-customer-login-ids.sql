-- One-Line v221: admin-issued, revocable, high-entropy customer login credentials.
-- RUN ONCE in Supabase SQL Editor before deploying Edge Functions.
create extension if not exists pgcrypto;
create table if not exists public.customer_login_keys (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  token_hash text not null unique,
  description text not null default '',
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index if not exists customer_login_keys_customer_idx on public.customer_login_keys(customer_id,created_at desc);
alter table public.customer_login_keys enable row level security;
revoke all on public.customer_login_keys from anon,authenticated;
-- Service role Edge Functions alone access credentials.
create table if not exists public.customer_login_attempts (
  ip_hash text primary key,
  window_started timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.customer_login_attempts enable row level security;
revoke all on public.customer_login_attempts from anon,authenticated;
alter table public.customer_sessions add column if not exists login_key_id uuid references public.customer_login_keys(id) on delete set null;
create index if not exists customer_sessions_login_key_idx on public.customer_sessions(login_key_id);
create or replace function public.one_line_allow_login_id_attempt(p_ip_hash text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare n integer;
begin
  if length(coalesce(p_ip_hash,'')) <> 64 then return false; end if;
  insert into public.customer_login_attempts(ip_hash,window_started,attempts)
  values(p_ip_hash,now(),1)
  on conflict (ip_hash) do update
    set attempts = case when customer_login_attempts.window_started < now() - interval '15 minutes' then 1 else customer_login_attempts.attempts + 1 end,
        window_started = case when customer_login_attempts.window_started < now() - interval '15 minutes' then now() else customer_login_attempts.window_started end
  returning attempts into n;
  return n <= 60;
end $$;
revoke all on function public.one_line_allow_login_id_attempt(text) from public,anon,authenticated;
grant execute on function public.one_line_allow_login_id_attempt(text) to service_role;
