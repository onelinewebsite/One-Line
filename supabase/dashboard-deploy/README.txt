Supabase Dashboard manual deploy copies for One-Line v46.

For the current v45 live project, run RUN-NEXT-v46.sql from the project root once.
The v46 Ready Made / Customize Catalogue management update does not require redeploying OTP/customer functions.

If you do need to redeploy customer functions from the Dashboard for another reason, use these matching files:
- customer-account -> customer-account-index.ts
- place-order -> place-order-index.ts
- customer-event -> customer-event-index.ts

Keep Verify JWT with legacy secret = OFF for those three and for otp-session.
Keep the existing MSG91_AUTH_KEY secret unchanged.

For default portal access, admin-user-index.ts remains the Dashboard copy for the admin-user function.
