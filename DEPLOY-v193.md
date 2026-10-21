# One-Line v193 — Limited UI and order quotation update

Based on v192. Only requested catalogue text, navigation/header search, and admin order-quotation sharing features have been updated.

## Customer website
- Smaller heading and shorter description on Custom Catalogue and Ready Made root pages.
- Bottom navigation: Orders replaces Team. The existing team-order workflow still exists via the footer / related site entry points; its logic was not removed.
- Header magnifier SVG sits immediately left of the cart. It opens a searchable panel with two tabs, Custom Catalogue and Ready Made.
- Search uses the existing cached item index for names, prices, descriptions, IDs and variants (no new requests per keystroke). Tabs can be switched, Enter/search by typing, and search can be closed by X, Escape, backdrop or browser Back.
- Existing search bars on individual catalogue pages are unchanged.

## Admin
- Order Details → **Share Quotation** generates the exact same A4, image-free One-Line customer PDF using `OneLineCustomerPdf`, including saved order details.
- Supported browsers open the system file-sharing sheet; other browsers download the PDF so it can be attached manually.
- Existing **PDF** and **Share PDF** continue to generate/share the shipping label. No order data is changed by sharing.

## Deployment
1. Deploy the new `One-Line-main` site to Cloudflare Pages (and other static hosts if in use).
2. Refresh/reinstall the PWA if an old cached interface persists.
3. Verify on a device: header search tabs, bottom Orders navigation, admin Order Details → Share Quotation (including WhatsApp share if supported).

No new SQL migration or Edge Function deployment is needed. Static/syntax and focused script tests passed; full live browser/Supabase tests could not be completed in this environment.
