# One-Line v163 — Admin Save fix

Base: v162. No SQL or Edge Function change needed.

- Removed duplicate `Save variant setup` button.
- One floating `Save` button on existing and new Custom Catalogue / Ready Made variant editors.
- Fixed non-clickable floating Save caused by parent CSS pointer-event rules.
- Native form submission performs the complete `customItemPayload` save, including variant names, descriptions, images, sizes, stock, measurements, rates, and private details.
- Prevents duplicate submissions and displays `Saving…` while request is pending.
- Existing items remain in the editor with a save confirmation. New items return to the list after creation.
- The underlying validation and Supabase upsert are unchanged.

Deploy all the files to the current website, refresh the Admin page, and test one item with a changed size/stock followed by a reload. No SQL needed.
