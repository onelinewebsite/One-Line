# One-Line v135 deployment

1. Run `supabase/v135-catalogue-update.sql` in your Supabase SQL Editor. This expects the existing v134 schema, including v131 customer addresses.
2. Redeploy both Edge Functions:
   - `customer-account`
   - `place-order`
   Keep the existing authentication/JWT settings and project secrets.
3. Upload/commit this complete website folder to your existing Cloudflare Pages source, including `js/order-pdf.js` and `sw.js`.
4. Refresh the website/PWA once after deployment.

## Changes

- Category and item cards have up/down ordering. Item reordering is saved atomically per category. Refresh if another admin changes the list while you are ordering it.
- Onwards displays as `INR amount Onwards`, with no slash or Piece/Set suffix.
- Admin download/share and customer download use the same text-only order PDF. The business logo/header and telephone numbers are included. DELIVER TO is highlighted; account-owner details and product/design images are excluded. Item names, codes, quantities, rates, selected variants, size quantities and team roster remain as order details.
- All customer accounts have a stable `OL-USER-` ID based on their complete existing database UUID. This covers old and new users without a backfill. Shown in Profile and the admin Customers list (also searchable). Portal accounts display `OL-STAFF-` IDs in Accounts. IDs are labels, not authentication credentials.
- Separate variants upload is available in the default catalogue item editor. Every image becomes one variant named from its filename; duplicate filenames get a numeric suffix. Edit each name, description, rates, sizes and stock, then save. No stock is invented. Existing non-variant items become variant-based when using this option.
- Every catalogue detail page displays its saved item code or database ID.
- Ready Made navigation, category creation/listing and storefront pages are retired. Old links open the customization catalogue. The migration deactivates old stock; existing order history is retained. The updated order function rejects ready-made cart lines, which customers can remove from old carts.
- Delivery address form: name, phone, optional business/institute, six-digit PIN, full address paragraph. Legacy addresses remain readable and combine into the paragraph when edited.

## Checks performed

JavaScript syntax checked. Isolated JavaScript runtime tests cover address fields, rate labels, item sorting, separate-image variant creation, catalogue controls and retired sections. Sample order PDF checked for delivery-only customer information, logo-only imagery, and rendered layout. Full browser testing was unavailable because the test browser download failed. Live Supabase operations still require the migration and Edge Function deployment above; no production database or website was changed from this workspace.
