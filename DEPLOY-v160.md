# One-Line v160 — focused mobile, checkout, team and image update

This complete website is based on v159. No new SQL schema migration is required for v160. All previous required migrations must already be applied (particularly v159 if not yet installed).

## Deploy
1. Back up Supabase before deploying. Do not delete tables or historical order data.
2. Deploy the contents of this ZIP to the current website hosting (replace old website assets, preserve hosting settings/secrets).
3. Redeploy `supabase/functions/place-order/index.ts` as the `place-order` Supabase Edge Function. This version writes a small order-activity metadata event instead of duplicating an entire order. Full Team Enquiry design payloads are preserved because Admin and PDF exports require them.
4. Reload the site and installed PWA. The v160 service worker uses a refreshed cache key.
5. Verify on live Supabase with an OTP-authenticated account: Uniform/Ready Made, Ready Stock Printable, and Jersey `Buy Now` opens Checkout directly; `Add to Cart` updates Cart. Place a low-risk test order only once safe to do so, and verify Admin order, PDF, and existing cart stay in sync.

## Changes
- Uniform/Ready Made/general catalogue: size, finite stock and special size rate share the same first line. Measurements are below with deliberate spacing. Unlimited stock is shown as no stock text (the quantity controls still work).
- Jerseys: optional separate rate alongside the size and measurements below.
- Fullscreen item/detail gallery uses 3:4 ratio instead of 1:1; card covers remain 3:4, variant photo upload remains separate and square (1:1).
- Buy Now direct-order state is tab-persisted for 45 minutes and isolated from saved Cart. It is deleted when a direct order succeeds, when logging out, or when choosing saved-cart checkout.
- Team Upload roster: each player's name and number are optional; size is still required. The customer order PDF lists selected team sizes; the dedicated Admin Team PDF includes front/back artwork and the complete roster.
- `order_placed` activity entry stores only ID, code, item count and direct-order flag, avoiding a duplicate complete order record. Existing actual order records are unchanged. Team Enquiry retains full design data for Admin and PDF.

## Testing limits
- JS syntax, TypeScript transpile, CSS parse and ZIP integrity checked locally.
- Size layout / quantity interaction tested in Chromium at 280,320,360,375,390,430,768 px using an isolated responsive fixture.
- Buy Now direct state and cart separation tested in a local JS state harness.
- Live OTP, Supabase checkout, stock decrements, order PDFs and full production app flows cannot be guaranteed until deployment testing.
