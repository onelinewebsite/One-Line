# OneLine v31 — final live-integration build

This is the full OneLine customer + customization + bulk catalogue + portal build. It contains **no demo categories, demo products or demo orders**. Live catalogue/stock/order data is sourced from the supplied Supabase project.

## Already configured in this ZIP
- Supabase Project URL
- Supabase browser-safe publishable key
- MSG91 OTP Widget ID
- MSG91 OTP Widget token (`tokenAuth`)
- India-only phone normalization (`91` + 10-digit number)
- PWA/service-worker cache v31

The **MSG91 account AuthKey is intentionally NOT inside this ZIP**. It is an account-level server credential and must be added as the `MSG91_AUTH_KEY` Supabase Edge Function secret. Follow `supabase/SETUP.md`.

## Customer website
- Mobile-first layout with larger customization/catalogue content.
- Entire customization visual on the home page is clickable.
- Practical front/back/left sleeve/right sleeve custom designer retained.
- Upload Your Design Jersey flow for T-Shirt / Sportswear / Polo.
- Unlimited roster rows with name, number and size.
- Category cards are equal 3:4 cards. Empty categories are hidden automatically.
- Bottom Categories navigation opens the complete live category list.
- Search by product name, category, subcategory, six-character item code or barcode.
- Bulk size matrix: different quantities can be entered against each available size.
- Reusable linked subitems (for example shorts) use their own independent size quantities.
- OTP login is requested only when the customer adds something to cart / continues an order, not on site open.
- MSG91 Web SDK custom UI is used, then its access token is verified again on the server before a customer session is created.
- Cart, checkout start and order attempts are logged for verified customers.
- Orders re-check and deduct database stock atomically. Browser prices cannot override catalogue prices.

## Admin / Management / Staff / Receiver
- Supabase Auth-backed role portals.
- Admin: categories, products, reusable subitems, accounts, orders, activity and stock.
- Management: products, subitems, stock, orders and activity.
- Staff: stock desk + order view.
- Order Receiving: order status workflow.
- Product editor uses section-level **Edit → Done** controls rather than unlocking the whole item at once.
- Admin can create/suspend Admin, Management, Staff and Receiver accounts.
- Stock movement history is recorded server-side.

## Item-code rule
If a barcode is supplied, that barcode becomes the item code. Without a barcode, a blank code generates a unique six-character mixed alphanumeric code. A manually entered non-barcode code must be exactly six A-Z/0-9 characters and include at least one letter and one number.

## Payments
No fake online-payment success is included. Current checkout uses the configured offline options. A gateway can be added later without changing the catalogue/order architecture.
