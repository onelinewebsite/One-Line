# One-Line v134 — No B2B

## Deploy
1. Back up your Supabase database. This SQL intentionally deletes B2B credentials, assigned prices and sessions.
2. Extract this ZIP and upload the full `One-Line-main` contents to your GitHub repository root. Make sure `b2b.html`, `b2b-setup.sql`, and `supabase/b2b-setup.sql` are **deleted** from GitHub, not merely absent from the ZIP.
3. Commit and deploy. Existing customer/admin/store pages remain; B2B menus and calls are removed.
4. Open Supabase **SQL Editor** and run `supabase/v134-remove-b2b.sql` once. This must be done manually; publishing files to GitHub does not update your live database.
5. Confirm the B2B tables/functions are gone and test ordinary Custom Catalogue, Ready Made, Add to Cart, order creation, and Admin edits.

## Database safety
- Removes only `b2b_accounts`, `b2b_sessions`, `b2b_item_prices`, their RPCs/triggers and B2B flags.
- Existing B2B-only products are made inactive and hidden, not deleted; this protects catalogue/order references.
- Retail products, customer accounts, customer delivery addresses, orders, enquiries, and stock history remain unchanged.
- The migration updates the legacy stock RPC to no longer depend on B2B flags.
- Do not run any old B2B setup or the former entire setup file again.

## Deployment cleanup
GitHub upload tools do not automatically remove files that have been deleted locally. Delete `b2b.html`, `b2b-setup.sql`, `supabase/b2b-setup.sql` and old backup `.pre117`/`.bakv116` files from your GitHub repository if they are still present.
