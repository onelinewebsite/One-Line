-- One-Line v51 — server permission alignment + Storage cleanup support
-- Run ONCE after deploying v51. Safe to run again.

-- Admin + Management can add/edit Ready Made categories.
-- Destructive category deletion remains Admin-only.
drop policy if exists "categories admin write" on public.categories;
drop policy if exists "categories manage insert" on public.categories;
drop policy if exists "categories manage update" on public.categories;
drop policy if exists "categories admin delete" on public.categories;
create policy "categories manage insert" on public.categories for insert
with check(public.has_role(array['admin','management']));
create policy "categories manage update" on public.categories for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));
create policy "categories admin delete" on public.categories for delete
using(public.has_role(array['admin']));

-- Subcategories follow the same add/edit rule. Delete remains Admin-only.
drop policy if exists "subcategories admin write" on public.subcategories;
drop policy if exists "subcategories manage insert" on public.subcategories;
drop policy if exists "subcategories manage update" on public.subcategories;
drop policy if exists "subcategories admin delete" on public.subcategories;
create policy "subcategories manage insert" on public.subcategories for insert
with check(public.has_role(array['admin','management']));
create policy "subcategories manage update" on public.subcategories for update
using(public.has_role(array['admin','management'])) with check(public.has_role(array['admin','management']));
create policy "subcategories admin delete" on public.subcategories for delete
using(public.has_role(array['admin']));

-- Ensure Admin + Management can remove uploaded files from the product image bucket.
drop policy if exists "portal image deletes" on storage.objects;
create policy "portal image deletes" on storage.objects for delete
using(bucket_id='product-images' and public.has_role(array['admin','management']));
