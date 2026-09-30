Supabase Dashboard manual deploy copies for One-Line v62.

Database:
- No new SQL is required beyond RUN-NEXT-v56.sql if that migration was already run.

IMPORTANT FOR v62:
- Redeploy the place-order Edge Function because Team enquiries now save directly as orders and upload/verify the final front/back design assets before the customer loading screen finishes.
- Dashboard function name: place-order
- Use: place-order-index.ts
- Keep Verify JWT with legacy secret = OFF.

Other matching Dashboard copies remain available if needed:
- customer-account -> customer-account-index.ts
- customer-event -> customer-event-index.ts
- admin-user -> admin-user-index.ts

Keep the existing MSG91_AUTH_KEY secret unchanged.
