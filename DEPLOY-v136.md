# V136 Ready Made and courier PDF update

## Required deployment steps

1. In the existing Supabase project SQL Editor, run `supabase/v136-ready-made.sql` once. This adds the catalogue section field and indexes; existing Custom Catalogue categories remain Custom Catalogue. It does not delete items or orders. Do not rerun older removal migrations.
2. Redeploy both updated Edge Functions: `place-order` and `admin-user`, preserving your existing secrets and JWT settings.
3. Upload/deploy the complete website folder to your existing Cloudflare Pages/GitHub project. The service worker and asset version are now v136.
4. Reload the installed PWA after deployment. In Admin > Categories choose Custom Catalogue or Ready Made before creating a category. Open Admin > Ready Made, open the category, and add items with the same variants, images, sizes, stock and price controls as Uniform.
5. Place a small test order, check Admin > Orders > Ready Made, download its PDF and verify the recipient and totals before taking customer orders.

## Changes

- Ready Made customer menu, home section and category page; separate admin Ready Made menu and item editor context.
- Categories have explicit section ownership. Same category name may be used once in each section.
- Ready Made reuses the existing uniform ordering flow. The server determines the section from the saved category, validates current rates and requested quantities, and snapshots section ownership in the order.
- Ready Made and mixed orders appear in the Ready Made order filter. Mixed orders are also available in Mixed Orders.
- Main order PDFs (customer, admin, share and team-order download) use the courier sheet: small logo and One Line / Touch Shopping header; ordered date/time in IST; highlighted delivery recipient; item/variant/size, quantity, rate, amount, total; sender details at the footer. No stock or product pictures. The content auto-fits a single A4 page; very large orders use smaller text.
- Concurrent catalogue reads are combined. Background refreshes can reuse a two-minute in-memory catalogue snapshot. Manual refreshes and changes reload current data; item saves update cached rows directly.
- Admin refreshes compare compact order/activity change records and avoid resending unchanged full order designs. Duplicate enquiry fetches are avoided when the feed supplies them. Requires updated admin-user deployment.
- New catalogue JPG/PNG/WebP uploads larger than 150 KB are resized to at most 1400 px and converted to WebP at 85% quality only when this produces a smaller file. Existing media and customer original artwork are not rewritten. Immutable media caching and lazy loading remain enabled.

## Validation and limits

Local functional checks passed for admin/customer section separation, category choices, uniform-editor defaults, source classification, mixed filters, authoritative checkout pricing/quantity validation, catalogue caching/forced refresh, and JavaScript/TypeScript syntax. Generated PDFs were checked for one-page output with normal and dense orders; the normal sample was visually reviewed.

A live Supabase transaction and browser end-to-end checkout were not run in this environment. The SQL and Edge Functions are included for deployment, not applied to your live project. Stock handling retains the existing uniform system; it validates available quantities but this update does not introduce stock reservation/deduction transactions. Usage reductions do not impose an account-wide spending or quota cap: monitor actual Supabase usage, which still depends on traffic, stored images, orders and OTP usage.
