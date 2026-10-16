# One-Line v164 — Printable fabrics + redeem codes

Updates v163. Keeps Jersey garment-style selection unchanged.

## Deploy

1. Back up your Supabase database.
2. Run `supabase/v164-redeem-codes.sql` in Supabase SQL Editor **as one complete query**, assuming earlier required v159 schema migrations are already installed. It creates redeem-code tables and an atomic discount order wrapper; it does NOT replace existing order or stock logic.
3. Supabase Dashboard → Edge Functions → `place-order` → deploy the complete `supabase/functions/place-order/index.ts` file supplied here. Both code-validation previews and discounted checkout require this redeployment.
4. Deploy all website files to Cloudflare Pages and reload the customer/Admin PWAs.
5. Admin → Settings → Redeem codes: create/modify codes and their fixed discount. `ONE03X001` is inserted as a **live ₹50** starter code if it does not already exist; deactivate it if not wanted.

## Customer checkout

Ready Stock Printable Items: Fabric → Quality → Print type and quantities → Garment sizes and quantities → Add to Cart / Buy Now. Garment style/type is not required. Only Jersey has Round Neck, V Neck, Polo, etc.

Checkout → Delivery & payment → Redeem code → Apply; applies fixed discount to order subtotal. Server rechecks code, minimum order, expiry, usage limits, and per-customer limit when placing the order, in a single SQL transaction with the existing stock-safe order function. Applied code and discount are saved to order metadata and included in order PDF.

## Verification checklist

- Admin: create sample code, edit amount, deactivate and reactivate.
- Customer: fabric selection works without garment type, prices reflect Admin; submit printable orders to Cart and Buy Now.
- Customer: apply `ONE03X001`, verify ₹50 deducted; submit paid COD order.
- Admin: verify order total and discount; customer: download order PDF.
- Try expired/disabled/reused code; it should be rejected.

**Production order placement and Supabase migrations have not been executed from this environment.**
