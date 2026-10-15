# One-Line v147 — Customer fabric selection and v145 SQL

1. Back up Supabase before running SQL.
2. Run `supabase/v145-category-fabric-pricing.sql` in Supabase SQL Editor. It includes v144 category-mode creation and correct public fabric policies; preserves Admin price changes.
3. Deploy ALL site files, not only the JS file.
4. Open the customer T-Shirts and Full Sublimation Jerseys item detail pages in a new/private window. Every opening fetches fresh visible fabric/type rows. Select a fabric then quality; Sportswear must select type then fabric then quality.
5. Confirm Polycotton has Premium ₹500, Standard ₹450 but NO Budget (unless Admin changes it), and select Mars Round Neck Premium ₹500, V Neck Premium ₹450, Polo Premium ₹550.
6. An enquiry now rechecks current Supabase fabric prices before submission. Hidden fabrics/types will disappear upon refresh; invalid selections are cleared.
7. If prices cannot be fetched, the customer page displays a clear error with Retry and prevents submitting unverified prices.
8. Uniform / Normal Catalogue variants and checkout remain separate and unchanged.

SQL is repeatable but live environment / RLS policy behaviors need to be confirmed against your real Supabase deployment.
