-- One-Line v199 / v198 Ready Stock migration status (READ ONLY).
-- Run in the SQL Editor of the ONELINE 'onelinewebsite' project.
-- No data changes or writes. Run before AND after the v198 migration.
SELECT
  to_regclass('public.custom_catalog_items') IS NOT NULL AS items_table_exists,
  to_regclass('public.custom_catalog_categories') IS NOT NULL AS categories_table_exists,
  to_regclass('public.orders') IS NOT NULL AS orders_table_exists,
  to_regclass('public.order_items') IS NOT NULL AS order_items_table_exists,
  to_regprocedure('public.one_line_adjust_uniform_inventory(jsonb,integer)') IS NOT NULL AS older_uniform_stock_function_exists,
  to_regprocedure('public.place_bulk_order(uuid,text,text,text,text,text,text,jsonb)') IS NOT NULL AS bulk_checkout_function_exists,
  to_regprocedure('public.place_bulk_order_redeem(uuid,text,text,text,text,text,text,jsonb,text)') IS NOT NULL AS redeem_checkout_function_exists,
  to_regprocedure('public.one_line_adjust_printable_inventory(jsonb,integer)') IS NOT NULL AS v198_printable_stock_function_exists,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid=to_regclass('public.order_items')
      AND tgname='one_line_printable_item_inventory' AND NOT tgisinternal AND tgenabled<>'D'
  ) AS v198_printable_checkout_trigger_enabled,
  EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid=to_regclass('public.orders')
      AND tgname='one_line_order_stock_cancellation' AND NOT tgisinternal AND tgenabled<>'D'
  ) AS cancellation_restock_trigger_enabled;
