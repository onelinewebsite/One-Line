# v217 - Persistent catalogue cache and SEO

- Deploy the `One-Line-main` folder contents to Cloudflare Pages/GitHub.
- No SQL changes; no Edge Function redeployment required.
- Public catalogue uses IndexedDB snapshots; new visitors see a short loader until initial network fetch. Returning visitors see the last published catalogue while fetching current rows.
- Public snapshots contain only catalogue and categories; account/cart/order information is never in the public snapshot.
- The per-tab cart preview is user scoped and cannot be used as checkout authority. Checkout rechecks stock and price on the server.
- Updates still fetch paginated public catalogue data; the UI only rerenders when published contents differ. This is not yet a backend change-feed / delta API.
- SEO adds six crawlable, factual landing pages, new page titles/descriptions/canonical/organization data, and sitemap/robots. No keyword stuffing.
- Submit `https://onelinesmart.com/sitemap.xml` in Google Search Console and request indexing of the new pages. Rankings are not guaranteed.
- Verify returning customer navigation with network throttled/offline, cart sync, search, added/removed items, logout, and checkout.
