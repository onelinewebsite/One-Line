# One-Line v167 – Optional Print Selection

## Deploy

1. Keep your existing Supabase tables and SQL. No migration is required.
2. **Important:** Redeploy `supabase/functions/place-order/index.ts` from this package. It permits secure garment-only orders with an explicit `includePrinting: false` and still validates price/size and printed orders.
3. Deploy the complete website and refresh installed PWA/cache.

## Behavior

In **Custom Catalogue → Ready Stock Printable Items**, Add printing is on by default. Unticking hides print type and print sizes; customer can order by choosing Fabric → Quality → Garment size/quantity. All existing print choices are cleared when the toggle changes. Re-enable printing to choose one type and print sizes. Prints add no charges when off.

Check both Add to Cart and Buy Now with printing on/off against live Supabase before accepting orders.
