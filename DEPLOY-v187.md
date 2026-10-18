# One-Line v187 — Print guide and info-icon positioning

Based on complete v186 project. Only requested print-guide/image removal and print-info icon placement were changed.

- **ONE-LINE · PRINT DETAILS**: image panels, photo credit/details and photo introduction removed. All method titles, descriptions, and #dtf/#embroidery/#sublimation/#screen-print/#other-print links remain.
- **Print cards**: the small info (!) button sits directly next to the print name, while the selection +/- check stays on the right. Both remain independently clickable.
- New cache `one-line-catalogue-v187` and versioned CSS/app scripts.

## Deploy

Deploy project contents on Cloudflare Pages. Allow the updated service worker to activate; refresh an installed PWA if old markup persists.

No database migration or Edge Function deployment required for these UI-only changes.
