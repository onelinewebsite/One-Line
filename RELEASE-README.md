# One-Line v51 — Stable refresh, fixed header, Edit/Done workflow

This build keeps the stable v50/v48 customer interaction model and focuses on reliability, server cleanup and simpler portal editing.

## Customer site
- Removed the repeated refresh transition/fade and reduced unnecessary second renders after Supabase hydration.
- The shared site header is persistent on every customer screen.
- Home keeps the menu button. Every other customer screen uses a simple Back icon in the header and no menu button in that position.
- Browser Back/history still returns to the actual previous One-Line screen; direct/shared links use a logical fallback.
- Existing in-page Back buttons are hidden when the shared header is present.

## Admin / Management
- Existing Ready Made products, Custom Catalogue items, B2B items, categories, subitems and Admin-managed portal accounts are locked by default.
- Tap the pencil Edit icon for one section, change it, then tap Done. That section is written to Supabase immediately.
- New records still use a single Create action because a server row must exist before section-by-section editing can begin.
- Management can add/edit catalogue structure, Ready Made products, Custom Catalogue, B2B and subitems. Destructive category/product deletion remains Admin-only where intended.

## Supabase image cleanup
- Removing an owned uploaded image with its close/remove control first removes the database reference, then deletes the corresponding file from the `product-images` Supabase Storage bucket.
- Product, Custom Catalogue and category deletion also cleans up their owned image files where applicable.

## Staff / Receiver
- Staff remains limited to searching exact products/variants/subitems and marking a sold quantity. Server RPC rules reject positive Staff stock changes.
- Order Receiving loads only order data instead of hydrating the whole catalogue, reducing unnecessary refresh work.

## Existing installation
After deploying v51, run `RUN-NEXT-v51.sql` once in Supabase SQL Editor. It aligns Ready Made category/subcategory Management permissions and confirms Admin/Management Storage delete permission.

No Edge Function redeploy is required for this v51 update.
