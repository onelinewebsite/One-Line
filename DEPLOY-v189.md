# One-Line v189 — Catalogue card photo zoom

Based strictly on v188. No database migrations or Edge Function changes required.

- Clicking an actual product **image** in Ready Made product cards and Custom Catalogue item cards opens the same zoom viewer used by item details. Includes +/−, mobile pinch/pan, gallery navigation and browser Back/Escape.
- Clicking the item **title, rate or other non-photo card space** still opens the normal item details; the share button is unchanged.
- Uses the clicked item's own image gallery, even when another item was previously open. Browser Forward restores the correct image set.
- Accessible, focusable image button added. The gallery slider drag guard remains to prevent accidental zoom while swiping.
- Versioned JS/CSS/service-worker caches to 189. No unrelated changes, SQL or backend redeployment.

Deploy `One-Line-main` to Cloudflare Pages and refresh app/PWA.
