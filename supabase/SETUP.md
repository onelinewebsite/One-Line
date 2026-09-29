# One-Line v55 — Supabase setup

This build keeps customer profile, cart and order history on Supabase. Device storage is used only for the login/session token, catalogue/settings snapshots and unfinished designer drafts.

## Existing current live project
If the current v54 website/database is already working, do **not** recreate the database.

1. Supabase → SQL Editor → New query.
2. Open the root file `RUN-NEXT-v55.sql` and run it once.
3. Deploy the updated website files.
4. No Edge Function redeploy is required only for this pricing update; `RUN-NEXT-v55.sql` updates the server-side order-pricing RPC used by the existing `place-order` function.

The v55 migration adds live customizer pricing settings, T-Shirt/Polo base rates, cloth additions, bulk tiers, print-size pricing and server-side custom-design totals.

## Fresh project
Run the complete `supabase/schema.sql`, set the existing `MSG91_AUTH_KEY` Edge Function secret, then deploy:

```bash
supabase functions deploy otp-session --no-verify-jwt
supabase functions deploy customer-event --no-verify-jwt
supabase functions deploy customer-account --no-verify-jwt
supabase functions deploy place-order --no-verify-jwt
supabase functions deploy admin-user
```

A fresh full-schema install already contains the v55 customizer pricing columns and server-side pricing function, so `RUN-NEXT-v55.sql` is only for an existing database.

## Portal roles
- **Admin:** full catalogue, Custom Catalogue, B2B, categories, enquiries, subitems, accounts and customizer pricing settings.
- **Management:** add/edit Ready Made products, categories, Custom Catalogue items, B2B items and reusable Subitems. It cannot change customizer pricing or manage accounts.
- **Staff:** stock/sold desk only.
- **Order Receiving:** orders and order status only.

## Customizer pricing
Admin → Settings → **Customizer Pricing** controls:
- T-Shirt and Polo base rates.
- Standard and Premium cloth additions. Budget always equals the selected garment base rate.
- Quantity-tier starting points and per-piece discounts.
- Large-print threshold percentage.
- Small/large charges for DTF, Screen Print, Embroidery and Sublimation.

The customer designer calculates these prices immediately, and the database recalculates custom-design pricing again when the order is placed.
