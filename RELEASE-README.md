# One-Line v41

This release keeps the v39 customizer garment style/position and the v40 profile/admin features, then changes customer account data to **server-authoritative sync**.

Important files:
- `RUN-NEXT-v41.sql` — run once in Supabase SQL Editor on the existing project.
- `supabase/functions/customer-account/index.ts` — account/profile/cart sync API.
- `supabase/functions/place-order/index.ts` — creates orders from the canonical server cart.
- `supabase/functions/customer-event/index.ts` — v41-safe activity endpoint; ignores old whole-cart cache snapshots.
- `supabase/dashboard-deploy/` — self-contained copies for manual Supabase Dashboard deployment.
- `V41-GO-LIVE.txt` — short deployment checklist.

See `supabase/SETUP.md` for full setup and two-device testing.
