# One-Line v197 — Width before Length

Base: One-Line v196. No other product, pricing, checkout, navigation, database, or backend features have been intentionally altered.

- Customer item-size measurements display **Width** then **Length**, still in inches, across jersey, corporate and uniform size renderers.
- Admin variant and jersey size forms display **Width** before **Length** at every breakpoint. Existing input field names and cm-backed persistence are unchanged.
- Admin printable-order specifications display **Width** before **Length**, in inches.
- Admin jersey editor instructions list width/length.
- No migration is necessary. Deploy the site bundle to Cloudflare Pages and refresh the PWA.

The CSS retains the existing responsive grids; inspect desktop/tablet/mobile following deployment with your own catalogue content.
