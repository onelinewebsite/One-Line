# One-Line v180 — Corporate Tee Shirt controls restored

Deploy the full project folder to the existing Cloudflare Pages site.

## Restored only in Custom Catalogue → Corporate Tee Shirt
- Fabric and Quality selection plus selected rate remain available.
- Garment Sizes & quantity controls are restored; customers can choose multiple sizes and see the computed total. Measurements appear in inches.
- Admin item editor includes editable sizes, inch length/width and optional per-size final rate. Values continue to be stored in the existing centimeter-backed keys for database compatibility.
- Enquiry saves size quantities, per-size pricing and total; zero-quantity enquiries are not sent.
- The garment **Type** selector is not shown for Corporate Tee Shirt.
- If the category's explicit editor mode is `jersey`, existing sportswear pricing/options and its existing checkout behavior are preserved; Type remains an implicit stored selection for server-side pricing checks and does not appear as a customer selector. Existing other Jersey categories retain Type selection.
- Existing standard T-shirt categories, Ready Made items, Full Sublimation Jerseys and the v179 multi-print selector are unchanged.

## Deployment
1. Upload/deploy the full project directory to your existing Cloudflare Pages deployment.
2. No new SQL migration or Edge Function change is needed for **v180** itself. If you have not deployed the earlier v179 SQL and `place-order` Edge Function, follow `DEPLOY-v179.md` to enable the previously requested v179 multi-print changes.
3. Check a Corporate Tee Shirt item as both admin and customer: select fabric and quality; set sizes, length/width and rates; save, refresh, and verify quantity/total/enquiry. Check that no Type picker appears.
4. Confirm that other catalogue and Ready Made categories still work as before.

Retains the v178 security hardening and all v179 changes. Historic backups and obsolete deployment note files were already removed in v179 and remain absent.
