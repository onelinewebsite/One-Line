# One-Line v46

This build keeps the v43 role cleanup, v44 responsive cart fixes and v45 shareable Customize Catalogue/enquiry flow, then upgrades Admin + Management product handling using the uploaded Wellone management workflow as the reference.

## Deploy

1. Upload the full project.
2. In Supabase SQL Editor run `RUN-NEXT-v46.sql` once.
3. Wait for GitHub Pages/hosting deployment and refresh the site once. The v46 service worker removes older caches automatically.

No new Edge Function is required.

## v46 portal split

- **Ready Made**: normal stock products only. They use the existing store Categories / Ready Made navigation and never appear as Customize Catalogue ideas.
- **Customize Catalogue**: separate enquiry-only categories/items with multiple images and descriptions. They remain in the separate Customize Catalogue customer section and keep the v45 share/enquiry flow.
- **Admin**: full access and destructive controls.
- **Management**: can add/edit Ready Made products, Customize Catalogue categories/items and reusable Subitems. Product/category destructive deletes stay Admin-only.
- **Staff**: stock/sold desk only, unchanged.

## Wellone-style product/subitem upgrades

Ready Made products and Subitems now support a faster option workflow: Simple / One Option / Colour + Option product modes, bulk quick-add option values, exact quantity and rate per option, exact barcodes, hide/show per option, and separate option images uploaded to Supabase Storage.
