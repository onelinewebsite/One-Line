# One-Line v146 — Customer fabric/type synchronization

## What changed
- **T-Shirt item pages** show all `active=true` fabrics and valid qualities read from `custom_catalog_fabrics` in Supabase. Polycotton has no Budget choice when its `budget_rate` is NULL. Prices update from the Admin database, not static item snapshots.
- **Full Sublimation Jerseys / Sportswear** shows all visible `custom_sportswear_types` (Round Neck, V Neck, Polo, Semi Collar, additional custom types) and all visible `custom_sportswear_fabrics`. Price = fabric's quality-specific Round Neck base rate + selected type adjustment.
- Older item-level arrays that accidentally froze fabric/type lists **no longer hide newly added Admin options**. New and legacy items default to the *live global Admin options*.
- Admin item editors have a **Limit options for this item** switch for genuine per-design exceptions. Turn it on to restrict types/fabrics/qualities; use **Save fabric / style options**. When this is off, future admin additions are shown automatically without resaving items. Newly saved exceptions are explicit, not accidental.
- Customer rendering re-reads T-Shirt and Sportswear lists from the refreshed local data cache and correctly detects fresh Sportswear lists after Supabase loads. PWA version bumped.
- Uniform and Normal Custom Catalogue variant/stock/cart editors are unchanged.

## Deploy
1. Backup Supabase before making database changes.
2. If not already run, run `supabase/v144-restore-catalogue-types.sql` to establish the four distinct item editors.
3. Run `supabase/v146-public-fabric-pricing.sql` to ensure anonymous customers can read visible Admin-managed fabrics/types. This changes public SELECT policies but not data/prices; hidden options are still excluded from public results.
4. Deploy all files in this folder to the existing site.
5. Refresh the customer T-Shirt and Full Sublimation Jerseys item links (update/install new PWA version if needed).

All specific fabric amounts are read directly from existing Supabase admin rows. This package does not overwrite those prices or hardcode the supplied amounts. Verify RLS permissions with an incognito customer session. The change is source-tested locally but needs a live Supabase smoke test after deployment.
