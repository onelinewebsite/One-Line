# One-Line v202 — START HERE AFTER BACKUP

Project: **One-Line / onelinesmart.com**, Supabase project **onelinewebsite**. This is **not SHOPIZO**.

Your **v198** stock migration and checkout/cancellation triggers were verified previously. **DO NOT run v198 SQL again.** The v202 release **does** add a new, separate, permission-checked staff stock-receiving RPC.

1. Check that your current One-Line database and images are backed up; keep a recent second copy.
2. In One-Line Supabase SQL Editor, paste/run **`supabase/v202-staff-add-stock.sql`** as a whole. Never run schema.sql or previous migrations again.
3. Paste/run **`supabase/CHECK-v202-STAFF-STOCK-READ-ONLY.sql`** to check the new function, audit table, RPC access and existing v198 function: all `true`.
4. Upload the **contents** of this `One-Line-main` folder to the root of the existing One-Line GitHub repo; Cloudflare Pages deploys from it. Ensure `functions/share/[[path]].js` and `_routes.json` are included.
5. Test the `/share/` social preview, Ready Stock X button at different widths, and staff **Add Stock** +1 on an item with finite inventory. Then test real checkout and cancellation on controlled stock.

Read **`DEPLOY-v202.md`** for verification details and limitations. No new hosting setup, Supabase project, or Edge Function replacement is needed just for this release.
