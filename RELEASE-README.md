# One-Line v48

## Changes in this build

- Custom Catalogue item cards now use a clean 1:1 image frame.
- Custom Catalogue item detail images are edge-to-edge inside the media area, 100% width and 1:1 on mobile and larger screens. Any uploaded source image ratio is accepted and displayed with a cover crop.
- The home “View catalogue” action now has a dedicated premium button style.
- Customer-side routing now stores the selected product/category/custom-category/custom-item in the URL/history state. Refresh keeps the current page instead of falling back to the parent catalogue.
- Browser Back continues through the actual in-site navigation history.
- Cache/service-worker build bumped to v48.

## Database

There is **no new SQL migration for v48**. If `RUN-NEXT-v47.sql` was already applied, do not run it again. A fresh project that has never received the Custom Catalogue schema still needs `RUN-NEXT-v47.sql` once.

## Deploy

Upload the complete v48 build and wait for the hosting deployment to finish. Refresh the site once; the v48 service worker removes the older application cache.
