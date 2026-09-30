Supabase Dashboard manual deploy copies for One-Line v64.

Database:
- No new SQL is required beyond RUN-NEXT-v56.sql if that migration was already run.

IMPORTANT FOR v64:
- Redeploy the existing place-order Edge Function.
- v64 preserves every Team logo in its original uploaded PNG/JPG/WebP format as well as the optimized editor copy.
- The Team loading state verifies those files are saved before completing the enquiry/order.
- Dashboard function name: place-order
- Use: place-order-index.ts
- Keep Verify JWT with legacy secret = OFF.

Other matching Dashboard copies remain available if needed:
- customer-account -> customer-account-index.ts
- customer-event -> customer-event-index.ts
- admin-user -> admin-user-index.ts

Keep the existing MSG91_AUTH_KEY secret unchanged.
