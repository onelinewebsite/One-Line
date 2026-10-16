# One-Line v175 — item + category sharing reliability

## Changes
- Share links directly open their item/category (MEC7, Ready Stock Printable Items, Ready Made, Uniforms, Jerseys and other existing catalogue categories).
- Open Graph preview uses each record’s existing card image or category image. If that file fails, the edge function tries already-uploaded gallery photos or images inside Uniform/Ready Made variant configurations; retail products can also use existing retail variant images.
- JPG, PNG, WebP, GIF and AVIF image bytes are recognized and returned with their actual MIME type (rather than relying on the filename).
- If a category itself has no cover image, the first available existing item cover in the category is tried.
- Reads are public and cached; no new tables, SQL, Supabase Storage uploads, image-conversion jobs, Admin settings or service role key.

## Deploy
1. Replace existing website files in the GitHub repository with this ZIP contents. Include `functions/share/[[path]].js` so Cloudflare Pages deploys the updated sharing handler.
2. Deploy via Cloudflare Pages and refresh the customer site/PWA. No new Supabase SQL or Edge Function changes needed.
3. Share an item or category link and verify the thumbnail on WhatsApp, Instagram, etc. Social services often cache link previews. They also decide which original image formats to render; WebP / AVIF support can differ among them even though this site serves them correctly.

## Diagnostic
Open `https://onelinesmart.com/share/image/item/ITEM_UUID` or `https://onelinesmart.com/share/image/category/CATEGORY_UUID` to check the public image that the preview page exposes. Regular share links `/share/item/ITEM_UUID` and `/share/category/CATEGORY_UUID` open the exact catalogue screen.

## Scope
No orders, payments, stock, profiles, Admin/editor code or image storage has been changed.
