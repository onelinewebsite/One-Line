# One-Line v149 — Customer profile layout & footer spacing

Based on v148 Ready Stock & Jerseys package. This update changes only customer profile layout/styling and storefront mobile footer spacing.

## Customer Profile
- Compact top overview: name, verified mobile number and Verified account label only.
- Separate Profile card appears before Cart, Orders, Addresses shortcuts.
- Profile card: name, mobile number, business/institution and post/role, plus verification badge.
- Edit button allows changing name, business/institution and post/role. Changes use the existing Supabase `customer-account` endpoint. Verified phone remains read-only.
- User ID is no longer shown in the profile page. Guests see a sign-in prompt.

## Footer
- Removes old bottom padding on the page body below the dark site footer on mobile. Retains dark footer clearance under the fixed bottom navigation.

## Deployment
- Deploy the contents of `One-Line-main/` to your existing host.
- Hard refresh/reopen the PWA; client cache updated to v149.
- No new SQL is needed for this UI-only update. Previous database migrations are unchanged.

## Verification
- JavaScript syntax and local markup tests completed. Live Supabase edit/save and device rendering still require a real account test.
