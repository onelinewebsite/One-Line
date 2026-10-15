# One-Line v158 — Clean Printable/Jersey Experience

## Deploy
1. Back up Supabase.
2. Run the **entire** `supabase/v158-default-print-types-and-sizes.sql` in Supabase SQL Editor. It replaces the v155/v156/v157 **print-options** SQL migration, so there is no need to run those first. Previous non-print migrations still apply.
3. Deploy the updated `supabase/functions/place-order/index.ts` Edge Function if not already using the v157-compatible code. The server re-prices print types/sizes and rejects invalid or deleted choices.
4. Deploy the contents of this ZIP to your existing Cloudflare Pages project and refresh the PWA. Cache version is v158.

## Admin
Custom Catalogue Options > Print types & sizes includes DTF Print, Embroidery, Sublimation and Screen Print by default *only where names do not already exist*. Existing prices, print types and sizes are preserved. Starting rates are copied from the site's legacy designer print defaults (DTF 10/20, Embroidery 50/100, Sublimation 10/20, Screen Print 10/20, in INR); **review and change these before taking real orders**. Admin can add, edit, hide and delete print types and configure individual print sizes/rates. Only admin role can delete types.

In Custom Catalogue item editor, the bottom control is labelled **Save**; it persists current item and fabric/size settings. The Back button remains available. Existing inline edit/done controls are unchanged.

## Customer
Full Sublimation Jerseys and Ready Stock Printable items show only final rupee garment rates for the currently chosen fabric and quality. Round Neck, V Neck, Polo and other garment types retain valid fabric/quality selections when changed. Technical adjustment text and generic enquiry instructions are hidden. Item description shows only when Admin has entered one.

Print type cards display names only. One print type at a time; changing type discards the previous quantities. All size steppers stay visible and update totals without rebuilding the controls on every tap. Buy Now/Add to Cart remain clickable and explain any incomplete selection via toast instead of appearing broken.

## Testing & limitations
Local Chromium interactions/layout checks at 280, 320, 375, 390, 430 and 768px passed for prices, type switching, quantity updates and horizontal width. Mock Admin create/edit/delete tests and Edge Function pricing-validation tests passed. Production Supabase, OTP/cart/checkout/PDF still require a live end-to-end test.
