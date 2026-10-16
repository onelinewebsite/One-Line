# One-Line v174 — Lightweight sharing

Changes from v173:
- Removed Admin → Settings → Sharing images, its bulk JPEG converter, and its automatic image upload on every item/category save.
- No new `share-previews/...` copies are written to Supabase Storage. Existing copies (if you generated any) can remain; this version never reads them. Deleting existing copies is optional and not done automatically.
- Shared item/category links still open the matching screen directly and use the existing public card/category image in social previews. Original JPG, PNG or WebP file is served by the Cloudflare Pages share image proxy and cached on Cloudflare; no duplicate photo is stored.
- No new SQL, secret, Image Transformations, or Edge Function required for this update.

## Deploy
1. Replace the project in GitHub with the contents of this ZIP, including the `functions/share` directory. Delete `js/share-previews.js` from GitHub if it is still there.
2. Let Cloudflare Pages deploy and reload Admin/Customer/PWA to update the offline cache.
3. Test item and category links on WhatsApp. Social crawlers can cache old previews; WebP originals may not be supported by every external preview service. If a specific link fails, use a JPEG card image on that item/category in Admin rather than duplicating every image.

## Storage note
This release does NOT delete existing database records, order files or previous share-preview JPEG copies automatically; deleting existing copies is optional and should only be done after confirming they are obsolete.
