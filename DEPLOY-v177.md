# One-Line v177 — Back navigation and safe cleanup

## Deployment
1. Replace your v176 GitHub site files with the full v177 package, including `functions/`, CSS/JS assets, and `sw.js`.
2. Wait for the Cloudflare Pages build to finish. Refresh each portal or reopen the installed PWA.
3. No new Supabase SQL, Edge Function deployment, or Cloudflare secret is required by v177.

## Changes
- Admin, Management, and Staff now keep browser-screen history: Back goes to the previous portal section, item editor, category, or account screen; Back at the portal home does not exit the PWA.
- Existing in-page category and item Back buttons use the same screen history.
- JPEG item/category shares skip unnecessary canvas decoding and JPEG re-encoding (PNG/WebP behavior is retained).
- Removed a redundant customer share-click check and an unused URL helper.
- Staff and Management no longer download the unused order PDF helper JavaScript.
- Bumped portal JavaScript and service-worker cache versions for reliable deployments.

## Test scope
- Local headless Chromium with mocked portal accounts and catalogue data: Admin, Management, Staff, Settings → Back, category → Back, portal root Back.
- All JavaScript syntax checks and service worker asset-reference checks.
- Live Supabase save/delete/order/PDF operations, actual WhatsApp native sharing, and installed mobile PWA navigation were not run against production.

## Findings to review
- Admin → Accounts has a default-access/reset section with predictable account credentials written into public-deployed `js/admin.js`. Do not leave those passwords active in production; rotate them and remove the default reset mechanism in a separate access-control update.
- Image sharing a PNG/WebP photo may still require a one-time image fetch and JPEG preparation before the phone share sheet opens. First-share latency therefore depends on network speed; this build does not add extra uploads or Supabase storage.
- Some order PDF generation relies on external `jsPDF`; offline or blocked CDN access can affect those features. Production orders, saves and PDFs have not been verified end to end.
