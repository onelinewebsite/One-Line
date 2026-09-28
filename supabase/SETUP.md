# One-Line v43 — Supabase setup

This build keeps customer profile, cart and order history on Supabase. Device storage is used only for the login/session token, static/catalogue cache and unfinished designer drafts.

## Existing live project
If the v41 server-account sync is already working, do **not** recreate the database.

1. Supabase → SQL Editor → New query.
2. Run the root file `RUN-NEXT-v43.sql` once.
3. No OTP/customer Edge Function change is required only for the v43 role/UI update.
4. Keep the currently deployed `otp-session`, `customer-event`, `customer-account`, `place-order`, and `admin-user` functions.

If this database never received the v41 server-account sync, run `supabase/migrations/v41_server_account_sync.sql` first, then run `RUN-NEXT-v43.sql`.

## Fresh project
Run the complete `supabase/schema.sql`, set the existing `MSG91_AUTH_KEY` Edge Function secret, then deploy:

```bash
supabase functions deploy otp-session --no-verify-jwt
supabase functions deploy customer-event --no-verify-jwt
supabase functions deploy customer-account --no-verify-jwt
supabase functions deploy place-order --no-verify-jwt
supabase functions deploy admin-user
```

## v43 portal roles
- **Admin:** full catalogue, categories/subcategories, reusable subitems, stock, orders, customers/activity/carts, and staff account control.
- **Management:** add and edit products only. It can upload product images and edit product variants/linked subitems, but cannot manage categories, reusable subitems, stock, customers, orders, or accounts.
- **Staff:** stock sales desk only. Search by name/code/barcode/category/colour/size, choose the exact variant, enter quantity, and mark it sold. Staff cannot add stock.
- **Order Receiving:** read orders and update order status only.

## Server-authoritative customer data
- Customer name, business/institution and post/role.
- Cart items, quantities, piece count and total.
- Order history and order status.
- One phone number stays connected to the same customer record on every device.
- Multiple active devices can use the same customer account.

## Device cache
Static website/PWA files, catalogue/settings snapshots for fast loading, unfinished customizer drafts, and the login session token may use device storage. Cart/order/profile data remain server-authoritative.
