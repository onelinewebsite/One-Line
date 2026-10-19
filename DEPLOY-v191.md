# One-Line v191 — Correct Admin Default Final Rate precedence and unit label

Based on v190. Customer catalogue price display and service-worker cache versions only.

- **Default Final Rate set in Admin** (`custom_catalog_items.rate`, including `0`): Show the entered price on catalogue cards and the unselected item details page, using the Admin-selected display unit (`/Set`, `/Piece`, `/Pair`, or `Onwards`) for uniform/variant items. **Never prefix From** in this case.
- **Default Final Rate blank in Admin**: Show `From ₹[lowest valid in-stock variant/size rate]` without any `/Set` or other unit suffix on the card and on the deselected item details. If no valid variant rate exists, do not display a made-up price.
- When a variant is selected, display its actual selected price without a `From` prefix.
- Other categories with their own admin item rates display the set rate without `From`; T-Shirt/Sportswear categories whose rate is determined only by fabric and quality retain their lowest-available-rate `From` label.
- Retain v190 zoom exclusively on full item details, standard catalogue card navigation, and small right-aligned private details below purchase buttons.

**Deployment:** Deploy contents of `One-Line-main` to Cloudflare Pages. Refresh/reopen the installed PWA to update cached JS. No Supabase schema, Edge Function, or Admin change required.
