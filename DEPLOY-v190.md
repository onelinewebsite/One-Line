# One-Line v190 — Details-only photo zoom, correct card rate, right-aligned private details

Based on v189. Only customer frontend display/interaction and cache versions are affected. No new SQL, Edge Function, or admin changes.

1. Product and catalogue **card images are no longer zoom triggers**. Clicking an image/card opens the regular item details as before v189. Zoom controls (+/−, touch pinch, pan, image swipes, Escape/Back) are still available **only within the full item details page**.
2. Custom Catalogue / Ready Made **variant cards use the item's Admin Default Final Rate if configured**. If blank, use the existing lowest valid available variant rate. Price labels read **From ₹...** with **no /Piece, /Pair, /Set, or Onwards suffix on cards**. Preserve optional MRP display. The unselected item details price shows the same item default; the details page keeps its configured unit display.
3. The customer-facing Private Detail 1 | Private Detail 2 row is smaller and **right-aligned** below Add to Cart/Buy Now, and above the page footer.
4. Service worker and JS/CSS versions bumped to 190 to refresh stale v189 image zoom behavior.

Deploy the `One-Line-main` contents to Cloudflare Pages and refresh/reopen any installed PWA. Existing browser cache may require a full refresh after deployment. No schema or server changes.
