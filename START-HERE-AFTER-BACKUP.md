> **Current project status (October 23, 2026):** Your Supabase v198 stock function, checkout trigger, and cancellation trigger were verified `true` in SQL Editor. **Do not run v198 SQL again.** This v200 ZIP changes frontend administration layout and defaults only; deploy website files through GitHub/Cloudflare Pages. The v198 SQL is retained only as a reference for fresh installs. The running `place-order` Edge Function you pasted contains both `validatePrintableOrder` and server-side `validatedAt` markers; its source is unchanged here. After deployment, run controlled checkout/stock/cancellation tests before considering the change verified in production.

# ONE-LINE — v199 FINAL READY PACKAGE (includes v198 inventory SQL)

Project: **One-Line / onelinesmart.com** (Supabase project **onelinewebsite**). **Not SHOPIZO**.

This is the complete **original v199 Supabase-Free / Cloudflare-Scale-Optimized** website package supplied on 23 October 2026, plus a corrected v198 inventory migration and this clearer install guide. **Not** the smaller alternate `One-Line-Optimized-v199.zip` patch. The v199 pagination / public catalogue cache / media proxy / product display batching remain in place.

## Already backed up

- Local database archive: `C:\Users\welcome\OneLine-Backup\oneline-2026-10-23.dump` (prior `pg_restore -l` list succeeded; full restore not tested).
- Local Storage: `C:\Users\welcome\OneLine-Backup\product-images\` — 254 downloaded objects; the 255th was `orders/.emptyFolderPlaceholder` (a directory marker, not an image).
- **Copy `OneLine-Backup` to a second drive/cloud location before changing production.** New orders/uploads after 23 Oct snapshot are not included. If production has changed since that snapshot, take a new backup/refresh before migration.
- Revoke the exposed temporary S3 key, rotate any exposed DB password, and clear AWS environment variables when no longer required.

## Exact order AFTER backup

### A. PRECHECK (read-only, safe)

1. Open the existing **Supabase `onelinewebsite` project** (NOT SHOPIZO) -> **SQL Editor** -> New query.
2. Paste and run **`supabase/CHECK-v198-STATUS-READ-ONLY.sql`**.
3. Check `items_table_exists`, `categories_table_exists`, `orders_table_exists`, `order_items_table_exists`, `older_uniform_stock_function_exists`, `bulk_checkout_function_exists`, and `redeem_checkout_function_exists`: **all should be true**. If any is false, STOP: this release expects prior migrations already installed. Do NOT run old version SQL files at random.
4. If both `v198_printable_stock_function_exists` and `v198_printable_checkout_trigger_enabled` are **false**, your database appears to need the v198 SQL. If both are **true**, it may already be installed — verify its definition/version before skipping; don't blindly run it again. If one is true and the other false, STOP and diagnose partial installation.

### B. Ensure the checkout Edge Function is compatible

The included **`supabase/functions/place-order/index.ts`** has `validatePrintableOrder` and sets the server-side `validatedAt` marker. **Cloudflare/GitHub does NOT deploy Supabase Edge Functions.** If the live `place-order` function is older than the v197/v198-compatible code, update it first from the included file using the Supabase CLI or Edge Function deployment workflow. No other Edge Functions need replacing solely for this migration. If your current live function already supports these checks, leave it unchanged. Keep its current secrets and permissions; never paste a `service_role` key into website files.

CLI example **only if `place-order` needs redeployment** (run in PowerShell from the extracted `One-Line-main` folder, with Node/npx available):

```powershell
npx supabase login
npx supabase link --project-ref eiozlrnrvlfyflddemla
npx supabase functions deploy place-order --no-verify-jwt
```

The included `supabase/config.toml` also sets `verify_jwt = false` for `place-order`, because this function verifies the customer's session inside its code. Check its deployed access/secret configuration before updating. **Do not redeploy functions if you cannot verify their expected config.**

### C. Run the ONE required inventory SQL (if precheck says missing)

1. Schedule a low-traffic maintenance window for checkout testing. Keep a known-good deployment to roll back the frontend if necessary.
2. In **Supabase `onelinewebsite` > SQL Editor**, open **`supabase/v198-ready-stock-inventory.sql`** and execute the *entire script once*. Do **not** execute `schema.sql` or older unrelated migrations. It is wrapped in `BEGIN` / `COMMIT` and creates/replaces functions and order triggers. It doesn't intentionally delete data rows or overwrite existing catalogue items.
3. Stop if there is a SQL error. Don't deploy stock-managed sales until it is resolved.
4. Re-run `supabase/CHECK-v198-STATUS-READ-ONLY.sql`. Expect `v198_printable_stock_function_exists = true`, `v198_printable_checkout_trigger_enabled = true`, and `cancellation_restock_trigger_enabled = true`.
5. **Version compatibility fix in this package:** The stock trigger checks inventory only for **Ready Stock Printable Items**; **Corporate Tee Shirt** orders still pass the existing printable-order checkout without requiring `sportswear_sizes` stock data. If an order already had a `stockDeducted` marker, cancellation/reactivation can still adjust that previously tracked stock.

### D. Deploy the COMPLETE website to existing Cloudflare Pages

1. Extract this ZIP. The website root is the **inside of `One-Line-main/`**. Upload that folder's **contents** into the **root of the existing GitHub repository** already connected to the existing Cloudflare Pages project. `index.html`, `functions/`, `_routes.json`, `js/`, `css/`, and `supabase/` must have their original relative paths.
2. Keep the existing Cloudflare Pages project and deployment settings. No new domain or server is needed. Git-connected Pages automatically builds the Pages Functions inside `functions/`.
3. If your site uses **Direct Upload / dashboard drag-drop** instead of Git, that route does NOT compile `functions/`. Use Wrangler from `One-Line-main` (`npx wrangler pages deploy . --project-name YOUR_EXISTING_PROJECT`) or Git integration to keep the v199 caching routes. Don't assume an HTML-only upload enables them.
4. Open `https://onelinesmart.com/api/public-catalogue?table=custom_catalog_items&page=0`. It must return a **JSON array**, not HTML or 404. Check `https://onelinesmart.com/media/custom-catalog/card-images/<KNOWN-IMAGE-FILENAME>` serves a real image (or use browser Network tab to inspect `/media/` requests). If the cache routes fail, the storefront may fall back to direct Supabase; egress savings won't be as expected.
5. If there is an installed PWA, close/reopen or refresh it so the v199 service-worker version updates. Public Cloudflare catalogue cache can remain stale for approximately two minutes.

