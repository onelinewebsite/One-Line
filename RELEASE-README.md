# OneLine v34 — mobile/tablet drawer + custom size quantities + OTP cleanup

This is the full OneLine customer website, custom apparel designer, team-order flow, bulk catalogue and role portal build. It contains no demo orders and keeps the existing live Supabase architecture.

## v34 customer changes
- Rebuilt the **mobile and tablet menu** as a full-height off-canvas drawer at about three-quarters of the viewport width, with icon cards, active state, account card and background scroll lock. Desktop keeps the normal horizontal navigation.
- Kept the existing **old-style home customizer opener** (`old-model-hero` / `old-model-card`) rather than replacing it with the newer redesign.
- Added the three supplied T-shirt, sportswear and polo images to **“Send one design. Add the whole team.”** as local project assets.
- Added a Manrope-first UI font stack and refreshed responsive text/control sizing so mobile and tablet controls are not microscopically small.
- Removed the unwanted **View all products** CTA.
- Changed customer cart/bag actions to the shopping-cart SVG throughout the customer flow.
- Removed the guest-profile sentence asking the customer to verify their mobile number when ready to order.
- The custom designer now supports **independent quantities for XS, S, M, L, XL, XXL and 3XL**, e.g. S × 4 and M × 13, with an automatic total and size breakdown saved into the cart design data.
- Removed the black outer border/ring treatment from garment colour swatches and the custom-colour control.
- Enlarged and stacked the customizer appropriately through tablet width while preserving the practical front/back/right-sleeve/left-sleeve editor.

## OTP cleanup
- MSG91 Widget initialization now happens once instead of being re-initialized before each send/retry/verify operation.
- OTP request ID state is preserved for retry and verification.
- Duplicate rapid sends/retries are deduplicated with in-flight and short guard windows.
- The normal phone form no longer resets the OTP wrapper immediately before sending.
- Explicit number changes/logout still clear the OTP transaction state.
- The browser-safe MSG91 Widget ID/token remain in `js/config.js`; the private account AuthKey is still not stored in browser files.

## Cache / release
- Customer cache-busting is v34.
- Service-worker cache: `one-line-v34-mobile-otp-sizeqty-20260928`.
- New local team assets are included in the PWA service-worker core cache.

## Existing commerce / admin architecture retained
- Team-order upload with roster rows.
- Ready-made catalogue, search, category/subcategory filtering and share links.
- Bulk per-size quantities for catalogue products and linked subitems.
- Cart, checkout and order history.
- Supabase-backed Admin / Management / Staff / Receiver portals.
- Server-side OTP access-token verification before OneLine customer session creation.
- Server-side order/stock validation.

## Go-live requirements
1. Keep the supplied Supabase schema/functions deployed on the client project.
2. Deploy/update the included Edge Functions if the deployed copies are older: `admin-user`, `customer-event`, `otp-session`, `place-order`.
3. Keep the private MSG91 account AuthKey in the `MSG91_AUTH_KEY` Supabase Edge Function secret, never in browser JavaScript.
4. Ensure the MSG91 widget configuration itself is active for the production domain/number flow.
