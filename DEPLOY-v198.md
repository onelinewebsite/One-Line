# One-Line v198 deployment

> **For this final packaged ZIP:** Begin with `START-HERE-AFTER-BACKUP.md` and use the bundled `supabase/CHECK-v198-STATUS-READ-ONLY.sql` before running any migration.

Based on v197. Only these enhancements were intended: new catalogue items appear first; Ready Stock Printable Items support per-size inventory and default to Add printing OFF; previously saved admin and management editor values use Edit → Done controls. Superseded historical deployment notes and one verified duplicate SQL file were removed, not working assets or unique database migrations.

## Deploy in order

1. **Back up your Supabase database first.** Run `supabase/v198-ready-stock-inventory.sql` in Supabase SQL Editor (after your existing v197 migrations). This installs the atomic per-size checkout deduction and cancellation/restock triggers for Ready Stock Printable Items. **Do not skip this migration if you want reliable stock limits at checkout.**
2. Upload the contents of this ZIP's `One-Line-main/` directory to Cloudflare Pages and refresh the installed PWA or website. `sw.js` uses the v198 cache version. No Supabase Edge Function change is included in this release.
3. In Admin → Custom Catalogue → Ready Stock Printable Items → each item → Garment sizes & measurements, select Edit, enter Available stock per size, or choose Unlimited, then Done. New items are configured with zero finite stock by default, so stock must be entered before taking orders. Older items with no stock setting remain unlimited to preserve compatibility; configure these manually for real stock protection.
4. Confirm an item defaults to Add printing OFF on first open, can be toggled ON when required, and quantities exceeding available stock cannot be ordered. Check order cancellation/restocking with a test order.
5. Check Edit → Done on saved item sections and settings in both Admin and Management. The server still enforces role permissions; edit controls are not an authorization bypass.

## Data and compatibility

- Inventory is saved in existing `custom_catalog_items.fabric_options.sportswear_sizes` JSON (`stock` and `unlimited`) without modifying the item schema. The SQL migration adds functions/triggers, not columns.
- Stock is deducted within the PostgreSQL order transaction and restored once when a confirmed order transitions to `Cancelled`. Changing a cancelled order back to an active status rechecks inventory.
- New items are saved with a leading category sort order. Manual admin ordering remains available.
- Existing pricing, multi-print rules, images, receipts, search, shipping PDFs, and default final rate display are unchanged.

## Testing limitation

Local static/JavaScript checks can verify source, but cannot prove Supabase triggers work on a live account. Test with real checkout and cancellation after deployment. If SQL execution fails, do not activate stock-managed sales before resolving it.
