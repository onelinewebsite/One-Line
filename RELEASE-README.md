# One-Line v50 — Stable customer rebuild

This build restores the proven v48 customer navigation/rendering model and keeps the useful v49 Admin/Management category + B2B features.

## Stability fixes
- Home, menu, footer navigation and customer action buttons use the v48 event/render flow again.
- Removed the v49 artificial 20-image queue / IntersectionObserver loader from customer and portal pages. Native browser lazy-loading is used instead.
- Restored the v48 startup loader and removed the extra blocking loading layer.
- Inner-page Back control is a small floating button with no full-width background bar.

## UI polish
- Custom Catalogue homepage View catalogue CTA has compact, balanced padding.
- Custom Catalogue category covers are 3:4.
- Custom Catalogue and B2B detail images display full-width at their original ratio without cropping.
- Ready Made, Custom Catalogue and B2B detail Share actions sit beside the item name.
- Detail zoom icon is smaller.
- Full site header is shown on main browsing pages; inner pages use the floating Back control.

## Cache
- Service-worker/cache version is v50.
- No new Supabase SQL migration is required beyond the schema already used by v49.
