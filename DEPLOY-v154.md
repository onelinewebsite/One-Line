# One-Line v154 — Mobile size-selection fix

## Install

1. Keep your existing Supabase schema, prior migrations and customer-event Edge Function from v153.
2. Deploy the complete contents of this ZIP, keeping the existing directory structure.
3. Reload the website / PWA; service worker cache is now `one-line-catalogue-v154`.

**No new SQL or Edge Function redeploy required** for this update. If v153 was not deployed yet, follow `DEPLOY-v153.md` to set up its Edge Function.

## Updated

- Jersey size/quantity row now uses a flexible size label and fixed, properly contained minus/number/plus stepper.
- Uniform and Ready Made variant size rows allow measurement and separately rated labels to wrap instead of pushing quantity selectors outside the viewport.
- At narrow widths, Uniform controls can move under size labels, keeping buttons accessible.
- Summary and size measurement text can wrap naturally.
- Admin Jersey size editor was regression-tested at small viewport widths (no code change needed).

## Local regression checks

Verified HTML/CSS layout in headless Chromium using representative Jersey and Uniform size rows at 280, 300, 320, 360, 375, 390, 430, 768px and Admin editor at 280–680px. The customer controls remained within their containers and the page viewport. Syntax and ZIP checks passed. This is not a verification against your live Supabase data or deployment.
