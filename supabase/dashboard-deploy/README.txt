Supabase Dashboard manual deploy copies for One-Line v43.

For an existing v41/v42 live project, run RUN-NEXT-v43.sql from the project root first.
The v43 portal-role update does not require redeploying OTP/customer functions unless your existing deployment is outdated.

If you do need to redeploy customer functions from the Dashboard, use these matching files:
- customer-account -> customer-account-index.ts
- place-order -> place-order-index.ts
- customer-event -> customer-event-index.ts

Keep Verify JWT with legacy secret = OFF for those three and for otp-session.
Keep the existing MSG91_AUTH_KEY secret unchanged.

For default portal access, admin-user-index.ts remains the Dashboard copy for the admin-user function.
