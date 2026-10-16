# One-Line v165 — Designer, Checkout and Share Preview

## Deploy

1. Deploy every file in this ZIP to the **same Cloudflare Pages site** as v164.
2. Refresh the browser and update/reopen the installed PWA (service-worker cache is now v165).
3. Test the real order flow against your connected Supabase, including a custom-designer Buy Now.

**No SQL schema migration** and **no Supabase Edge Function change** are required for these visual/design-sharing updates. Existing v164 redeem and order-function setup must remain installed.

## Changes
- Checkout Delivery Address and Delivery & Payment: removes only the large outer card, retains styled inner choices.
- Custom Designer: one scrollable page; simple garment dropdown; Front, Back and sleeve tabs above the preview; Add Text, Add Image, Layers, Selected Layer, garment colours, cloth quality, printing type, sizes, quantities; Add to Cart and direct Buy Now near the bottom.
- Double-click (or double-tap) a garment text layer to edit it directly; the existing advanced text settings still work.
- Share sends the **current garment-side transparent PNG image file**, when Web Share supports files (typically supported mobile browsers). Browsers that cannot share files download that actual PNG instead; they do not share a generic customizer link.
- Download PNG also exports the current garment side (1024×1024 with transparent pixels outside the shirt), using your chosen colour and layer images/text.
- `share-logo-white.png` is a 1200×1200 white-background brand asset. Open Graph/Twitter tags in site HTML use the absolute https://onelinesmart.com/share-logo-white.png URL on ALL public page variants, so when an item/query link is shared it uses the One-Line logo preview.
- `_redirects` supplies a 200-page response for `/catalog/*` when deployed to Cloudflare Pages. Previews on Facebook/WhatsApp/Instagram may stay cached after deployment; their bots decide if and when to refresh the image.

## Limitations
- The built-in designer image-sharing mechanism shares the current side, not a publicly hosted shareable design link. Apps need file-sharing support for immediate attachment; fallback is PNG download.
- External social platforms control link-preview caching and may not render exactly the same image proportions.
- Production Supabase, WhatsApp/Instagram and direct-order checkout have NOT been tested from this local environment.
