# One-Line v218 — Opt-in Professional Dashboard

This is a complete website based on v217. It adds the Professional Dashboard **only** for verified customers who enable it in Account. It leaves checkout, stock changes, Staff, Admin, Management, product editors, customer order PDF formatting, and existing public SEO pages intact.

## IMPORTANT — Deploy in this order

1. Back up the current site and Supabase project.
2. Run `supabase/v218-professional-dashboard-preferences.sql` once in the **existing One-Line Supabase project** SQL Editor. It adds only two nullable/defaulted preference fields to `public.customers`.
3. Deploy the **updated** `supabase/functions/customer-account/index.ts` to the existing Supabase Edge Function called `customer-account` (using the same authentication and environment configuration it already uses). Deploying the website files to GitHub **does not** deploy a Supabase Edge Function. The function validates the existing customer session token, validates the chosen active Custom Catalogue category and returns only that customer's orders.
4. Upload the contents of `One-Line-main/` to the existing GitHub repo root. Allow Cloudflare Pages to deploy and its service worker to activate (`v218`).
5. Verify with a test customer account: Account > Professional Dashboard switch > select a main Custom Catalogue category > Dashboard header link. Verify the selected category and opt-in survive a new login on another device.
6. Place or inspect a test order and verify status progress, order image, View details, Download PDF, searchable order list and **Load more orders** pagination (50 records/page). Check at 390px and desktop widths. Verify that other account, cart, checkout, Admin and Staff flows still operate normally.

## How it works

- Order statuses are the **existing** One-Line statuses: Confirmed (0%), Processing (25%), Ready (50%), Dispatched (75%), Completed (100%). Cancelled orders show 0% and are excluded from spending metrics.
- Customer orders can be viewed, searched, filtered and downloaded. The dashboard **does not grant customer permissions to change order statuses, cancel or edit staff-controlled orders**.
- Saved money shows **recorded checkout redemption discounts** only. Historical order-item MRPs are not reliably snapshotted in all old orders, so comparing old totals to current catalogue MRPs would give inaccurate figures.
- Initial dashboard stats use currently loaded order records. The dashboard loads older orders in server-validated pages of 50 using the new `professional_orders` action; **Load more orders** extends the history and updates the visible statistics. Normal customer Orders page remains unchanged.
- Customer-specific order information is never stored in the public catalogue IndexedDB cache.

## Migration/rollback

- The SQL is additive and doesn't delete data or change RLS policies.
- To roll back frontend behavior, redeploy v217; if reverting backend as well, redeploy its prior `customer-account` function. The two new customer columns can stay unused.

## Verification performed for this build

- Node.js JavaScript syntax (`js/app.js`, `js/backend.js`).
- Isolated dashboard logic tests covering status percentages, search/filter results, checkouts' recorded discounts, and opt-in settings UI.
- ZIP integrity, deployment file paths, and cache-version consistency.

**Not verified:** live Supabase Edge Function deployment or SQL run, actual customer session, live checkout, or a full mobile-browser regression. Local browser navigation was blocked by this environment.
