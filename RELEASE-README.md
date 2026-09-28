# One-Line v45

Current production bundle. It includes the v43 role separation, v44 responsive cart fixes, and the new v45 Customization Catalogue + Enquiries workflow.

## Updating the current live project
1. Upload/replace the full website with this bundle.
2. In Supabase SQL Editor, run `RUN-NEXT-v45.sql` once.
3. Refresh the site/admin once after deployment. The v45 service worker replaces the older cache automatically.

No new Edge Function is required for v45: customization enquiries use the existing verified `customer-event` function.

## Fresh Supabase project
Run `supabase/schema.sql`, then follow `supabase/SETUP.md` for Auth users, Edge Functions and secrets. Do not run incremental migration files after a fresh full schema install unless specifically needed later.

## v45 Customization Catalogue
- Added `Custom Catalogue` to the customer header, mobile drawer, footer and home page.
- Full catalogue, each category, and each individual catalogue item have shareable URLs.
- Admin can create/edit/delete catalogue categories with cover images and descriptions.
- Admin can create catalogue items with a category, full description, multiple uploaded images, sort order and visibility.
- Catalogue items are customization references only and do not affect ready-made stock.
- `Enquire for customization` requires a verified customer account. A signed-out customer goes through phone → OTP → name before the enquiry is submitted.
- Admin → Enquiries shows the exact catalogue item plus verified customer name, mobile, business/institution, post/role, customer-since and last-seen details.
- Catalogue images use lazy loading and the existing optimized multi-image slider behavior.

## Existing portal roles retained
- Admin: full access, including Custom Catalogue and Enquiries.
- Management: add/edit products + Settings only.
- Staff: search exact product/variant and mark sold quantity + Settings only.
- Order Receiving: order status workflow + Settings only.
