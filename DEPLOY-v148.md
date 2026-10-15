# One-Line v148 — ONLY two category restorations

This is based on the full v147 website, not a new design. All other categories and modules are left unchanged.

## Restored customer flows

* `Ready Stock Printable Items`: exact category name -> T-shirt fabric -> available Premium, Standard and (where configured) Budget -> displayed Admin rate -> existing enquiry.
* `Full Sublimation Jerseys`: exact category name -> sportswear garment type (e.g. Round Neck, V Neck, Polo, Semi Collar) -> fabric -> available quality -> adjusted Admin rate -> existing enquiry.

The Admin-managed `custom_catalog_fabrics`, `custom_sportswear_fabrics` and `custom_sportswear_types` tables remain the source of truth. New visible options appear without changing existing items unless Admin explicitly enables per-item restrictions. Existing item IDs, orders, stored variants, rates, images and descriptions are untouched by the SQL.

## Deploy

1. Back up Supabase, then open SQL Editor -> New query.
2. Paste **the entire** `supabase/v148-two-categories-fabrics.sql` (from `BEGIN;` through the final SELECT) and click Run. Do not execute a highlighted fragment like `active boolean NOT NULL ...`.
3. Confirm the final SELECT shows `Ready Stock Printable Items | tshirt` and `Full Sublimation Jerseys | jersey`.
4. Deploy the full ZIP, replacing the older website files.
5. Reopen the site in a fresh/private tab; test an item in each category. Click each garment type/fabric/quality to verify the displayed rate and send a test enquiry while logged in.

## Quick checks

* Ready Stock Printable Items: Mars Standard ₹350; Polycotton Premium ₹500, Standard ₹450, Budget not selectable (unless changed in Admin).
* Full Sublimation Jerseys: Mars Round Neck Premium ₹500; V Neck Premium ₹450; Polo Premium ₹550; Semi Collar Premium ₹530 (unless Admin changed prices).
* Disable a fabric in Admin: it no longer appears to customers on a fresh visit. New active fabric appears automatically; no source-code edits needed.

## Error note

Postgres `42601 syntax error at or near active` on line 1 means the editor is trying to execute an isolated `active boolean` column definition rather than a complete `CREATE TABLE` statement. This v148 script has no `active boolean` definition; it only changes these category modes and public read policies.

This build has local code/logic tests. It has not been connected to your production Supabase instance; verify that the two named categories exist and actual enquiries work in your deployment.
