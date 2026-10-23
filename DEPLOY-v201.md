# One-Line v201 · Unified admin editor (build based on v200)

## No SQL is required
Your v198 stock function and checkout/cancellation triggers already passed your live SQL status checks. **Do not rerun v198.** This package leaves all SQL and the Supabase `place-order` Edge Function untouched.

## Deploy
1. Keep both your database dump and Supabase Storage file backup in a second safe location.
2. Extract this ZIP; upload the **contents** of `One-Line-main` to the root of the existing One-Line GitHub repository (the branch Cloudflare Pages deploys).
3. Keep Supabase credentials, Cloudflare Pages settings, and environment variables unchanged.
4. Confirm Cloudflare Pages deploys successfully; hard-refresh customer and admin pages. Service worker and asset query strings use v201.

## Changes and how saving now works
- Ready Stock Printable now resembles other Custom Catalogue editors (same heading, form fields and compact image sections). Removed oversized v200 intro and per-size edit buttons.
- Other existing product, category, custom catalogue item, customizer pricing and category settings fields are directly editable. Press the existing **Save** or **Save changes** button to persist. No extra Edit/Done per field or section.
- Fabric/print-type option rows have a single **Save** button for each row. Staff account rows have a single **Save account** button, with the same backend permissions.
- New Ready Stock items start with no garment sizes, and can add sizes via Add size. Previously saved rows, stock and rate settings are preserved.
- Add printing still starts OFF on customer Ready Stock/Corporate option flows, with ON available when needed.
- CSS makes sections lightweight, removes decorative nested backgrounds, polishes upload controls, and optimizes mobile layouts.

## Test on staging/preview before using production
1. Open an existing Ready Stock item; ensure garment sizes, stock, images and prices are unchanged. Edit one field, Save, reload, verify persisted.
2. Add a new Ready Stock item with Add size; verify inches convert internally without changing existing stored schema.
3. Edit custom category, ordinary category, Ready Made product, fabric price, printable print rate, customizer price and user-account records; test explicit Save, reload and verify.
4. Inspect uploads: card cover, detail images, separate variants, product image, category image on desktop and mobile.
5. Test Add printing OFF/ON, variants, sizes and amounts. Place one controlled test order per product type and check stock deduction/restore on cancellation.
6. If anything fails, rollback only the website code to the previous Git commit. Never reset the database or delete product images.

## Verification scope
JavaScript syntax and structural regression tests run locally. No live authenticated checkout or high-concurrency test is performed; therefore full production correctness is not guaranteed by this ZIP alone. User must test on the preview URL first.
