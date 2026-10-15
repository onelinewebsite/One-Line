# One-Line v153 — Jersey sizing, descriptions and fast fabric pricing

## Installation

1. Back up your existing Supabase data and deployment.
2. Deploy the contents of this ZIP (keep the same folder hierarchy).
3. **Important:** Redeploy the updated Supabase Edge Function at `supabase/functions/customer-event/index.ts`. In the Supabase CLI project directory, after linking your project, run `supabase functions deploy customer-event`. The repo's `supabase/config.toml` sets `verify_jwt = false` for this function because the site's OTP session is validated inside the function. The updated Edge Function is necessary for multi-size enquiries to use the Admin-verified prices and correct total amounts.
4. No new database table or SQL migration is required for v153. Jersey size configurations live in the existing `custom_catalog_items.fabric_options` JSONB field. Keep earlier migrations, including v152, applied.
5. Reload the Admin and customer PWAs after publishing so they use the new app/CSS and service-worker cache.

## Admin

- `Full Sublimation Jerseys` items: an editable size table defaults to XS, S, M, L, XL, XXL. Add/remove sizes, edit size labels, length (cm), width (cm), and optional *size-specific final rate*. Save changes with the item's existing save control.
- The size-specific rate **overrides** that size's fabric/type/quality unit rate. Without an override, a size uses the live fabric/type price. Only overridden sizes show a unit-price label beside their size in the customer picker.
- Uniform/Ready Made/normal Custom Catalogue variants: each saved size now supports optional length/width (cm) alongside existing stock and rate controls.
- A shared description for all variants can be edited on the item. If a specific variant has no description, the shared description is displayed instead.

## Customer

- Variant descriptions now appear below the item price and above the size selector.
- Jerseys: choose type → fabric → quality → enter a quantity for each desired size → submit an enquiry. Price and qty totals update without reloading the screen.
- Fabric/style options load from the site's existing local cache without showing a spinner on every visit. The website checks Supabase in the background, refreshing visible items, types, fabrics and sizes at most about once per minute while browsing, when returning to the tab, and immediately before an enquiry. An Internet connection is still needed to submit enquiries.

## Smoke checks after deployment

- On an existing Jersey: choose a fabric/quality, set XS×2 and M×1 with a separate M rate; verify the combined quote amount and enquiry history.
- From Admin change a Jersey size or fabric rate; return to customer tab and check the updated values.
- Select a Uniform variant with no specific description; check shared description directly beneath the price.
- Confirm only configured separately rated sizes show a unit-rate badge, and configured length/width measurements are visible.
