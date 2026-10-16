# One-Line v166 — Designer polish & larger social logo

Based on the complete v165 website package.

## Deploy
1. Upload/deploy the complete package to your existing Cloudflare Pages website.
2. Wait for the deployment and refresh the customer website and installed PWA.
3. Open Customize Designer on mobile: the garment dropdown is at the top-right, and double-tapping a text layer edits that exact text without a replacement input box.
4. Test native Share and PNG Download on your device. The existing design image sharing and transparent PNG export are retained.
5. Share a new link to verify `share-logo-white-v166.png` appears in the preview. External apps may retain previously cached previews or crop the image differently.

No Supabase schema migration or Edge Function redeployment is required for the v166 UI changes.

## Changes
- Larger One-Line logo on 1200x1200 pure-white social sharing image. All site HTML OG and Twitter metadata uses the new versioned image URL.
- Removed “Choose garment” label and right-aligned the compact garment-type selector.
- Removed the designer's “Large print” and “Sublimation available only” explanatory paragraphs, and the stage movement helper text.
- Removed the large Design Controls & Sharing panel: only Share and Download buttons remain below checkout actions.
- Better Layers manager spacing on desktop and mobile.
- On-garment text edits directly in the existing text span on desktop double-click or mobile double-tap, preserving font, color, size, position and transparent background.

## Validation
- Local Chromium fixture widths: 280, 320, 375, 390, 430, 768, 1280px; no horizontal overflow.
- Real desktop double-click and mobile double-tap event handling for text editing passed in isolated fixture; direct live site/PWA testing still recommended.
- JS syntax, CSS parsing, package integrity and social image dimensions verified.
