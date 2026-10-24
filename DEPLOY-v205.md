# One-Line v205 — Admin editor, image order, stock totals

Base: One-Line v204. This package retains the existing v198 / v202 / v204 SQL and deployed checkout function sources unchanged.

## What's changed

- The MEC7 item-adding/editor page uses the earlier compact framed variant-editing appearance. Existing workflows, fields, stock validation and save logic remain intact.
- Ready Made product images, Custom Catalogue default images, and each Uniform/custom-variant image strip have Up/Down controls and numbered positions (`1 / 3`, `2 / 3`, etc.). Reorder locally and then click **Save**. The first image becomes the first/default gallery photo when no separate card cover is configured. A separate card cover is unchanged by moving other images.
- Total stock is displayed in Ready Made listings, Custom Catalogue item listings, and item editor headers when those items track stock. Totals for Uniform variants include all stored variant sizes, even disabled variants. Unlimited entries are counted separately. Fabric-only and Jersey products without tracked inventory intentionally show no fake stock total.
- A small sticky preview of the existing card/default/first variant image is shown at the lower left **only on desktop screens** while editing an item. It is hidden on tablets and phones.
- Asset version bumped to v205 so changes are picked up without requiring a database reset.

## Deployment

1. Preserve your database backup and the image backup.
2. If v204 staff Ready Stock Mark as Sold SQL has not been installed, complete the v204 instructions first. **No new SQL migration is introduced in v205.**
3. Unzip, then commit the **contents of `One-Line-main`** to the existing GitHub repository (not an extra nested folder).
4. Let Cloudflare Pages deploy. Use a preview deployment to test before pushing to production if possible.
5. Hard refresh the Admin page if older CSS appears.

## Functional checks before treating this as fully released

- Edit a MEC7 item: variant names, sizes, prices, stock and image upload; Save and reload to check stored state.
- Edit an item in a different Custom Catalogue category: reorder three default images up/down; Save and reload to verify order.
- Edit a Uniform item: reorder separate variant images; Save, reload and confirm order and variant stock totals.
- Edit a Ready Made product with variant stock: confirm total stock equals the sum of variant stocks and image changes survive saving.
- Open on desktop: image preview at lower left. Open on phone/tablet: no fixed image panel blocking form controls.
- Complete a controlled live test order and cancellation to verify existing v198/v202/v204 inventory behavior (not testable from static ZIP alone).

## Safety

Reorder controls modify *only* existing image URL arrays; they do not call Storage delete/upload or change SQL. No live Supabase mutation was performed while packaging this ZIP. JS syntax and static regression checks passed; live authenticated flows still require verification.
