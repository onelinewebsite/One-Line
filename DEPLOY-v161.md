# One-Line v161 — Buy Now checkout fix

## Root cause
`checkout()` in v160 returned the Cart page if `state.cart` was empty, even when Buy Now had already created a valid direct order in `state.directOrderItem`. v161 instead checks `checkoutItems()`, so a direct purchase with an empty saved cart shows Checkout.

## Deployment
1. Upload the **contents** of this complete ZIP to the existing website hosting, replacing the previous version.
2. Reload the customer website / installed PWA so `js/app.js?v=161` and the `one-line-catalogue-v161` service worker are active.
3. Test Buy Now on Ready Made/Uniform, Ready Stock Printable and Jersey products with an empty cart and with other saved items. Confirm it opens Delivery address → Delivery & payment directly, showing only the Buy Now item. Verify Add to Cart still works independently.
4. On your live Supabase, verify a safe test order before relying on production checkout.

No SQL or Edge Function changes are needed for this focused v161 UI fix. Existing v160 backend remains required.
