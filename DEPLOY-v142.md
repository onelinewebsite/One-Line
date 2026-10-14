# v142 – required database setup

Before uploading the updated website, run **`supabase/v142-item-ids-staff-stock.sql`** in your existing Supabase project's SQL Editor **once**. This adds a shared, concurrency-safe ONE-00101-style counter, assigns IDs to existing Custom Catalogue items without changing their UUIDs, checks for duplicate IDs across product types, and installs the server-side staff mark-sold function for catalogue sizes.

Then deploy the entire v142 website folder and refresh the installed PWAs. Admin, Management and Staff use the same Supabase project and login system.

The new migration does **not** change previous order records or reset any stock. It also retains any pre-existing nonblank Ready Made product codes. New products with blank codes and new Custom Catalogue items receive shared sequential ONE-style IDs automatically.

Staff: search a product name, code/ID, category, variant or size; choose a quantity and press **Mark sold**. It subtracts only that quantity from the server. Stock cannot go below zero. Custom Catalogue variant sizes require the v142 migration. A staff account cannot add stock.
