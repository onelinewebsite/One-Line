-- Read-only post-migration check; run in One-Line Supabase SQL Editor.
SELECT
  to_regprocedure('public.staff_add_stock(text,uuid,text,text,integer)') IS NOT NULL AS staff_add_stock_function_exists,
  to_regclass('public.staff_stock_additions') IS NOT NULL AS staff_stock_audit_table_exists,
  EXISTS (
    SELECT 1 FROM information_schema.role_routine_grants
    WHERE routine_schema='public' AND routine_name='staff_add_stock'
      AND grantee='authenticated' AND privilege_type='EXECUTE'
  ) AS authenticated_can_execute_rpc,
  to_regprocedure('public.one_line_adjust_printable_inventory(jsonb,integer)') IS NOT NULL AS v198_inventory_still_present;
