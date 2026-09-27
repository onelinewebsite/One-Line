# OneLine v32 — refined customer experience + live integration

This is the full OneLine customer website, custom apparel designer, team-order flow, bulk catalogue and role portal build. It contains **no demo categories, demo products or demo orders**. Live catalogue, stock and order data are designed to come from the supplied Supabase project.

## Already configured in this ZIP
- Supabase Project URL
- Supabase browser-safe publishable key
- MSG91 OTP Widget ID
- MSG91 OTP Widget token (`tokenAuth`)
- India-only phone normalization (`91` + 10-digit number)
- PWA/service-worker cache v32

The **MSG91 account AuthKey is intentionally NOT inside this ZIP**. It is an account-level server credential and must be stored as the `MSG91_AUTH_KEY` Supabase Edge Function secret. Follow `supabase/SETUP.md`.

## v32 customer UI refinements
- Rebalanced desktop/mobile spacing and section sizing.
- Rebuilt the full-click **Build Your Own** home customizer opener with better logo sizing and a clearer designer CTA.
- Team-order teaser uses real online apparel photography for a full-sleeve T-shirt, sportswear jersey and polo.
- **Open team order** CTA is centered and responsive.
- **Ordering multiple sizes?** banner now has symmetric mobile margins/padding and better text sizing.
- Bottom navigation center action is a **+ icon only**; no Create label.
- Bottom navigation now uses **Profile** instead of Cart.
- Profile contains Cart, Orders, Custom Designer, Team Jersey, information pages and sign out.
- Profile edit supports changing the customer name. Changing mobile restarts OTP verification rather than silently replacing a verified phone.
- Cart is a clean retail layout with the heading **Cart** only, without quantity beside the title.
- Mobile menu is a simple one-column dropdown.
- OTP window is minimal: **mobile number → OTP → name**, with all three required. No captcha container is rendered in the website UI.
- About, Terms & Conditions, Privacy Policy and Shipping & Returns copy updated for customization, team orders, bulk size quantities, stock and uploaded artwork.

## Customer commerce features
- Entire customization visual on the home page is clickable.
- Practical front/back/left sleeve/right sleeve custom designer retained.
- Upload Your Design Jersey flow for T-Shirt / Sportswear / Polo.
- Unlimited roster rows; **name, number and size are all mandatory for every row**.
- Category cards are equal 3:4 cards. Empty categories are hidden automatically.
- Bottom Categories navigation opens the complete live category list.
- Search by product name, category, subcategory, six-character item code or barcode.
- Bulk size matrix supports different quantities against each available size.
- Reusable linked subitems, such as shorts, use independent size quantities.
- OTP login is requested only when needed for a cart/order action or when the customer explicitly chooses to verify from Profile; it is not forced on site open.
- MSG91 Web SDK custom UI is used, then its access token is verified again on the server before a customer session is created.
- Cart, checkout start and order attempts are logged for verified customers.
- Orders re-check and deduct database stock atomically. Browser prices cannot override catalogue prices.

## Admin / Management / Staff / Receiver
- Supabase Auth-backed role portals.
- Admin: categories, products, reusable subitems, accounts, orders, activity and stock.
- Management: products, subitems, stock, orders and activity.
- Staff: stock desk + order view.
- Order Receiving: order status workflow.
- Product editor uses section-level **Edit → Done** controls instead of unlocking the full product at once.
- Admin can create/suspend Admin, Management, Staff and Receiver accounts.
- Stock movement history is recorded server-side.

## Item-code rule
If a barcode is supplied, that barcode becomes the item code. Without a barcode, a blank code generates a unique six-character mixed alphanumeric code. A manually entered non-barcode code must be exactly six A-Z/0-9 characters and include at least one letter and one number.

## Payments
No fake online-payment success is included. Current checkout uses the configured offline options. A payment gateway can be added later without changing the catalogue/order architecture.


Updated to v33: header cart icon, default profile icon, old-model customizer card, team-order content fixes, legal modal back-close behavior, and hardened OTP widget init.


v34: mobile drawer matching supplied reference, supplied team images, customizer mobile sizing, custom size quantities, cart SVG everywhere, OTP adapter simplified to one SDK init / one request, guest profile copy simplified, and catalog view-all button removed.
