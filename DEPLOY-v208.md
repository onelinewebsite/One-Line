# One-Line v208 — Ready Stock Printable Highlights only

This is the complete One-Line website based on v207. The only feature change is **Highlights** in the **Ready Stock Printable Items** item editor/customer detail page. No database schema migration or Edge Function update is needed.

## Highlights
- Admin: open Custom Catalogue > Ready Stock Printable Items > edit an item. Add pairs of **Name** and **Value** with **+ Add highlight**; remove with ×. The normal item **Save** button saves them.
- Customer: Highlights appear below the item's description, before its selection controls. Two columns on phones, and more columns on wider screens.
- Search: Highlights' names and values are included in the existing catalogue search index.
- Existing items with no highlights keep their current appearance. Highlights use `custom_catalog_items.fabric_options.highlights`, preserving the existing size/stock JSON.

## Deployment
1. Keep your existing database and image backups.
2. Upload the contents of `One-Line-main` to the root of your existing GitHub repository; let Cloudflare Pages deploy.
3. Refresh the admin page, edit a Ready Stock Printable item, add (for example) `Fabric` / `Cotton blend`, and click **Save**.
4. Reload the editor to confirm values persist; open the customer item page and check Highlights.
5. Search for a saved highlight value and verify that the matching item appears. Check the two-column mobile layout.
6. Test one existing Ready Stock size and add-to-cart flow without changing stock to confirm it is unaffected.

### Technical checks
- All supplied JS syntax checks passed.
- Isolated render/search field checks passed; live authenticated Supabase save and customer flows have **not** been run.
- Only `admin.html`, `index.html`, `js/admin.js`, `js/app.js`, `css/admin.css`, and `css/site.css` were altered, plus this guide. Stock functions, SQL, checkout, and other editor categories are unchanged.
