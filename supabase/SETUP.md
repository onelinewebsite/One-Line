# OneLine v32 — Supabase + MSG91 go-live

The frontend is already configured for the client Supabase project and MSG91 OTP Widget. No demo catalogue is shipped.

## 1. Run the database schema
Open the client Supabase project → SQL Editor → New query. Paste the complete contents of `supabase/schema.sql` and Run it once. The file is idempotent for the intended fresh project.

## 2. Deploy the Edge Functions
From a machine with the Supabase CLI installed and logged in, link this project and deploy:

```bash
supabase link --project-ref eiozlrnrvlfyflddemla
supabase functions deploy otp-session --no-verify-jwt
supabase functions deploy customer-event --no-verify-jwt
supabase functions deploy place-order --no-verify-jwt
supabase functions deploy admin-user
```

## 3. Add the MSG91 account AuthKey as a SERVER secret
The Widget ID/token are already in `js/config.js` because MSG91 provides those for client-side Widget use. The separate account-level AuthKey must stay server-side.

```bash
supabase secrets set MSG91_AUTH_KEY='PASTE_THE_ACCOUNT_AUTHKEY_HERE'
```

Do not put that AuthKey in HTML, JavaScript, GitHub, Netlify variables exposed to the browser, or screenshots. `otp-session` uses it only to call MSG91 `verifyAccessToken` after the browser Widget verifies the OTP.

## 4. Create the first Admin account
In Supabase → Authentication → Users → Add user. Use an internal email matching the portal username convention, for example `owner@staff.oneline.local`, and set a strong password. Copy the new user's UUID. Then run:

```sql
insert into public.profiles(id,username,name,role,active)
values ('PASTE_AUTH_USER_UUID','owner','OneLine Owner','admin',true);
```

After this first admin logs in at `admin.html`, the Accounts section can create Admin, Management, Staff and Order Receiving logins.

## 5. Upload the site
Upload the contents of this folder to the existing static host. The service worker uses cache `one-line-v32-profile-ui-20260927`, so old v30 code is replaced automatically after activation.

## Live OTP flow
Customer opens the site without login → attempts to add a product/design to cart → mobile number → MSG91 Widget sends OTP → customer enters OTP → Widget returns a short-lived access token → `otp-session` verifies that token with MSG91 using the secret AuthKey → OneLine creates a 30-day customer session → required name step → continues the original cart action.

## Important checks
- MSG91 Widget: India allowed, demo credentials blank, user-existence validation disabled, deprecated webhook skipped.
- The account-level MSG91 AuthKey rule must permit the Widget/access-token verification call.
- Product/category images are uploaded to the public `product-images` bucket by Admin/Management only.
- Catalogue orders are stock-checked and deducted atomically on the server.
- Custom/team artwork is uploaded by the server when the order is placed.

## MSG91 OTP widget settings
For this custom OTP UI, keep **Captcha disabled** in the MSG91 OTP Widget settings. The website initializes the MSG91 SDK once, sends only one request per submit, reuses the returned request ID for resend/verify, and performs server-side access-token verification through the Supabase Edge Function.
