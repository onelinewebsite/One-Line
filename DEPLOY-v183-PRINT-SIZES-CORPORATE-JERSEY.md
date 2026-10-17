# One-Line v183 — targeted catalogue updates

Source: v182. Existing v178 authentication/security protections, unrelated catalogues, and assets remain unchanged.

## Changes

1. Removed the dark `Selected Rate` block from the garment option selector. The existing item price and order totals remain.
2. Ready Stock Printable Items and Corporate Tee Shirt keep selectable *multiple* print types. Each type has **exactly three** choices: **Logo Size**, **Name Size**, **Number Size**. An old duplicate/extra Size is no longer shown. Print-size prices remain editable from Admin > Custom Catalogue options > Printing rates.
3. New print types start with guessed prices **₹10 / ₹20 / ₹30** (Logo / Name / Number) which admin can edit. The SQL migration preserves rates already saved under the matching previous choices wherever possible. Rates for print types missing the Number Size use suggested starting values (e.g. Embroidery ₹100). Review actual rates in Admin before accepting real orders.
4. Corporate Tee Shirt has larger option cards, toggle-off selection of Fabric and Quality, the existing multi-print section above garment size/quantity, and **Add to cart / Buy now** rather than Enquire. Supports both historical T-shirt and Jersey editor types. Existing type selector stays hidden.
5. Full Sublimation Jerseys opens on **Type only**. After Type, shows Fabric; after Fabric, Quality; after Quality, Sizes & Quantity. Clicking the currently selected Type/Fabric/Quality deselects it and clears downstream selections. Other Jersey categories retain original auto-selection behavior.

## Required deployment (order is important)

1. **Back up** Supabase `public.custom_print_types` rows (especially `sizes` JSON) before changing production rates. Existing saved sizes are trimmed to the three standard choices by the migration; any custom extra sizes are removed from that JSON. Other tables and orders are untouched.
2. Run `supabase/v183-print-size-defaults.sql` in Supabase SQL Editor **once**, checking the resulting print rates. This replaces each print type's saved size list with the three choices. Pre-existing checkout carts with a removed print-size ID will need to be re-added by the customer.
3. Deploy `supabase/functions/place-order/index.ts` Edge Function. This allows secure server-repriced checkout for Corporate Tee Shirt with either editor mode.
4. Deploy the website to Cloudflare Pages (customer and admin pages). Cache version advanced to v183. Refresh any old open tabs after deploying.

## Verification performed

- JavaScript syntax checks for customer, admin and service worker; TypeScript transpilation for `place-order`.
- Focused tests of old four-size list normalization to three options, both selected print types, customer print-before-garment-size ordering, the Jersey step-by-step reveal, deselect/reset logic paths, and Corporate Tee controls.
- Simulated server checkout validates Corporate Tee garment quantities, both print types, server-side admin rates, no-print order and rejected invalid print-size IDs.

Not live-tested with the production Supabase or actual purchase. Before going live, do a test order for Corporate Tee Shirt and Full Sublimation Jerseys on a non-production account.
