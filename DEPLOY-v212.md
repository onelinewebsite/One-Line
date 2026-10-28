# One-Line v212 - Order PDF and historical photos

1. Unzip the package. Upload the contents of One-Line-main/ to the root of the website repository.
2. Deploy via Cloudflare Pages. No new SQL or Edge Function deployment is required.
3. In a customer order, click **Download as PDF**. The printable A4 order shows the item photo(s), order code, delivery details, table, totals, and One-Line return address at bottom-right.
4. Check both customer Orders and Admin Orders: item title, quantity, selected variant/size, and purchase-time photo should be based on saved order_items, not the current catalogue.
5. Test on a disposable test item: place an order, delete the item from the catalogue, reopen the order, and download the PDF. Item record and saved image should persist.

## Historical images and storage

- The existing place-order function already stores a product photo and custom/variant image URLs in the order_items.design_json snapshot.
- v212 disables physical Supabase Storage deletion by the website's image-delete helpers, including when an admin removes or replaces catalogue images. This means the photo disappears from the catalogue but its public URL keeps working for historical orders.
- **Storage usage will increase** because detached images remain in the bucket. Do not manually delete stored files still used by any order. Storage retention also depends on continued Supabase project/bucket availability.
- Images physically deleted *before* this update cannot be restored by a frontend change. Restore them from a backup to the same storage URL, if available.
- Existing order_items use `product_id ... on delete set null` in the included schema, so deleting the product itself does not delete the order line. If your deployed database schema differs, verify its foreign-key deletion rule first.
- Existing stock/checkout logic, pricing, categories, admin adding forms, and SQL were not edited.
