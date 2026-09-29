# One-Line v52 — Navigation + premium catalogue polish

Customer-side polish built on the stable v51 server/admin workflow.

## Changes
- Mobile bottom navigation now uses **Custom Catalogue** instead of Categories.
- Header Profile icon is hidden only on viewports where the mobile bottom navigation already provides Profile; it remains available on larger devices.
- Ready-made Home/navigation links are automatically hidden when there are no active customer-visible ready-made items.
- Home Ready-made category section is omitted when it has no active items.
- Home Ready-made and Custom Catalogue headings now use a full-width text flow with their action buttons on a separate row.
- Ready-made category cards are uniform and cleaner.
- Product cards inside category/catalog grids are compact, premium and no longer keep unnecessary empty information height.
- Custom Catalogue idea cards receive the same tighter premium spacing.

## Database
No new SQL is required when upgrading from v51. Keep the v51 database/storage permissions already applied.

No Edge Function redeploy is required.
