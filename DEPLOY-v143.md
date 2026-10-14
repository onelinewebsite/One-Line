# One-Line v143 deployment

1. Keep the existing v142 database setup. Run `supabase/v143-unlimited-stock.sql` in your Supabase SQL Editor. It updates server-side checks so *Unlimited* catalogue variant sizes do not consume stock when ordered or canceled. Limited sizes still deduct/restore normally.
2. Deploy the updated `supabase/functions/place-order/index.ts` Supabase Edge Function. Without this step, unlimited items will still be rejected by pre-order checks.
3. Upload the entire website folder and reload installed PWAs (service worker cache is updated).

Changes: unique manually editable Custom Catalogue / Ready Made catalogue ID with shared v142 duplicate protection; stock-unlimited switch on each catalogue variant size; new top customer profile overview and sign-in/verified state; removed global pointer-held button effect. No other flows intentionally modified.

Unlimited is supported for catalogue items using the configurable variant editor (Custom Catalogue and Ready Made catalogue modules). Older standalone `products` stock tables retain their existing tracked-inventory behavior.
