# One-Line v131 — deployment instructions

This package contains the complete One-Line website from the uploaded project plus only the requested v131 changes: desktop Uniform order buttons, TOUCH SHOPPING spelling, customer saved delivery addresses, checkout address selection, improved admin account/delivery details, selected-item images in Admin/customer order views and PDFs, clickable customer orders, status timeline and downloadable customer order PDFs.

## Required deployment order

1. In **Supabase → SQL Editor**, run `supabase/v131-customer-addresses.sql` once. This creates `public.customer_addresses` under RLS. Do not delete the old customers/orders/order_items tables.
2. Deploy/redeploy the TWO Supabase Edge Functions with these included sources: `supabase/functions/customer-account/index.ts` and `supabase/functions/place-order/index.ts`. Both functions use their existing `_shared.ts` and the existing project secrets. These **must be deployed** for address save/edit/delete, ownership validation at checkout, and order snapshot metadata to work. Uploading only the website files to GitHub does **not** deploy Edge Functions.
3. Replace your GitHub website repository files with the contents of this extracted `One-Line-main` folder; commit and allow hosting to deploy. Confirm the app serves new `v=131` JS/CSS and the updated service worker.
4. Sign in using a test number, add/edit/delete multiple addresses, choose one at checkout, place a low-risk test order, open its order card, download PDF, then verify Admin's order detail shows **Account** and **Delivery recipient** separately. Check a real desktop Uniform cart and Buy Now before production sales.

**Order images:** New orders save the selected Uniform variant image URLs, custom-design assets, and an image URL snapshot for Ready Made items in `order_items.design_json`. Existing image URLs deleted from Supabase Storage cannot be recovered by this code. Customer and Admin PDF exports show an unavailable-image fallback when an old image cannot load.

**Security:** Customer address reads/writes go through OTP-token-verified `customer-account` Edge Function with customer ID filtering. The address table has RLS enabled and no anonymous select/write policy.

**Tests:** JS syntax checks passed; TypeScript parse checks passed but full Deno compilation needs the hosted runtime. Mock customer-account browser tests at 390px/1280px and Uniform button CSS click tests at 390px, 820px, 821px, 1024px, 1440px passed. Live database, real order placement, and real image hosting were not available for testing here.
