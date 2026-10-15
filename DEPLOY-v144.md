# One-Line website v145 – restore separate catalogue editors

## Deploy
1. **Before replacing the live website:** take a Supabase database backup / export of custom_catalog_categories and custom_catalog_items.
2. Run `supabase/v144-restore-catalogue-types.sql` in your project's **Supabase SQL Editor**. This adds the category-level editor selector and marks existing T-Shirt, Sportswear/Jersey, and Uniform category names. It does not delete old data.
3. Deploy the full contents of this folder to the existing site, replacing previous files. No Supabase Edge Function change is needed for this fix.
4. Hard-refresh admin and customer pages if an older version is cached.

## Four different item flows
- **Normal Custom Catalogue**: create any number of named variants, sizes, stock/unlimited flag, optional MRP/Final Rate, individual images, cart/checkout.
- **T-Shirt category**: use original T-Shirt fabric editor. Fabric pricing is configured in Admin → Custom Options → T Shirts, with Premium, Standard and Budget (where available). Customer selects fabric then quality and submits an enquiry.
- **Full Sublimation Jerseys**: use original Sportswear/Jersey editor. Configure Round Neck, V Neck, Polo, Semi Collar and additional types, type adjustments, fabrics and three quality rates in Admin → Custom Options → Sportswear. Customer selects garment style → fabric → quality, sees the calculated rate, and submits an enquiry.
- **Uniform**: dedicated variant editor with images, sizes, quantities, stock, optional size rate and unlimited stock; customer adds variants to cart or orders directly.

Each category can explicitly choose its item editor in Admin → Categories → Edit, or in Custom Catalogue → edit category. Changing the mode affects how items are presented/edited; it does **not** automatically rewrite stored item options. For T-Shirt/Jersey items accidentally saved as uniform variants, the original shared live fabrics and qualities become available again; item-specific fabric restrictions that were overwritten by a previous version cannot be reconstructed without a backup. Save each such item in its restored editor to persist its fabric/quality choices.

The browser also recognizes legacy category names if the migration has not run yet, but new category creation / mode editing in Admin requires the SQL migration.
