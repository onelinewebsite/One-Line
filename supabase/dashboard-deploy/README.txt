Supabase Dashboard manual deploy copies for One-Line v41.

Run RUN-NEXT-v41.sql first. Then in Edge Functions create/update these exact names and paste the matching file:
- customer-account -> customer-account-index.ts
- place-order -> place-order-index.ts
- customer-event -> customer-event-index.ts

Set Verify JWT with legacy secret = OFF for all three. otp-session stays OFF too.
The existing MSG91_AUTH_KEY secret remains unchanged.

V42 NOTE
For default portal access, update/redeploy admin-user using admin-user-index.ts.
Then sign in with the existing Admin account -> Accounts -> Create / reset access.
