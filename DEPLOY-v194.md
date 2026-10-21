# One-Line v194 — Unified Header Search and Team Menu Restoration

## Updates from v193
- Header magnifier now opens an ordinary full-screen Search route (`#search`) rather than a modal/dialog.
- Search shows one input for active Custom Catalogue and Ready Made items combined. No catalogue selector, heading, introduction or popup.
- Searches item names, descriptions, item IDs, variant names, IDs and rates using the existing locally cached search index (no per-keystroke Supabase calls).
- Search result opens item details directly; the category's card page is inserted immediately before item details in history so browser/header Back returns to the proper cards first (and Back again to Search).
- Restored **Team Order** to Home > three-line (hamburger) drawer menu. **Orders** remains in bottom navigation; Team Order is not there.
- No changes to price computation, checkout, PDFs, admin pages, Supabase data, Edge Functions or image zoom behavior.

## Deployment
1. Deploy all files inside `One-Line-main` to Cloudflare Pages (preserve directory structure).
2. Hard refresh or reopen the installed PWA. `site.css`, `app.js` query versions and service worker cache version are `v194`.
3. Verify on deployment: open Search icon, search both item types, open a result and Back to correct category cards; from Home, open hamburger and choose Team Order.

No SQL migration and no Edge Function redeployment needed for this frontend-only update.

## Verification
- `node --check js/app.js` passed.
- Isolated tests passed for both catalogue search, variant/rate/ID matching and the category-before-item history entries.
- Full browser navigation in the local test environment was blocked by the environment policy; test actual navigation on deployed site.
