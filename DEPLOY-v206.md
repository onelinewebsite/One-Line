# One-Line v206 — Admin classic layouts + Staff mobile improvements

Based on v205, with v203 item-adding visual style selectively restored.

## Editor visuals
- Custom Catalogue item editors use the compact v203/MEC7 editing appearance for all general categories, including Shoppee and Pre School Uniforms, and for custom Ready Made catalogue categories.
- The specialized editor layouts for Corporate Tee Shirt, Ready Stock Printable Items, and Full Sublimation Jerseys remain intact.
- Standard Ready Made product editor is likewise styled in the compact v203 fashion.
- Existing pricing, item fields, editable options, image reordering, save calls, orders, and stock functions are preserved.
- The fixed desktop item-photo preview has no extra caption. The `Private details` heading/description is hidden but the two private fields remain.
- For tracked variants that include unlimited stock, summaries read `Unlimited` rather than a misleading `0 stock` when there is no finite stock.

## Size defaults
- Newly created **Corporate Tee Shirt** items use the original XS/S/M/L/XL/XXL list. If they already have a saved list, it is left untouched.
- New **Ready Stock Printable Items** start with no sizes; add them manually.
- New **Ready Made** variants start without sizes; add them manually.
- Saved product sizes, quantities and prices are not reset or migrated.

## Photos
- Up/down arrows from v205 remain on Ready Made gallery photos, Custom Catalogue item photos, and multi-image variant galleries.
- Reordered image positions are saved using the normal item **Save** action.
- A single-image Ready Made exact option still only has one image; it does not have multiple photos to reorder within that option.

## Staff stock desk
- Default is **Mark as Sold**; the top button toggles **Add Stock**.
- Quantity uses touch-friendly **− [number] +**, minimum 1. When selling, it is clamped to available stock.
- Before either sale or stock addition, a confirmation includes selected item, quantity and current/new stock counts.
- The existing v202 and v204 stock RPCs are unchanged. An operation runs only after confirmation.
- Stock for unlimited inventory is displayed as **Unlimited**, and no manual adjustment is offered.

## Deployment
1. Keep your PostgreSQL + Supabase Storage backups. Do not run any older SQL again.
2. Ensure v202 Add Stock and v204 Ready Stock Sold migrations were previously installed. **v206 introduces no SQL migration.**
3. Extract the ZIP and commit the **contents** of `One-Line-main` to the existing GitHub repository root.
4. Confirm your Cloudflare Pages build completed. Open a test/preview deployment when possible before switching production.
5. Clear/reload any service-worker cache if old UI persists; the JS/CSS and service-worker cache keys are bumped.
6. Verify examples from MEC7, Shoppee, Pre School Uniforms, Ready Made and all three specialized categories.
7. Test one item with three uploaded photos and one multi-photo variant: reorder, save, reload and confirm order.
8. Test one limited-stock and one unlimited-stock item. The finite item must show the correct quantity, the unlimited item must not display `0 stock` misleadingly.
9. On mobile staff page, search an item, confirm − and + controls, cancel a confirmation, then confirm a **test** sale. Verify stock deducted exactly once. Switch to Add Stock, confirm receipt, and verify stock increased exactly once.
10. Test the controlled Ready Stock purchase/cancel flow and Corporate Tee Shirt checkout before considering the release verified.

## Verification performed while packaging
All shipped JavaScript passed Node syntax checks; image-ordering source retained; production order Edge Function and existing inventory migrations unchanged compared to v205. Full authenticated/live checkout and database mutation tests have **not** been executed.
