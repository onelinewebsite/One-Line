# One-Line v152 — Ready Made Uniform-style Editor + Private Admin fields

1. Back up the Supabase database.
2. Execute the COMPLETE `supabase/v152-private-item-details.sql` in Supabase SQL Editor.
3. Deploy this site to the same hosting configuration used for v151.
4. Reload the Admin PWA (hard refresh / update installed PWA if necessary).
5. Under Categories, create or open a Ready Made category; all Ready Made items now open the Uniform-style variants editor.
6. In any Ready Made / Uniform / Custom Catalogue item editor, fill the two private fields.
7. For a new item, create the item; for an existing item, tap **Save private details**.
8. Verify that anonymous customers cannot query `catalogue_internal_details` and that no private text appears on the customer item details page.

The two generic input labels are **Private detail 1** and **Private detail 2** (rename them if you want specific meanings). No existing item rows are deleted.
