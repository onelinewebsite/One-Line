# One-Line v159 Deployment

1. Back up the existing Supabase project.
2. Run `supabase/v159-complete-pricing-card-images.sql` as one complete query in Supabase SQL Editor. It includes the v158 print setup; do not separately run v155-v158 scripts for printing.
3. Redeploy **supabase/functions/place-order/index.ts**. This is essential for jersey Add to Cart and Buy Now. Redeploy other Edge Functions only if needed by your existing environment.
4. Deploy website files to the existing host, including `sw.js`, all HTML, CSS and JS files.
5. Reload Admin and customer site, preferably test in a private window to avoid old service-worker cache; check the new 3:4 card image uploader and 1:1 detail gallery.
6. In Admin, check DTF/Embroidery/Sublimation/Screen Print types and rates, and test real customer OTP, cart, Buy Now, checkout, order details and PDFs.

No existing items, categories, photos, stock or customer records are deleted by this migration. Existing items use the first gallery photo until a separate card cover is set. The live Supabase environment was unavailable for an end-to-end production checkout test.
