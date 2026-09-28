# One-Line v41 — server-synced customer accounts

This build keeps customer profile, cart and order history on Supabase. Device storage is used only for the login session token, static/catalogue cache and unfinished designer drafts.

## Existing project (recommended)
You already ran the original `schema.sql`, so do **not** recreate the database.

1. Supabase → SQL Editor → New query.
2. Run `RUN-NEXT-v41.sql` once. It is safe whether or not the v40 migration was previously run.
3. Redeploy these Edge Functions from this build:

```bash
supabase functions deploy customer-event --no-verify-jwt
supabase functions deploy customer-account --no-verify-jwt
supabase functions deploy place-order --no-verify-jwt
```

`otp-session` does not need a code change for v41, but it must remain deployed with Verify JWT OFF. Keep the existing `MSG91_AUTH_KEY` Edge Function secret.

If you deploy manually from the Supabase Dashboard, use the self-contained files in `supabase/dashboard-deploy/` and keep **Verify JWT with legacy secret = OFF** for `customer-event`, `customer-account`, `place-order`, and `otp-session`.

## Fresh project
Run the complete `supabase/schema.sql`, set `MSG91_AUTH_KEY`, then deploy:

```bash
supabase functions deploy otp-session --no-verify-jwt
supabase functions deploy customer-event --no-verify-jwt
supabase functions deploy customer-account --no-verify-jwt
supabase functions deploy place-order --no-verify-jwt
supabase functions deploy admin-user
```

## What is server-authoritative in v41
- Customer name, business/institution and post/role.
- Cart items, quantities, piece count and total.
- Order history and order status.
- One phone number remains connected to the same customer record on every device.
- Multiple active devices can use the same account. Cart mutations are atomic so two devices do not overwrite unrelated cart changes.

The browser does **not** restore cart/order/profile data from localStorage. The site polls a lightweight account sync endpoint about every 2.5 seconds while visible, and same-browser tabs also signal each other immediately.

## What may still use device cache
- Static website/PWA files.
- Catalogue/settings cache used for fast loading.
- Unfinished customizer/design drafts before they are added to cart.
- The customer session token needed to stay signed in on that device.

As soon as a design/product is added to cart, the complete cart item is saved to Supabase and becomes available on the customer's other logged-in devices.

## Two-device test
1. Log in with the same phone number on a laptop and phone.
2. Change the profile name/business/role on one device. The other device should update within a few seconds.
3. Add an item on the laptop. The phone cart should show it within a few seconds.
4. Change quantity/remove an item on one device. The other device should follow.
5. Place an order. Both devices should show an empty cart and the new order in My Orders.
6. Change the order status in Admin. The customer order history should update automatically within a few seconds.

## Admin / Management
Customers, Live Carts, Orders, Activity and Dashboard refresh automatically every 5 seconds while those pages are open. Live Cart uses a small server-generated admin summary so uploaded design images are not repeatedly downloaded into the admin portal.
