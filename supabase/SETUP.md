# One-Line v46 — Supabase setup

This build keeps customer profile, cart and order history on Supabase. Device storage is used only for the login/session token, static/catalogue cache and unfinished designer drafts.

## Existing current live project
If the v43/v44 build is already working, do **not** recreate the database.

1. Supabase → SQL Editor → New query.
2. Run the root file `RUN-NEXT-v47.sql` once.
3. No new Edge Function is required for v46. Keep the currently deployed `otp-session`, `customer-event`, `customer-account`, `place-order`, and `admin-user` functions.

This v46 bundle is intended for the current v45 database. For a much older database, use the full `supabase/schema.sql` on a fresh project or reconcile the older migrations before applying v46. If it never received the v41 server-account sync, `supabase/migrations/v41_server_account_sync.sql` remains available as a reference migration.

## Fresh project
Run the complete `supabase/schema.sql`, set the existing `MSG91_AUTH_KEY` Edge Function secret, then deploy:

```bash
supabase functions deploy otp-session --no-verify-jwt
supabase functions deploy customer-event --no-verify-jwt
supabase functions deploy customer-account --no-verify-jwt
supabase functions deploy place-order --no-verify-jwt
supabase functions deploy admin-user
```

A fresh full-schema install already contains the Customization Catalogue tables and policies, so incremental `RUN-NEXT-*.sql` files are not needed immediately afterward.

## Portal roles
- **Admin:** full catalogue, categories/subcategories, Custom Catalogue, Enquiries, reusable subitems, stock, orders, customers/activity/carts, and staff account control.
- **Management:** add/edit Ready Made products, Customize Catalogue categories/items and reusable Subitems. It can upload product/option images and manage exact variants, but it cannot use destructive product/category deletes, Enquiries, stock desk, customers, orders, activity or accounts.
- **Staff:** stock sales desk only. Search by name/code/barcode/category/colour/size, choose the exact variant, enter quantity, and mark it sold. Staff cannot add stock.
- **Order Receiving:** read orders and update order status only.

## Customization Catalogue enquiries
Catalogue browsing is public, but an enquiry is written only after the existing OTP session has been verified. The `customer-event` Edge Function validates that customer token and saves the request as a `customer_activity` row with event type `custom_catalog_enquiry`. Admin reads those rows together with the linked customer profile.

## Server-authoritative customer data
- Customer name, business/institution and post/role.
- Cart items, quantities, piece count and total.
- Order history and order status.
- Customization catalogue enquiries linked to the verified customer.
- One phone number stays connected to the same customer record on every device.
- Multiple active devices can use the same customer account.

## Device cache
Static website/PWA files, catalogue/settings snapshots for fast loading, unfinished customizer drafts, and the login session token may use device storage. Cart/order/profile data remain server-authoritative.
