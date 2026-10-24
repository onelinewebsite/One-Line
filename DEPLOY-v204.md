# One-Line v204 — Staff mode and size-editor layout

## Deployment sequence

1. Keep a fresh backup of production database and uploaded images. Your previous backup may not include later orders, inventory adjustments and new image files.
2. In your EXISTING One-Line Supabase SQL Editor, run **supabase/v204-staff-printable-mark-sold.sql** in full once. This is needed ONLY for the Staff **Mark as Sold** action on Ready Stock Printable sizes; it does not change checkout.
3. Run **supabase/CHECK-v204-STAFF-MARK-SOLD-READ-ONLY.sql** and confirm all five fields are true.
4. Extract this ZIP and commit the files INSIDE `One-Line-main` to the root of your existing GitHub repository. Cloudflare Pages must report a successful deployment. Keep existing environment variables and all existing Supabase migrations in place.
5. Hard-refresh the site to load `js/admin.js?v=204` and `css/admin.css?v=204`.

## Required real-world tests

- On Staff, **Mark as Sold** must be the default. Search a tracked product or size, use `− 1 +`, then Mark as Sold: current stock must decrease. Choose a controlled test SKU only.
- Press **Add Stock** at the top. The action button must become **Add to Stock**. Choose a test SKU and add quantity. Current stock must increase by exactly the entered amount.
- Press **Mark as Sold** at top to return to sales mode. The stock mode must not be inferred from the sign of the quantity input; the UI chooses the correct RPC.
- Test a Ready Stock Printable size separately. It requires the v204 SQL function to mark as sold; it still uses the existing v202 function to add stock.
- Verify no accidental negative stock, no duplicate additions, and that the staff role cannot call the service-only checkout adjustment directly.
- Check uniform sizes and Ready Stock sizes on desktop, tablet and mobile. Each variant row stays horizontally aligned; narrow screens scroll the size fields horizontally instead of splitting the row.
- Save an existing item and reopen to confirm size names, widths, lengths, stock, unlimited flags and rates are unchanged.
- Confirm category/fabric headings no longer collide with the first cards.
- Check customer login, checkout, orders and cancellations. **This build has not been live-load-tested or end-to-end checked with production payment/order data.**

## Files deliberately unchanged

- v198 inventory SQL, v202 receiving SQL, order-placement Supabase Edge Function, database structure except the new v204 staff sales audit table / RPC.
- Existing products, category assignments, product sizes and order history.
