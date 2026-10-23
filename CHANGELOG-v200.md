# One-Line v200 — Admin editor refinements

Built on the user's final v199 release (including the already-installed v198 SQL); no database migration required.

## Changes
- Ready Stock Printable administration refreshed with a cohesive card layout, consistent spacing, clearly readable fields and violet editing states.
- Existing Ready Stock size rows: each text/number input has its own Edit and Done control; mobile shows pencil/tick icons only.
- Only the selected input becomes editable, rather than unlocking all size fields. Done persists through the existing `persistCustomItem` Supabase update, with the same validation and stock JSON representation.
- Size list for **new** Ready Stock Printable items now starts empty. Add Size creates an editable blank row. Existing products retain all their saved sizes and stock.
- Unlimited checkbox in the Ready Stock size editor saves immediately on existing products. Size deletion confirms and persists using the existing update flow.
- Item images still use the existing section Edit/Done, and standard item details and private-detail fields have individual Edit/Done.
- Previously locked fields remain legible (no faded appearance). Violet highlighting indicates editing; the normal appearance returns after Done.
- `Add printing` defaults OFF on the customer Ready Stock and Corporate Tee Shirt option flows; users may turn it on and select print types. Changing it still resets selected print quantities.

## Deployment
1. DO NOT re-run v198 SQL: user has verified all three v198 status checks as TRUE.
2. Upload the *contents* of One-Line-main to the existing GitHub repository root, replacing the current site files, and deploy through the existing Cloudflare Pages project.
3. Do not change Supabase credentials, policies, database functions/triggers or Edge Functions for this UI-only release.
4. Smoke-test: edit only one size field; save; reload; test stock/unlimited; create an item with Add size; inspect mobile edit buttons; verify Add printing OFF by default and ON flow pricing; place/cancel controlled test orders with stock and check restored quantities.

## Limitations
Static build and syntax verification cannot prove live checkout/stock paths. Test a controlled order after deployment. v198 SQL/Edge Function sources are retained unmodified in this package.