### E. TEST before accepting live orders (must do)

- Home, search, Custom Catalogue, Uniforms, Ready Made, item detail images and pricing, add to cart, and OTP login.
- Admin -> Ready Stock Printable Items -> each item -> Edit -> set **Available stock per size** (or **Unlimited**) -> Done. Legacy items with no stock key are treated as unlimited until explicitly configured; **new finite items may start at zero**.
- A customer order of 1 Ready Stock piece reduces that exact size's count by 1. A second order cannot buy stock beyond what remains. A cancellation restores exactly 1. Reactivating a cancelled order rechecks and deducts stock again. **Test Corporate Tee Shirt checkout as well** after this package's category guard.
- Test an order with a redeem code, printed vs unprinted options, admin order details, staff/management stock changes, and any order PDF flows you use.
- Prefer test items and test customers; reverse/cancel the test orders after checking, and check inventory totals.

## Changes and limitations

- v199 changes are as described in `DEPLOY-v199-FREE-SCALE.md` (pagination at 350 rows, public Cloudflare caching, media proxy, batch rendering). No new v199 SQL migration is required.
- v198 SQL is necessary **if not yet run**; it changes database functions and order triggers. This is a production migration, NOT a static file deployment. Backups do not eliminate the need to test it.
- SQL uses `CREATE OR REPLACE FUNCTION` / `DROP TRIGGER` on production objects. The exact current definitions are not available offline, so **schema compatibility with every existing customization has not been proven**, and no live write test was run. A precheck is not a substitute for a staged checkout test.
- You must keep your Supabase project, existing Storage assets, Edge Function environment secrets, and Cloudflare configuration. Do not create a new database or re-import the old backup over production.
- You may retain historical SQL files under `supabase/` for reference. **Do not run all migrations sequentially on an existing live site**. Especially do not run `v134-remove-b2b.sql` (destructive).

## Files to use NOW

**SQL to check installation**: `One-Line-main/supabase/CHECK-v198-STATUS-READ-ONLY.sql`  
**SQL to run once if absent**: `One-Line-main/supabase/v198-ready-stock-inventory.sql`  
**Website to deploy**: the contents of `One-Line-main/`  
**Live Supabase Edge Function**: verify `place-order` matches the included `supabase/functions/place-order/index.ts`.
