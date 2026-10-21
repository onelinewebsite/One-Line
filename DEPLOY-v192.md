# One-Line v192 — Catalogue search, compact customer PDF, order contacts and delivery date

Base: v191. All prior customer item/detail pricing, card navigation and detail-only zoom behavior are preserved.

## Changes

1. **Customer searches:** A cached, client-side search appears on Custom Catalogue, Ready Made and their category listing pages. It searches item titles, descriptions, item IDs/codes, price/rate values, variant names/IDs, variant prices and available fabric/quality/print options. Searches stay within the current catalogue section. The existing product-card routing behavior is unchanged.
2. **Customer order PDF:** Download and Share now generate the same compact, detailed A4 order summary with One-Line branding, quantities, selections, remarks and totals — without product/image galleries. The admin's courier shipping PDF is unchanged.
3. **Admin order contact:** Click Account phone or Delivery phone in order details for Call and WhatsApp links. Numbers are encoded into tel: and wa.me safely for Indian 10-digit numbers and stored international numbers. A telephone handler must be installed for desktop calling.
4. **Expected delivery date:** Admin order details now have an optional date field and Save date control. The date is stored as `orders.metadata.expected_delivery_date` and all other existing order metadata remains intact.

## Deployment

- Upload/publish the contents of `One-Line-main/` to Cloudflare Pages.
- Refresh the website and PWA so that the v192 service worker and script versions load.
- **No SQL migration** is necessary because the delivery date uses the existing `orders.metadata` JSON column.
- **No Edge Function deployment** is required.

## Verification and caveats

- JavaScript syntax validated for the changed customer, admin and PDF scripts.
- Isolated tests verified search matches, section isolation/private-category exclusion, contact link encoding, persisted admin date rendering, date-save metadata preservation and image-free A4 PDF generation.
- Live Cloudflare/Supabase deployment, device calling, WhatsApp launch and actual network PDF sharing must still be tested after deployment.
