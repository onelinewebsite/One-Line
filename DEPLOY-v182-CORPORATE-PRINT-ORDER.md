# One-Line v182 — Corporate Tee Shirt selector placement

Based on v181 with one customer-page layout correction only.

In Custom Catalogue → Corporate Tee Shirt, the original order is now Fabric, Quality, Rate, **Print selection (including multiple types and per-print sizes/quantities)**, **Garment Sizes & quantity**, and **Order total**. The garment Type selector stays hidden only for Corporate Tee Shirt.

Both legacy Corporate Tee Shirt editor modes (T-shirt and Jersey) use this same ordering. All other custom catalogue and ready stock categories are unchanged. Multi-print selections, garment size selection, per-size rates, existing inch measurements, validation, enquiries, and checkout remain intact.

**Deploy:** Upload the complete folder to Cloudflare Pages. Service worker and app script revisions are bumped to v182 to prevent stale page code. No new SQL or Edge Function deployment is required for this display-only change, assuming v181 dependencies were already deployed.
