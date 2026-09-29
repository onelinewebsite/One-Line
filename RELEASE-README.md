# One-Line v49

This build polishes the customer catalogue and simplifies Admin / Management workflows.

## Customer updates
- The homepage **View catalogue** action has compact, balanced padding and spacing.
- Category images use a consistent **3:4 portrait** frame.
- Custom Catalogue item detail images use their real uploaded ratio, fill the available width, and are never cropped.
- Item detail share actions sit beside the item name.
- Full site navigation is shown only on main browsing pages. Inner pages use a simple top-left Back button.
- Customer and portal images load progressively in **20-image batches**. Cards show a subtle skeleton glow until their image loads.
- Initial/live data loading uses a simple three-dot animation.

## Admin / Management updates
- Categories have their own manager. When creating one, choose **Ready Made** or **Customizable** and it is saved to the matching catalogue.
- Ready Made and Custom Catalogue item editors remain separate.
- B2B is intentionally simple: choose a category, add a name, description and one or more images. The customer sees an enquiry-only item page.
- Controls and forms are larger and cleaner on phones.

## Database
No new SQL migration is required for v49. Keep the existing v47/v46 schema already installed.

Upload the complete v49 build. The service worker cache name has changed, so old v48 assets are discarded after the new deployment is loaded.
