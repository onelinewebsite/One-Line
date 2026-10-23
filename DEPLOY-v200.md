# One-Line v200 · Ready Stock Printable admin update

## Your environment
- Source: user's final v199 full ZIP, including v198 SQL and Supabase Edge Function sources.
- The user already ran v198 SQL successfully and verified the required function and both triggers exist and are enabled (`true`).
- **No new SQL is needed for v200. Do not run v198 again.**
- The `place-order` Edge Function has been kept byte-for-byte identical to v199.

## Deployment after backup
1. Keep your existing local PostgreSQL and Supabase Storage backups safe. Make a second copy if possible.
2. Download and extract this ZIP.
3. Upload the **contents inside** `One-Line-main` to the root of the existing One-Line GitHub repository on the Cloudflare Pages deployment branch.
4. Confirm the Cloudflare Pages build/deployment succeeds. Leave Supabase database, environment variables and storage unchanged.
5. Hard refresh both customer and admin site (service-worker cache identifier updated to v200).

## Verify admin editor
1. Admin → Custom Catalogue → Ready Stock Printable Items → open an existing item.
2. Unedited inputs should appear clearly readable (not faded). Click the pencil beside *one* item, private detail, or garment size field. Only that field should open and become violet.
3. Edit and tap the violet tick / Done; reload to confirm persisted value.
4. Test width/length in inches; values still use the same internal centimeter storage keys, preserving existing formats.
5. Test stock values and the Unlimited checkbox; ensure the customer-facing size availability matches after refresh.
6. Test Add Size on a **new** Ready Stock item: sizes should start empty rather than XS–XXL. Enter a valid size and stock; save; reopen to confirm persisted.
7. Only delete an existing size intentionally: removal now asks confirmation and saves the updated size list.

## Verify ordering
1. On a product page, `Add printing` must start OFF. Select garment size and quantity and ensure a garment-only order can be added.
2. Turn Add printing ON, choose print type(s) and sizes, and verify combined totals before checkout.
3. Test one controlled order (using an inexpensive test item if possible) and inspect database order, order items and deducted inventory. Cancel it and confirm one-time stock restoration.
4. Test Corporate Tee Shirt and another existing order type to ensure the unchanged v198 stock/checkout logic behaves as before.
5. Verify admin/management/staff dashboards, item edit and PDF/order details.

## What is verified vs not
**Verified locally:** all shipped JS syntax, isolated admin size renderer, new-item defaults, printing default, intact SQL and Edge Function hashes. **Not verified remotely:** a live authenticated admin session or a real paid/order transaction. Complete the manual checks on your deployment before treating the website as production regression-tested.
