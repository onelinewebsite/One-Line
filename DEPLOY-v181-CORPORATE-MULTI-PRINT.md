# One-Line v181 — Corporate Tee Shirt multi-print restoration

This is based on v180, keeping the v178 security protections and v179 improvements. Only Corporate Tee Shirt printing and the related checkout/enquiry support have changed.

## Restored in Custom Catalogue → Corporate Tee Shirt
- Keep Fabric, Quality, original Sizes & quantity, inch measurements, and size-specific prices.
- Add the same Add printing toggle, multi-select Print Type cards, and separate Logo Size / Letter Size / Number Size quantities as Ready Stock Printable Items.
- Selected print types have a visible highlighted border and checkmark. Print quantities of one type remain intact while selecting another.
- Printing is optional when Add printing is turned off.
- Customer total includes garment rates and Admin-managed print rates.
- T-Shirt-mode Corporate enquiries save selected print types, sizes, quantities, and totals.
- Jersey-mode Corporate cart/checkout includes selected prints; prices are revalidated against the current Supabase print schedule on the server.
- The garment Type selector remains hidden only in Corporate Tee Shirt. Other categories are unchanged.

## Deployment
1. Deploy the full folder to Cloudflare Pages and refresh the installed PWA. The service worker cache is bumped to v181.
2. Redeploy `supabase/functions/place-order/index.ts` for secure Corporate Jersey-mode multi-print checkout.
3. If you have not already completed the v179 SQL and Edge Function setup, follow `DEPLOY-v179.md` first (it creates/updates the Admin print schedule used by both sections). **No new v181 SQL is required.**
4. Test a Corporate Tee Shirt item using Fabric + Quality, choose two print types, add sizes/quantities, and verify enquiry or checkout total. Test a Ready Stock Printable item to confirm it is unchanged.
