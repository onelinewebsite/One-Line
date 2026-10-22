# OneLine v198 — Performance and Supabase usage optimization

This ZIP is intended as a replacement of the previous One-Line-main GitHub site files. **No Supabase tables, records, policies, or credentials were removed.** There is no database migration or Edge Function change in this update.

## Implemented changes

1. **Public catalogue session cache (120 seconds):** a recent public storefront catalogue response can be reused after a page reload within the same browser tab. In-flight requests are also deduplicated. Force refresh, including the post-checkout refresh, still fetches live Supabase data. Staff, management, and admin portals never use this public snapshot. Session storage has a quota; if it is full the app falls back to ordinary Supabase requests.
2. **Avoid redundant admin catalogue downloads:** the automatic background refresh on dashboard/orders/activity/enquiries now fetches the live order/enquiry feed without also re-downloading all catalogue tables. Inventory screens, initial portal load and manual refresh continue to fetch catalogue data. Background reloads don't repeat the redeem-code and staff-profile tables when unnecessary.
3. **Reduced variant payload:** fetch only the fields consumed by the existing product mapper from `product_variants`, rather than `select('*')`.
4. **Faster product mapping:** index variants and subcategories by their parent IDs instead of scanning full arrays for every product/category.
5. **Smaller new catalogue uploads:** supported admin product/catalogue images are optionally converted to WebP at up to 1200 px and quality 82 if the conversion is smaller than the original. Customer-submitted artwork is untouched; existing stored files are unchanged.
6. **Batch deletion of old catalogue images:** paths hosted in the OneLine Supabase Storage bucket are removed up to 100 per request rather than one API request per image. External URLs remain untouched.
7. **Smaller static images:** the bulk-enquiry banner changed from PNG (~572 KB) to WebP (~24 KB), and the seeded sportswear JPEG was recompressed in-place (~482 KB -> ~156 KB). Its filename is unchanged because seed records may refer to it.
8. **Lightweight install caching:** service worker v198 no longer pre-downloads unrelated admin HTML and media on every customer PWA install. Current customer scripts, CSS and essentials are pre-cached. It caches versioned static files and local images, **never** Supabase API, account/order data, auth responses, or other origins. HTML stays network-first.
9. **Versioned CSS/JS assets:** customer, admin, management, staff and 404 pages point to `?v=198`. Cloudflare Pages `_headers` allows 24-hour browser caching for CSS/JS; change query versions again when deploying later edits.
10. **Removed 31 unneeded source artefacts:** obsolete `.pre117` and `.bakv116` JavaScript/CSS backups, old deployment notes (kept latest v197 and the security note), identical root-level SQL duplication (canonical migration kept in `supabase/`), and an exact duplicate unused logo. **All SQL migrations in `supabase/`, public pages, working application scripts, and Edge Functions remain included.**

## Deployment

1. Back up the current site/repository first.
2. Extract this ZIP and upload/commit the contents of `One-Line-main/` to your GitHub project **at its existing project root**. Keep the same Cloudflare Pages build settings.
3. Let Cloudflare Pages deploy. Check new CSS/JS and service worker `v198` in the browser. Reload the PWA once if the old version is still displayed.
4. Verify customer sign-in/OTP, home catalogue, filters, item details, custom pricing, image rendering, Add to Cart, checkout and orders. Verify admin/management/staff inventory, order feed and image add/delete.
5. Compare Supabase Usage/Observability and Logs for several days under similar traffic. **A reduction cannot be guaranteed without inspecting actual live API and log sources.** These edits cannot erase usage already billed or logged in the current cycle.

## Notes on remaining usage

- Supabase's Log Ingestion includes service/platform request logs; reducing `console.log` alone cannot fix it. This ZIP leaves critical error/security logging intact.
- Catalogue image compression affects **new** media uploads; existing Supabase Storage objects need separate migration/re-upload if they are oversized.
- Initial visits and admin inventory views still read catalogue data. Full server-side pagination, image-CDN migration, and a public catalogue read API would require schema/API changes and testing against the live project before safely deploying. These were deliberately not changed to protect the existing UI and order flows.
- Large shared caches may serve a slightly older catalogue for up to two minutes. **Final order validation is still server-side**; post-checkout refresh forces fresh catalogue data. Custom garment pricing still has its existing live verification before customer submission.

## Checks executed on this bundle

- `node --check` succeeded for all shipped JavaScript and Cloudflare share worker scripts.
- Automated mocked Supabase checks passed for category/product mapping, 120-second public response reuse after reload, force refresh, private portal bypass, and the smaller variant query.
- Inspected removed-file references in customer/admin/site scripts and HTML.
- Not tested against actual production Supabase credentials/data or with a real browser checkout session.
