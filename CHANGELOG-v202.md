# One-Line v202

- Routed Cloudflare Pages social share function via `_routes.json` (`/share/*`).
- Generic link preview stays the existing 1200×1200 white-background One-Line logo; public share links use the actual product/item/category photo when available. JPG/PNG is preferred; WebP is used when there is no alternative photo.
- Ready Stock size editor: icon-only red X at top-right; no delete button pushed below fields.
- Staff stock desk: top Add Stock focus control, exact-item search, +1 quantity stepper and Add to stock; finite stock from 0 can be replenished.
- Added **new v202 SQL migration** for authorized positive inventory additions and audit trail. Required **once** before staff receiving can work. v198 stock/order/cancellation and `place-order` Edge Function unchanged.
- Cache-busted modified admin/app assets; dynamic share URLs bypass service worker caching.
