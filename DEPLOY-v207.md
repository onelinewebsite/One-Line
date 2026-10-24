# One-Line v207 — Classic Two-Column Item Editors

## What changed
- General Custom Catalogue variant cards, including MEC7, Shoppee, Pre School Uniforms and other uniform/catalogue-mode items, appear **two per row on desktop**. Each variant uses the older compact **Size, Stock, Unlimited, Width, Length, Final rate, ×** inline layout.
- Ready Made product variant cards use a matching two-column desktop arrangement while retaining the existing Ready Made fields (option, quantity, price, barcode, image, availability).
- Tablet/phone screens use one card per row; variant size rows can scroll within their card when needed.
- **Unchanged:** Corporate Tee Shirt, Ready Stock Printable Items and Full Sublimation Jerseys editors; pricing calculations, stock functions, staff permissions, uploads, database schema, and checkout.

## Deploy
1. Preserve a backup of the currently deployed website and Supabase data.
2. Extract the ZIP and push the contents of `One-Line-main` to the existing GitHub repository root.
3. Allow Cloudflare Pages to deploy; verify in a preview deployment first if possible.
4. Hard-refresh the admin page and check two variants side by side on a desktop. Check one-card layout on mobile.
5. Open a saved MEC7/Shoppee/Pre School Uniform item and confirm the existing size rows and stock values are unchanged. Edit a noncritical field and save, then reopen to confirm persistence.
6. Check Ready Made variant edits, and verify the three excluded editors remain unchanged.

No new SQL is needed specifically for v207. Earlier migrations still must be installed for stock operations introduced in v198/v202/v204.

This patch was checked locally for JavaScript syntax and its CSS selector targets, but was not tested against live authenticated Supabase data.
