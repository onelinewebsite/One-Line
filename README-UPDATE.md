# One-Line v78 — portal repair and cleanup

## Upload this update

1. Extract this ZIP. Replace the existing website files with the contents of `One-Line-main/` (where `index.html` is located).
2. Deploy the website through your existing hosting/GitHub workflow. Keep `js/config.js` and its existing project settings.
3. After the deployment finishes, open `admin.html` and `management.html` and refresh once. If a previously opened tab still shows the old page, close and reopen it or hard-refresh.
4. Sign in with your existing account. Verify a product edit, a custom catalogue edit and an image upload against your live database.

**This repair needs no new SQL migration, password reset or Edge Function deployment.** Existing database permissions, deployed functions and account records still need to be valid. Do not rerun `supabase/schema.sql` on an established project just for this update. Historical `RUN-NEXT-*.sql` scripts remain available only for installations that still require those earlier features.

## What was fixed

- Restored missing portal functions that caused the whole signed-in page to crash: B2B/enquiries rendering, notifications, B2B editing, fabric selections, design previews and team downloads. Static analysis found 39 references to missing functions in the original admin script; the corrected scripts pass the undefined-reference check.
- Added visible data-load errors with a Retry button. Session/profile errors are displayed instead of silently swallowed. Suspended accounts are rejected on session restoration.
- Reused each catalogue hydration result instead of querying the same categories, subitems and custom tables again. Overlapping portal reloads share one pending request.
- Background refresh pauses in hidden tabs and while item editors are open. The interval is 15 seconds. Notifications no longer rebuild an entire page and discard form input.
- Order lines are loaded for the displayed orders with pagination, instead of taking the oldest 1,500 lines across all orders.
- Preserved inactive products and variants in the portal catalogue while keeping the customer catalogue cache filtered to active products/variants.
- Checked deletion errors before subsequent variant/link writes. Existing database write operations are unchanged in structure and are not made transactional by this update.
- Shared one team PDF implementation for order and enquiry downloads.
- Updated asset URLs and the service-worker version, and stopped marking editable JS/CSS files immutable for a year.

## Cleanup

Removed 32 redundant files: superseded CSS source files already combined into `css/site.css`, old release/deployment notes, and two byte-identical migration copies (the root SQL versions remain). Removed seven unused JavaScript helper functions and exact duplicate CSS rules. Retained image assets because existing database records or seed migrations can reference them. Kept standalone Supabase dashboard deployment sources because they support a different deployment method from the CLI files.

Only project files are included. No testing dependencies, browser binaries, mock data or testing credentials are packaged.

## Verification and limits

- Syntax and undefined-reference checks: all seven JavaScript files pass.
- DOM tests with simulated Supabase data: all four portals; visible navigation; B2B creation; T-shirt, Sportswear and Uniform field saves; login; load failures with retry; suspended sessions.
- Chromium: admin and management at 390px and 1440px, staff at 390px, receiver at 1440px. All 34 tested navigation sections loaded without JavaScript exceptions or horizontal page overflow.
- Customer storefront smoke checks at 390px and 1440px: startup and catalogue hydration with simulated data; inactive products excluded.
- Local HTML asset references and ZIP integrity checked.

Tests used simulated data and did not modify the live Supabase project. Live account credentials, row-level permissions, storage uploads, MSG91 OTP, payments, order placement and production download services were not end-to-end verified. The ZIP is ready to deploy; it has not been deployed to your hosting account.
