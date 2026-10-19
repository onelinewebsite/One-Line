# One-Line v188 — product photo zoom and item details

Based on v187. No database migration or Supabase Edge Function redeploy required.

## Changes
- Fixed the custom item image zoom opener (removed a reference to an undefined `publicItem`). Existing product gallery zoom now opens on click; +/- buttons, double-tap, pinch zoom, drag and swipe are supported. Viewer updates without re-rendering the entire page after +/-; supports browser Back/Escape.
- Restored the Admin item's own default final rate (or the lowest configured variant rate as fallback) whenever no uniform variant is active. Shows the chosen /Piece, /Pair, /Set or Onwards unit.
- Put the selected uniform variant title/description, general item description and configured fallback description between Choose and Sizes & Quantity.
- Moved customer-visible private details 1 and 2 to the bottom of the item information section, below Add to cart/Buy now, separated by a | character on one line.
- Bumped frontend JS/CSS/service worker cache versions to 188.

## Deploy
Deploy the contents of `One-Line-main` to Cloudflare Pages. Refresh the installed PWA/browser page after deployment to pick up v188.

## Verification
- JS syntax check and Chromium isolated-data browser test passed: baseline ₹175/Set; select/deselect variant restores baseline; variant descriptions and size section order; bottom details line; zoom 100% -> 125% -> 100%; Escape closes viewer; simulated two-finger pinch reached 150%; /Piece /Pair /Set default units.
- These isolated tests do not assert live Supabase stock, checkout or production-device behavior. No production data was edited.
