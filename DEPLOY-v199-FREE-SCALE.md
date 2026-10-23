# ONE-LINE v199 — Supabase Free scale optimization

> **For this final packaged ZIP:** Begin with `START-HERE-AFTER-BACKUP.md` and use the bundled `supabase/CHECK-v198-STATUS-READ-ONLY.sql` before running any migration.

This release keeps the existing One-Line design, OTP, checkout, admin, role access, order PDFs, stock functions, and v198 order/inventory SQL.

## What changed

- PostgreSQL/Supabase REST catalogue reads are **paginated at 350 rows** and no longer silently stop at 1,000 records.
- Cloudflare Pages `functions/api/public-catalogue.js` caches **anonymous, publicly readable** catalogue pages for two minutes. Admin and management keep authenticated, uncached direct database reads.
- Cloudflare Pages `functions/media/[[path]].js` caches **public product-images bucket images** for up to seven days at the edge. The frontend retries original image URLs if a proxy request fails. Other/private images are not proxied.
- `_routes.json` ensures Pages Functions run only for `/api/*` and `/media/*`, leaving all static pages and assets on the free static serving path.
- Customer product cards render in batches of 24; Admin Custom Catalogue cards in batches of 48. Search still matches loaded item IDs, descriptions, variant names and rates.
- Large catalogue records use an in-memory cache instead of hitting browser localStorage limits.
- Product-to-variant joining is linear-time rather than scanning the entire variants table once per product.
- Existing PWA script/cache versions refreshed; service worker deliberately skips dynamic API/media paths.

## Deploy to Cloudflare Pages

1. **Back up Supabase data and Storage first.** For Ready Stock inventory, complete the earlier `supabase/v198-ready-stock-inventory.sql` migration if you have not already run it. There is **no new v199 SQL migration**.
2. Upload the **contents** of `One-Line-main/` to the GitHub repository connected to your existing Cloudflare Pages project. Check that `functions/`, `_routes.json`, `index.html`, `js/`, `css/` are all at the Pages project root / selected root directory. Keep the project output root at the same directory as `index.html`.
3. Cloudflare Pages **Git integration** will compile `functions/` automatically. If using a **Direct Upload** project, you MUST deploy with **Wrangler** from the `One-Line-main` directory (e.g. `npx wrangler pages deploy . --project-name YOUR_PAGES_PROJECT`). Dashboard drag-and-drop does **not** compile a `functions` folder and loses the caching benefit.
4. When deployment finishes, open `https://YOUR-DOMAIN/api/public-catalogue?table=custom_catalog_items&page=0`. The response **must be a JSON array**, not an HTML page or 404. Wait ~2 minutes for recently changed product rows to refresh from the Cloudflare cache.
5. Visit Home, Ready Made, Custom Catalogue, one product details page, Admin/Management, Cart, Order Details and checkout. Check stock and pricing with real test orders, including two simultaneous purchases of the same last-stock item.
6. In browser developer tools -> Network, confirm public catalogue pages load from `/api/public-catalogue` and product-image thumbnails load from `/media/`. If either doesn't work, **do not assume Supabase egress is reduced**. The customer app falls back to original public reads/image URLs to remain functional.

## Important limits and tradeoffs

- Supabase Free is **not unlimited**: database 500 MB, file storage 1 GB and platform egress 5 GB (plus a cached-egress allowance). 5,000 products **can** fit in database rows, but 5,000 items with multiple images may exceed the file-storage quota. The v199 image proxy reduces repeated image transfers but **does not migrate or free up stored Supabase files**. Consider **Cloudflare R2** for future image migration (requires bucket, upload service, image migration and access controls).
- Cloudflare Workers Free currently provides **100,000 Functions requests/day**; the two caching routes count toward that limit. Other static Pages requests remain free and unlimited because of `_routes.json`.
- Cloudflare cache propagation is not instantaneous. Available stock and final rate are **authoritative only after server-side checkout validation**; catalogue views can be approximately two minutes stale.
- 500 registered customers are not the same as 500 concurrent OTP sign-ins. OTP throughput depends on your MSG91 account and its limits, not only Supabase.
- This source-level optimisation is **not** a real 50-concurrent-user capacity test or proof of scalability. Test live p95 load times, errors, Supabase egress, rate limits, checkout races and Storage size before a high-traffic launch.
- Keep authenticated customer/order/cart APIs off all public cache paths. Do not add service-role/secret credentials to any Pages Function or browser script.

## Local checks in this release

- >5,000-item and 5,000+ variant pagination and admin path: passed in mocked Node test.
- Proxy request allowlist, edge cache hits and media path validation: passed in mocked Node tests.
- JavaScript syntax: passed.
- Actual cloud deployment, browser navigation, transaction concurrency and rate/egress measurement: **not verified** in the current environment.
