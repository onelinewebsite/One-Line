# One-Line v186 — targeted update

Base: v185. Keep existing v178 security protections, v179–v185 SQL migrations and checkout Edge Function.

## Changes
- Print-method info (?) SVG is smaller and is overlaid inside each print-selection card; the print card remains independently selectable.
- All print method “More” links open **one** page: `print-guide.html#dtf`, `#embroidery`, `#sublimation`, `#screen-print` or `#other-print` for custom/unrecognized types. Browser native hash scrolling targets the exact section; all methods remain visible.
- Print guide uses real photographic references linked from Wikimedia Commons, with appropriate credit and CC BY-SA 4.0 notices. **These are illustrative photographs, not verified One-Line manufacturing samples.** Photos are hosted externally and require internet; no Supabase Storage egress is used for these images.
- Custom Catalogue → Ready Stock Printable Items has a **required item-specific garment base rate** in the item editor, plus its existing optional per-size rate overrides. Listing price now uses the actual item rate rather than a global fabric rate. Server validation already uses each saved item's rate.
- Admin header **Customers** is renamed **Users**. The directory shows all user accounts plus saved and previously ordered delivery addresses under each user. Fetching is paginated and on-demand; an explicit Refresh button reloads it. Periodic background catalogue polling is disabled while in Users to reduce Supabase requests.
- Customer PDF download/share uses the One-Line logo, bigger A4 sections, more readable order specifications, delivery/remarks, line prices and up to eight linked images for each ordered item. Order images are loaded directly from the URLs already saved with the order; they are compressed within PDF and do not cause extra database queries. If an image URL is missing, expired, or blocked by CORS, the PDF labels the image as unavailable instead of failing the entire document. Existing admin 4×6-inch shipping label stays unchanged.

## Deploy
1. Upload the full ZIP contents from `One-Line-main/` to the website host (Cloudflare Pages/GitHub build).
2. Let the new `sw.js` cache version `one-line-catalogue-v186` activate; hard refresh the installed PWA if old cached files persist.
3. In Admin, check that every Ready Stock Printable Item has its own garment base rate, and optional overrides by size.
4. Verify a saved-address user and a past order address appear under Admin → Users, and test printing and PDF download/share on a real order.

## No new database migration or Edge Function deployment
There are no schema changes and this update does not touch the checkout Edge Function. Existing v185 migrations and production functions must already be installed.

## Verification scope
Static JavaScript syntax, guide anchor, per-item rate, Users listing and simulated PDF tests were run locally. Live Supabase permissions, image cross-origin loading, photo CDN access and real-device PDF sharing cannot be tested without the live deployment and real accounts. Do not treat static tests as proof of successful production checkout.
