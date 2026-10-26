# One-Line v210 — Ready Stock Printable Details only

Based on v209. No database migration is necessary. Deploy the files inside `One-Line-main` to your existing GitHub repository root and confirm Cloudflare Pages deployment. Reload the admin and customer pages to receive the updated CSS and JS.

## Changes
- Only Ready Stock Printable Items use the Details list.
- New entries begin with Fabric, Colour, GSM and Quality labels and empty values.
- Older seven-row default lists are normalized **when opened in the editor**; entered values are preserved. Previously saved arbitrary details are not removed.
- Admin inputs have no example placeholders.
- Customer details display as plain bullet points without cards or borders. The existing 15px Details heading size stays unchanged.
- The search index remains unchanged: nonempty detail names and values remain searchable.

## Checks after deployment
1. Open a **new** Ready Stock Printable item: verify exactly four default name labels and empty values.
2. Enter values and save. Reopen the item and verify they persist; confirm the customer page displays `● Name - value`.
3. Check mobile (two details per row) and desktop (up to four per row); check search finds a detail value.
4. Open an existing item with saved custom highlights; verify no entered values disappeared.
5. Check stock, checkout and admin saves with a controlled test.

No inventory SQL, stock RPCs or checkout/Edge Function code were altered. Syntax validation alone does not guarantee live workflows.
