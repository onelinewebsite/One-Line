# One-Line v43

Production build focused on role separation, inventory sales workflow, category management, cache refresh and frontend optimization.

## After upload
1. Upload the full project.
2. Run `RUN-NEXT-v43.sql` once in Supabase SQL Editor.
3. Hard refresh once on admin/staff/management devices. The v43 service worker then replaces old caches automatically.

## Portal roles
- Admin: full catalogue/category/subitem/stock/order/customer/account control.
- Management: add and edit products only, plus account settings.
- Staff: search exact item/variant and mark sold quantity only.
- Order Receiving: order tracking/status only.


## v44 — responsive cart spacing
- Fixed desktop cart thumbnail/text overlap by matching the grid column to the actual preview width.
- Added dedicated desktop, laptop, tablet and phone cart layouts.
- Cart summary now stacks before the product area becomes cramped on tablets/small laptops.
- Normalized title, card, quantity, remove-button and summary spacing across viewport sizes.
- Bumped customer CSS/JS/service-worker cache version to v44.
