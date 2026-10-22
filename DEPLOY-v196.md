# One-Line v196 - Customer delivery date and compact PDF

Based on complete v195 project.

- Customers see the admin-set `metadata.expected_delivery_date` in Order Details when one exists.
- Customer Download PDF and Share PDF use the same compact, image-free A4 order summary with order items, variants, sizes, print details, recipient, and totals. Long orders paginate instead of cropping content. Admin Share Quotation continues to use this shared customer PDF. Existing admin shipping-label PDF is unchanged.
- Both customer Download and Share use `ONELINE-<delivery recipient name>-<YYYY-MM-DD>-<HH-mm>.pdf`. Order timestamp uses Asia/Kolkata 24-hour time. Filename strips unsupported path characters; a missing order timestamp is shown as DATE-UNKNOWN, not the current time.
- No Supabase database migration or Edge Function change. Deploy frontend files and update PWA cache.
