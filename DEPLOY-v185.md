# One-Line v185 — Deployment and validation

1. Back up the Supabase project, especially `catalogue_internal_details` and `orders`.
2. Apply `supabase/v185-customer-addresses-and-short-details.sql` once in Supabase SQL Editor. The migration adds an **admin-only** address-read RLS policy and an eight-character limit for new/edited private details. It does not truncate historical private values.
3. Deploy `supabase/functions/place-order/index.ts` as the Supabase Edge Function `place-order`. The checkout uses authoritative Ready Stock item rates and saves remarks in order metadata.
4. Deploy website files to Cloudflare Pages and refresh the PWA/service worker. Never deploy Supabase SQL or secret environment files as public website content if your deployment pipeline can exclude them.
5. In Admin > Custom Catalogue > Ready Stock Printable Items, edit each item and set the **base garment rate**, and any size-specific rate overrides. Existing records may have a null item rate because older versions used fabric and quality rates. Those records cannot be checked out until priced by Admin; do not guess legacy rates.
6. Test: admin sees customer directory grouped with all saved addresses; non-admin cannot query addresses; print type info popup and browser Back; More opens relevant illustrated method page; print option per-garment totals; sizes and quantities; checkout remarks saved on order; customer A4 share/download; admin shipping 4x6 inch label barcode and order code.

### Important notes
- The print guide illustrations are explanatory diagrams, not actual garment photographs. Upload authentic printing samples before representing exact texture/quality.
- Shipping PDF includes a merchant order-reference Code39 barcode, **not** a carrier-issued tracking number. Courier AWB and tracking code must still be issued by the carrier before dispatch.
- Admin address directory queries only when Customers is opened or explicitly refreshed, with paged reads; customer PDFs and guide illustrations are client-side/static and do not add Supabase image traffic.
- Existing v184 corporate and per-garment print rules are retained; only Ready Stock Printable Items no longer asks for fabric or quality.
