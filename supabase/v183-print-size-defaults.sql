-- One-Line v183: standardize each print type to exactly three editable choices.
-- Keeps the existing rates wherever a matching size exists; fills missing
-- rates with starting suggestions. Review final rates in Admin before selling.
-- Run after v179 SQL and BEFORE deploying v183 customer code / edge function.
begin;

do $$
declare
  r record;
  logo_row jsonb;
  name_row jsonb;
  number_row jsonb;
  logo_rate numeric;
  name_rate numeric;
  number_rate numeric;
  suggested_logo numeric;
  suggested_name numeric;
  suggested_number numeric;
begin
  for r in select id, name, standard_rate, large_rate, sizes from public.custom_print_types loop
    -- Match stable IDs before the old free-form labels. Ignore retired sizes.
    select elem into logo_row from jsonb_array_elements(coalesce(r.sizes,'[]'::jsonb)) elem
      where coalesce(elem->>'active','true') <> 'false'
        and (elem->>'id'='Standard' or lower(coalesce(elem->>'name','')) ~ '(logo|standard)')
      order by case when elem->>'id'='Standard' then 0 else 1 end limit 1;
    select elem into name_row from jsonb_array_elements(coalesce(r.sizes,'[]'::jsonb)) elem
      where coalesce(elem->>'active','true') <> 'false'
        and (elem->>'id'='Large' or lower(coalesce(elem->>'name','')) ~ '(name|letter|large)')
      order by case when elem->>'id'='Large' then 0 else 1 end limit 1;
    select elem into number_row from jsonb_array_elements(coalesce(r.sizes,'[]'::jsonb)) elem
      where coalesce(elem->>'active','true') <> 'false'
        and (elem->>'id'='Number' or lower(coalesce(elem->>'name','')) ~ 'number')
      order by case when elem->>'id'='Number' then 0 else 1 end limit 1;

    if lower(r.name) like '%embroider%' then
      suggested_logo:=50; suggested_name:=75; suggested_number:=100;
    elsif lower(r.name) like '%sublim%' then
      suggested_logo:=20; suggested_name:=30; suggested_number:=40;
    elsif lower(r.name) like '%screen%' then
      suggested_logo:=15; suggested_name:=25; suggested_number:=35;
    else
      suggested_logo:=10; suggested_name:=20; suggested_number:=30;
    end if;

    logo_rate := case when logo_row is not null and logo_row->>'rate' ~ '^[0-9]+([.][0-9]+)?$'
                      then (logo_row->>'rate')::numeric
                      else coalesce(r.standard_rate,suggested_logo) end;
    name_rate := case when name_row is not null and name_row->>'rate' ~ '^[0-9]+([.][0-9]+)?$'
                      then (name_row->>'rate')::numeric
                      else coalesce(r.large_rate,suggested_name) end;
    number_rate := case when number_row is not null and number_row->>'rate' ~ '^[0-9]+([.][0-9]+)?$'
                      then (number_row->>'rate')::numeric
                      else suggested_number end;

    update public.custom_print_types set
      sizes=jsonb_build_array(
        jsonb_build_object('id','Standard','name','Logo Size','rate',logo_rate,'active',true),
        jsonb_build_object('id','Large','name','Name Size','rate',name_rate,'active',true),
        jsonb_build_object('id','Number','name','Number Size','rate',number_rate,'active',true)
      ),
      standard_rate=logo_rate,
      large_rate=name_rate,
      updated_at=now()
    where id=r.id;
  end loop;
end $$;
commit;
