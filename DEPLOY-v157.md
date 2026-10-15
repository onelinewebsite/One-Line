# One-Line v157 — Print types and editable sizes

## Database (required)
1. Back up your Supabase database.
2. In Supabase SQL Editor, open a **New query** and paste **the entire** `supabase/v157-print-types-and-sizes-complete.sql` file. Click Run. Do NOT select an individual field or run v155/v156 print SQL first.
3. This migration creates `custom_print_types` if missing, adds the JSONB `sizes` field to preexisting tables, and copies existing Name / Logo and Large rates into the new list **only if the list is empty**. Existing configured print sizes/rates are kept. It also updates the existing order RPC.
4. If you previously installed v152 for private details, keep it; v157 does not alter those private fields.

## Backend (required)
Redeploy Supabase Edge Function `place-order` from `supabase/functions/place-order/index.ts`.
If the Edge Function is not redeployed, old validation will reject custom print sizes or allow the old multi-type behavior.

## Frontend
Deploy the complete ZIP contents, preserving the `css`, `js`, `assets` and `supabase` paths. Reload the site and installed PWA to pick up cache v157.

## Admin
Admin > Custom Catalogue options > Print types & sizes:
- Create, rename or edit print types; switch visibility; delete types (admin role only).
- Click Edit on a print type to add, rename, set rate for, or remove individual print sizes, then Save.
- New types start with Name / Logo Size and Large Size. Edit or remove either; add any extra size.
- Deleting a print type does not remove snapshot details in historical orders.

## Customer
- Choose exactly one print type. No added count is shown on type cards.
- For that type, set quantities independently on every available print size (`- 0 +`). All begin at zero.
- Choosing a different print type clears **all** quantities from the earlier type; switching back starts at zero.
- Select garments, quality and size quantities, then Add to Cart or Buy Now.
- The order function validates the one selected type, all print-size IDs, quantities and the latest Admin rates. Deleted options require choosing again.
- Order details and the existing PDF include selected print type, dynamic size names, quantities and rates.

## Verification
Local JS syntax, Chromium print-selection/width tests at 280–768 px, and mocked Admin create/edit/delete tests passed.
Not production-tested with your connected Supabase account; check checkout and actual downloaded PDF after deploying.
