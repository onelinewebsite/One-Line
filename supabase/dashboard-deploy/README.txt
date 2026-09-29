Supabase Dashboard manual deploy copies for One-Line v56.

For the existing project, first run RUN-NEXT-v56.sql from the project root once. The v56 customizer-pricing update changes the database pricing RPC, so an Edge Function redeploy is not required only for this update.

If you need to redeploy customer functions from the Dashboard for another reason, use these matching files:
- customer-account -> customer-account-index.ts
- place-order -> place-order-index.ts
- customer-event -> customer-event-index.ts

Keep Verify JWT with legacy secret = OFF for those three and for otp-session.
Keep the existing MSG91_AUTH_KEY secret unchanged.

For default portal access, admin-user-index.ts remains the Dashboard copy for the admin-user function.
