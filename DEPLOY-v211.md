# One-Line v211 — Optional MRP + Final Rate

Based on v210. MRP is presentation-only: it does not alter prices stored in carts, existing checkout functions, stock deductions, orders or totals.

## Required deployment order

1. Preserve a safe current Supabase backup. Your October 23 database backup predates newer data, so make a fresh database backup before deploying if products/orders have changed.
2. In the **existing One-Line** Supabase project, open SQL Editor and run `supabase/v211-optional-variant-mrp.sql` in full. It adds the nullable `mrp` column to `public.product_variants`; **do not run the base schema or the v198/v202/v204 migrations again**.
3. Verify with this read-only query:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema='public' AND table_name='product_variants' AND column_name='mrp';
   ```
   Expect one row, `numeric`, `YES`.
4. Upload the contents of `One-Line-main/` to the root of your existing GitHub repository. Confirm successful Cloudflare Pages deployment.
5. Hard-refresh the admin and customer sites. The HTML script versions and service-worker cache key were bumped to v211.

## Where the options are

- Ready Made: optional base MRP and **individual variant MRP** beside Final Rate. The Ready Made variant MRP needs the new SQL column.
- Custom Catalogue (including Ready Stock Printable and Jersey/Corporate sizes): optional item MRP and optional **per-size MRP**, kept in the existing `fabric_options` JSON. Fabric/quality-based final rates are unchanged.
- Uniform and Ready Made category variants stored in `uniform_config`: existing optional variant MRP and Final Rate remain; optional **per-size MRP** added alongside the size's Final Rate.
- Customer pages: an MRP above the corresponding final price is crossed out; the actual Final Rate remains prominent. Invalid/equal/lower MRPs are not presented as discounts. Cart and backend order calculations are unchanged.

## Live tests before broad release

- Ready Made: create/edit an option with MRP 500 and Final Rate 350; reload admin, ensure fields persist; confirm customer shows 500 crossed out next to 350; confirm cart total is based on 350.
- Ready Stock Printable: MRP 450, Final Rate 300, add a size-specific MRP and final rate, save/reload, check customer product card/detail and variant; place one controlled test order and check stock decrement.
- Uniform: enter variant and per-size MRP, reload and check displayed price; verify quantity changes use final rate.
- Corporate Tee Shirt and Full Sublimation Jerseys: confirm fabric/quality final rates, per-size rates and any selected prints still calculate unchanged.
- Confirm the no-MRP case displays only Final Rate. Check mobile layout, stock adjustment, cancellation/restock and user OTP.

**Code checks passed; live authenticated saving and checkout have not been tested by the release author.**
