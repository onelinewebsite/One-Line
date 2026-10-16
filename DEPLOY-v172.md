# One-Line v172 — Share actual design PNG + link to fresh Designer

## Changed
- Designer Share uses the actual rendered transparent garment PNG as a file attachment where Web Share file support exists.
- The same share includes a short promotional message and `https://onelinesmart.com/#customize`. The link opens the Designer normally; it **does not** restore the shared creation.
- No editable design snapshot, Supabase storage write, `/api/share-design`, or service-role key is used.
- On browsers without native file-share support, the PNG is downloaded and the promotional text/link copied for manual attachment.
- Item and category share links still use their own existing card/category images in OG previews.
- Old `/share/design/<id>` links now redirect to the regular fresh Designer, with no saved content restoration.

## Setup
1. Deploy the whole ZIP to Cloudflare Pages, including `functions/share/[[path]].js` for item/category social previews.
2. No new Supabase SQL or Edge Function is required for this sharing change.
3. No `SUPABASE_SERVICE_ROLE_KEY` is needed for Designer sharing. If the key was added only for v170 Designer sharing, you can remove it from Cloudflare Pages Variables and Secrets.
4. Cloudflare Pages Functions are still required **for item/category dynamic OG previews**, but these use a public key under catalogue RLS rules and do not require the service-role key.

## Note
- The share link alone displays the ordinary website preview/logo; the *actual design is the attached PNG*. A unique design image as the link's social preview would require hosting an image and a public preview page.
- Native file sharing and social-app behavior vary; on unsupported browsers users must attach the downloaded PNG themselves.
- Previously stored v170 designer snapshots can remain in Supabase but are no longer needed. No data deletion is performed.
