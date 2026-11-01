-- v218: opt-in customer Professional Dashboard preferences only.
-- Apply once in the existing One-Line Supabase SQL Editor before deploying customer-account.
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS professional_dashboard_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS professional_dashboard_category_id uuid NULL;
-- Optional selected Custom Catalogue category. Does not change any order or permission policy.
COMMENT ON COLUMN public.customers.professional_dashboard_enabled IS 'Customer opt-in for Professional Dashboard';
COMMENT ON COLUMN public.customers.professional_dashboard_category_id IS 'Preferred Custom Catalogue category for customer dashboard';
