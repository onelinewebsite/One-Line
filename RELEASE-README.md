# OneLine v36 — sleeve alignment + menu/quantity/customizer polish

This build continues from the selected v35 full project and keeps the existing Supabase, OTP, catalogue, cart, team-order and role-portal architecture.

## v36 changes
- Re-centered both **Left sleeve** and **Right sleeve** customization views. The sleeve artwork area now sits on the visible sleeve instead of being offset to the wrong side.
- Simplified **Size quantities**: removed the top, bottom, outer and between-size divider lines; kept a clean single control surface with soft quantity inputs.
- Mobile/tablet menu now has **sharp full-height edges** (no curved outer drawer edge), a larger close control, touch scrolling, extra bottom scroll room and safe-area padding.
- Menu actions now dismiss the open drawer when the selected destination/action opens. Browser Back continues to close an open drawer first.
- Removed the fixed **50px text size cap** and other visual max-size constraints for custom text/artwork. The size ranges expand as needed and corner-handle resizing is not capped at the old limit.
- Removed the instruction below the garment that said to drag a print layer / use the corner handle or controls.
- Added a small **Developed by Quartz Web Solutions** link to the customer footer, customizer bottom and role portals.
- Cache/build bumped to **v36**.

## Existing fixes retained
- Current-screen OTP/login modal without jumping the user back to Home.
- Mobile/tablet drawer design and header profile-icon removal from v35.
- Accurate canvas-based garment recolouring.
- Per-size custom-order quantities.
- Old-style main-page customization section.
- Cart SVG icons, cleaned catalogue/categories view and team-order naming changes.
