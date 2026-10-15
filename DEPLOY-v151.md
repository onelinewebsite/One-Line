# One-Line v151 — Profile icon gap + safe project cleanup

Based on complete v150 release. Deploy the entire `One-Line-main` folder as usual.

## Profile header
- Fixed grid tracks to fit the *actual* avatar icon: 86px icon + 22px gap on desktop, and 66px icon + 16px gap on mobile/tablet.
- Name, verified number, and account badge remain properly aligned, including long names and narrow screens.
- Existing separate Profile shortcut and editing page remain unchanged.

## Safe cleanup
- Removed four leftover pre-v117 CSS/JavaScript backup snapshots.
- Removed old per-version deployment notes (replaced by this document).
- Removed no-longer-used v149 in-overview Profile-panel CSS and v143 Profile detail leftovers.
- Removed two identical duplicate CSS rules and obsolete in-place profile-edit JS state.
- Removed one unused loader SVG and legacy B2B setup scripts that no longer support the v134+ flow.
- Retained real site assets (including those referenced by the database), all required scripts/styles, and Supabase schema+migration/function files.
- New service-worker cache + CSS/JS asset versions = v151.

**No SQL migration required.** No changes to checkout, catalogue types, T-Shirt and Jersey fabrics, admin pricing, Supabase functions, phone OTP, or stored profile details.

## Quick verification after deployment
1. Hard refresh profile page on desktop and 375px mobile. Confirm icon/text gap.
2. Tap Profile, update personal details, Save and reload.
3. Open Ready Stock Printable Items and Full Sublimation Jerseys and test live fabric/quality pricing.
4. Check Admin, Staff, Cart and Orders; verify the service worker picks up v151.
