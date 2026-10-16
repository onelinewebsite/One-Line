# One-Line v178 — Portal Account and OTP Security Update

## REQUIRED BEFORE/AT RELEASE
1. **Deploy TWO UPDATED Supabase Edge Functions** from this ZIP:
   - `supabase/functions/admin-user/index.ts`
   - `supabase/functions/otp-session/index.ts`
   The Pages/GitHub upload **does not** deploy Supabase Edge Functions automatically.
   Existing project secrets (`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEYS`, `MSG91_AUTH_KEY`) must remain server-side. **No new secrets or schema changes required.**
2. **Deploy complete ZIP to GitHub/Cloudflare Pages**, including `functions/`, `js/`, `css/` and `sw.js`.
3. **Immediately rotate ALL pre-existing default or reused Admin/Management/Staff passwords** using Admin → Accounts (Edit → new unique 12+ character password → Done). If you cannot securely log in, reset those users in the Supabase Auth dashboard first. Existing passwords are NOT changed by a code release.
4. Review the `profiles` table and Supabase Auth users for forgotten/default access accounts; suspend any unused accounts. Check Auth logs for suspicious sign-ins, and revoke active sessions if compromise is suspected.
5. Test OTP login with the currently deployed MSG91 widget: it must return the verified phone identifier in MSG91 `verifyAccessToken` response (`message`, `identifier`, `mobile`, etc.) or the verified token payload. If no identifier is returned, login now **fails closed** instead of logging someone into an unverified phone number. Test a valid phone and a mismatched phone.
6. Open Admin, Management, Staff, create/edit account, checkout and PDF routes in production. Verify live database permissions separately.

## FIXED
- Removed predictable default portal usernames/passwords from public Admin JS.
- Removed default-account bootstrap/reset control and backend action; nothing automatically recreates accounts.
- Require 12–128 character new passwords with letters and digits, without the account username.
- Validate account edits before mutating Auth; guard against deactivating or demoting yourself / last active Admin.
- Enforce that MSG91 verified identity matches the phone being signed in, even if its response identifier is missing.
- Set same-origin frame embedding policy to discourage clickjacking.
- Cache-bust portal assets to avoid old reset UI after deploy.

## SCOPE & LIMITATIONS
This code update **does not change or revoke existing passwords or sessions**, cannot audit your current production Supabase policies, and does not guarantee full security or live order success. Full live penetration testing, XSS review, rate-limit policies, key rotation and dependency upgrades remain separate work.
No new SQL migration is needed for these changes.
