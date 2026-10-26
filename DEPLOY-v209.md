# One-Line v209 — Ready Stock Printable default highlight names only

This is the complete One-Line website based on v208. No other logic or layout was changed.

## Admin default names
When a Ready Stock Printable item has no saved highlight list, the Highlights editor displays seven Name fields prefilled in this exact order:
1. Fabric
2. Colour
3. Quality
4. GasM
5. Properties
6. Corn
7. Quality

Each matching Value field starts empty and can be entered by Admin. Names remain editable, both Quality rows are kept, and the Add Highlight button remains available (maximum 20 total).

When Admin saves an item, name-only rows are preserved so remaining preset names still appear the next time the item is edited. Customer details continue to show only highlights with both a Name and a Value. Existing saved highlight lists remain unchanged; this release doesn't rewrite existing database records.

## Deploy
Copy the contents of `One-Line-main` into the root of the existing GitHub repo and deploy through Cloudflare Pages. Reload Admin, open Ready Stock Printable Items, enter values, save, reopen, and verify customer display and search.

No SQL migration or Supabase Edge Function update required. Live database save behavior and checkout have not been tested by this packaging task.
