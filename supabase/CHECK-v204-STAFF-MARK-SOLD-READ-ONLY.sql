-- Read-only verification query. Does not change your database.
SELECT
 to_regprocedure('public.staff_mark_printable_sold(uuid,text,integer)') IS NOT NULL AS v204_printable_sold_function,
 to_regclass('public.staff_printable_sales') IS NOT NULL AS v204_printable_sales_audit,
 EXISTS (SELECT 1 FROM information_schema.routine_privileges WHERE routine_schema='public'
         AND routine_name='staff_mark_printable_sold' AND grantee='authenticated'
         AND privilege_type='EXECUTE') AS authenticated_rpc_permission,
 to_regprocedure('public.staff_add_stock(text,uuid,text,text,integer)') IS NOT NULL AS v202_add_stock_preserved,
 to_regprocedure('public.one_line_adjust_printable_inventory(jsonb,integer)') IS NOT NULL AS v198_inventory_preserved;
