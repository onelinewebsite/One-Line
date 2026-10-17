# One-Line v179 — Targeted Requested Changes

## Required deployment steps
1. In your existing Supabase SQL Editor, run **`supabase/v179-multiple-prints-inches-public-item-details.sql`** before uploading the updated site. This permits customers to read only the two expressly requested item details for published catalogue items, and upgrades the original default two print sizes to Logo / Letter / Number. Check/edit your Number Size prices in Admin; the migration initializes them from the previous Large Size price and does not alter custom-defined print sizes. The admin-only insert/update/delete protections remain in place.
2. Deploy the **complete updated site** including `/functions`, `/css`, `/js`, `/sw.js`, and the HTML pages through the normal Cloudflare Pages workflow.
3. **Redeploy** `supabase/functions/place-order/index.ts` with your existing Supabase Edge Function deployment method. This is required for checkout of multiple print types; deploying only static files will leave the previous one-print rule on the server. Existing auth secrets stay server-side.
4. Verify with your own actual connected Supabase project: choose two print types with different sizes/quantities, add to cart, place a test order, and inspect the Admin order breakdown. Then edit an item in each section, confirm inches in editor/customer view, and confirm both item-detail fields appear above the item name.

## Scope
- Multiple print types may be selected together, each with independent print-size quantities; selected types display a bold border and checkmark.
- Three default print sizes for newly created types: Logo Size, Letter Size, Number Size (each separately priced). The SQL only migrates unmodified v158 default pairs.
- Length and width appear and accept values in inches in the Admin and customer UI; existing database `length_cm`/`width_cm` keys intentionally remain stored in centimetres for compatibility.
- Removed old explanatory text from the Admin item detail fields; these two values now appear above the customer item title on publicly accessible Custom Catalogue and Ready Made item pages.
- Old CSS/JS backup files and superseded DEPLOY notes removed. No other features intentionally changed.

**Note:** Live database and payment testing cannot be completed from the provided ZIP alone. SQL and Edge Function deploys are mandatory before the multi-print checkout and published details work on your live domain. Keep the v178 security fixes in place.
