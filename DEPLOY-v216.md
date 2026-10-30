# One-Line v216 — Size order arrows

1. In the existing One-Line Supabase SQL Editor, run `supabase/v216-ready-made-variant-size-order.sql` once. This allows Ready Made variant sizes to retain their order.
2. Upload the contents of `One-Line-main/` to the root of your existing GitHub website repository.
3. Allow Cloudflare Pages to deploy. Refresh Admin / Management.
4. Edit an item with several sizes. Click ↑ or ↓ next to a size, then click the item’s normal Save button. Reload and confirm the displayed order.
5. Verify both Admin and Management, and size selectors on the customer side.

What changed: size-order controls in the existing editors, stable Ready Made variant ordering, cache v216. No changes to checkout, prices, stock adjustments, Staff actions or order PDF.
