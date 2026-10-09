-- One-Line v134: B2B removal. BACK UP YOUR DATABASE FIRST.
-- This script is intentionally NOT executed by the website deployment.
-- It permanently deletes B2B login accounts, sessions, and assigned rates.
-- It preserves retail customers, catalogue records, ordinary orders, and enquiries.
-- Previously B2B-only products are kept inactive and hidden (not deleted).
-- Run once in Supabase SQL Editor after deploying the v134 website.
BEGIN;

-- Prevent old B2B-only products becoming visible when we remove the legacy flag.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='products' AND column_name='b2b_only') THEN
    UPDATE public.products SET active=false,customer_visible=false WHERE b2b_only = true;
  END IF;
END $$;

-- Preserve the live order function implementation; only remove the B2B-only guard.
-- This avoids reverting any newer order-processing logic in your deployed project.
DO $$
DECLARE v_fn text;
BEGIN
  SELECT pg_get_functiondef(to_regprocedure('public.place_bulk_order(uuid,text,text,text,text,text,text,jsonb)')) INTO v_fn;
  IF v_fn IS NOT NULL THEN
    v_fn := regexp_replace(v_fn, '\s+and\s+not\s+p\.b2b_only', '', 'gi');
    IF position('b2b_only' in lower(v_fn))>0 THEN
      RAISE EXCEPTION 'Could not safely remove all b2b_only references from place_bulk_order; migration cancelled';
    END IF;
    EXECUTE v_fn;
  END IF;
END $$;

-- Remove triggers before dropping their helper functions.
DROP TRIGGER IF EXISTS trg_cleanup_b2b_product_prices ON public.products;
DROP TRIGGER IF EXISTS trg_cleanup_b2b_custom_prices ON public.custom_catalog_items;

DROP FUNCTION IF EXISTS public.admin_save_b2b_account(uuid,text,text,text,boolean);
DROP FUNCTION IF EXISTS public.admin_delete_b2b_account(uuid);
DROP FUNCTION IF EXISTS public.b2b_login(text,text);
DROP FUNCTION IF EXISTS public.b2b_logout(text);
DROP FUNCTION IF EXISTS public.b2b_catalog(text);
DROP FUNCTION IF EXISTS public.b2b_update_storefront(text,text,text,text);
DROP FUNCTION IF EXISTS public.b2b_public_catalog(text);
DROP FUNCTION IF EXISTS public.b2b_public_strip_prices(jsonb);
DROP FUNCTION IF EXISTS public.cleanup_b2b_product_prices();
DROP FUNCTION IF EXISTS public.cleanup_b2b_custom_prices();
-- trg_b2b_account_storefront_defaults is dropped automatically with the account table.
DROP FUNCTION IF EXISTS public.b2b_account_storefront_defaults() CASCADE;

DROP TABLE IF EXISTS public.b2b_sessions;
DROP TABLE IF EXISTS public.b2b_item_prices;
DROP TABLE IF EXISTS public.b2b_accounts;

ALTER TABLE public.custom_catalog_items DROP COLUMN IF EXISTS b2b_access;
ALTER TABLE public.products DROP COLUMN IF EXISTS b2b_access;
ALTER TABLE public.products DROP COLUMN IF EXISTS b2b_only;

COMMIT;

-- Verification after running:
-- select table_name from information_schema.tables where table_schema='public' and table_name like 'b2b%';
-- select routine_name from information_schema.routines where routine_schema='public' and routine_name like 'b2b%';
