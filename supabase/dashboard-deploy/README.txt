Supabase Dashboard manual deploy copies for One-Line v55.

For the current live v54 project, first run RUN-NEXT-v55.sql from the project root once. The v55 customizer-pricing update changes the database pricing RPC, so an Edge Function redeploy is not required only for this update.

If you need to redeploy customer functions from the Dashboard for another reason, use these matching files:
- customer-account -> customer-account-index.ts
- place-order -> place-order-index.ts
- customer-event -> customer-event-index.ts

Keep Verify JWT with legacy secret = OFF for those three and for otp-session.
Keep the existing MSG91_AUTH_KEY secret unchanged.

For default portal access, admin-user-index.ts remains the Dashboard copy for the admin-user function.
