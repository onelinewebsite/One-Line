# One-Line v184 — Per-garment printing price fix

Base: v183. Targeted pricing correction; no new SQL schema or data migration.

## Correct pricing (Corporate Tee Shirt + Ready Stock Printable Items)

- **Printing OFF:** garment total = sum of (current Admin garment rate for the selected fabric/quality, or an explicit size-specific rate, times the count of that size).
- **Printing ON:** each selected print type can contain Logo Size, Name Size and Number Size quantities. Those quantities are **prints per garment**, not the total for the entire order.
- `print charge per garment = Σ (selected print rate × count per garment)` across ALL selected print types.
- `print order total = print charge per garment × TOTAL garments across ALL sizes`.
- `order total = garment total + print order total`.
- Customers must enter a positive print-size quantity for each selected print type when printing is ON; they may deselect print types or switch printing OFF.
- Customer size/quantity totals, checkout price, order metadata, and courier PDF use the same formula. The server always fetches the current Admin rate instead of trusting the browser's submitted rate.
- Example: ₹300 garment, logo ₹10 + name ₹20 + number ₹30 per garment, 10 garments -> ₹3,600 total. Printing OFF -> ₹3,000.

## Previous-version cart handling

Older saved `printable_order` and `jersey_order` cart entries created with Printing ON before v184 had a *one-time* print total. Such items display a notice in Cart and require removal and re-addition before checkout. This prevents a larger server-validated charge from being silently different from the old Cart price. Printing OFF items are unaffected. Older completed orders retain their original print line interpretation in PDF.

## Deploy

1. Keep the existing Supabase SQL migrations (including v179 and v183) applied as instructed previously. **No new SQL is needed for v184.**
2. Deploy `supabase/functions/place-order/index.ts` to the **place-order** Supabase Edge Function. This is required: the old function calculates printing charges only once.
3. Deploy the website contents to Cloudflare Pages. Customer app, admin, management, staff, PDF handler, and service worker cache versions are updated only where relevant.
4. Refresh any already-open pages; remove/re-add older printed cart items before ordering.

## Validation performed

- JS syntax checked (`js/*.js` and `sw.js`); whole `place-order` TypeScript transpiled successfully.
- Tested printing OFF / ON with multiple selected print types, mixed size-specific garment prices, nonzero printing counts, and per-garment quantity multiplication.
- Simulated server validation for Corporate Tee Shirt using both the old Jersey and T-shirt editors plus Ready Stock Printable Items.
- Verified the server ignores browser-supplied print prices and rejects selections missing per-print quantities.
- Not tested against live Supabase data, live payments, or deployed Cloudflare Pages; place a trial order after deployment before accepting live orders.
