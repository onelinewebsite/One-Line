# One-Line v202 — sharing previews, Ready Stock remove control and staff stock receiving

This package is based on the existing production v201 website, with all prior catalogue, checkout, pricing, orders and v198 stock functionality retained. **One-Line (`onelinewebsite`), not SHOPIZO.**

## Required deployment sequence

1. **Back up current production database** and keep the existing Storage backup. The Oct 23 database dump predates some later SQL changes. Copy backups to a second safe location. Do not restore old backups over your live database.
2. **In the existing `onelinewebsite` Supabase project only**, open SQL Editor. Run `supabase/v202-staff-add-stock.sql` as a single complete query. This is a new additive staff-receiving migration. **Do not rerun v198, `schema.sql`, or old historical SQL files.** If SQL reports an error, stop before deploying v202.
3. Run `supabase/CHECK-v202-STAFF-STOCK-READ-ONLY.sql`. The function, audit table, authenticated RPC execute permission and existing v198 function must all show `true`.
4. Deploy the **contents** of `One-Line-main/` into the existing GitHub repository root. Cloudflare Pages must continue using **Git integration / Wrangler deployment capable of building Pages Functions**, not static-only drag/drop. Keep existing Supabase keys, Pages settings, and Edge Functions unchanged.
5. Confirm your Cloudflare Pages deployment is successful, then verify `/share/product/<REAL_PRODUCT_UUID>?v=202` renders Open Graph metadata in the **page HTML response**, and `/share/image/product/<REAL_PRODUCT_UUID>?social=1` returns an image. The new `_routes.json` includes `/share/*`, which had been missing. Links to generic pages use the existing white-background 1200×1200 square logo. Product/item/category links try an actual existing photo first and fall back to the logo; no duplicate images are uploaded to Storage.
6. On **staff.html**, sign in as a staff account, search a known product/variant or Ready Stock/Uniform size, and check **Add Stock**, quantity, + and **Add to stock**. Start with an intentionally small, tracked test item and +1, reload to confirm stock increased by exactly 1. Try adding to an out-of-stock item (0 → 1). Test that unlimited sizes cannot be adjusted. Do not test stock increases on a live sellable item without tracking/reversing them appropriately.
7. Test an actual controlled order for each relevant item type and verify stock deduction and cancellation restocking still work. Check admin product/size editing, upload, Ready Made prices, mobile and desktop layouts, and WhatsApp link previews; previews may be cached by messaging platforms and WebP rendering depends on the platform.

## What changed

- **Social sharing:** `/share/*` is now routed through Pages Functions. Existing 1:1 white logo remains the default. Share pages use existing public product images when possible; JPEG/PNG candidates have priority for crawlers, then WebP rather than unrelated logo. Caches are short. When a phone supports file sharing, the existing 1:1 JPEG share path remains in place.
- **Admin Ready Stock:** delete size is a compact **red ×** button at the top-right of each size row, never below the form. Responsive CSS for mobile/tablet/desktop. Existing Add Size/Remove event handlers unchanged.
- **Staff:** stock search stays search-only; prominent **Add Stock** at top focuses search. Each tracked result shows current stock, quantity input (default 1), a +1 increment button, and **Add to stock**. Zero-stock sizes can be replenished; unlimited-stock options are not adjusted.
- **Database:** `staff_add_stock` is a new role-checked, atomic positive-only RPC for simple products, product variants, tracked uniform sizes and tracked Ready Stock Printable sizes. It also logs additions to `staff_stock_additions`; product additions are additionally logged to `stock_movements`. Existing stock deductions and checkout SQL are unchanged.

## Safety and limitations

- **SQL is required for new staff Add Stock** and is **not** deployed by GitHub/Cloudflare. If v202 isn't installed, the staff action will show a database error and will not adjust stock. Never enable anonymous stock edits or paste `service_role` keys into frontend code.
- The new RPC is restricted to signed-in **active staff/admin** via `public.has_role`. Admin stock desk UI and old `adjust_stock`, `adjust_product_stock`, `mark_custom_variant_sold`, and v198 order/cancellation functions are unchanged.
- All SQL executes transactionally. No rows are intentionally deleted. The migration adds a table and replaces only its newly named function; it does not reset inventory.
- Cloudflare share handlers incur Function invocations and fetch an actual image from its origin on cache miss. The product image can be larger than the logo; bandwidth consumption is **not necessarily identical**. Cached requests reduce origin egress. External social apps may cache previews.
- Local JS syntax, share-handler mock tests, structural stock tests, and responsive screenshots passed. **Live authenticated stock write, live checkout/cancellation and link-preview tests were not executed**, so verify using a test item before trusting production.
- To revert the interface, roll back the website Git commit. Leave the additive SQL in place unless a database administrator reviews its audit/use; do not revert the entire database from the old snapshot.
