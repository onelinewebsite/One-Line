-- One-Line v117: unlisted/shareable categories (run once in Supabase SQL Editor)
-- 'Visible' categories are shown on the normal public catalogue.
-- 'Shareable' hidden categories can be opened using their unlisted URL.
-- This is unlisted-link access, NOT password-protected or secret access.
ALTER TABLE public.custom_catalog_categories ADD COLUMN IF NOT EXISTS shareable boolean NOT NULL DEFAULT true;

-- Rename the original Kids Uniform category without disturbing its ID/items.
DO $$
DECLARE old_id uuid; new_id uuid;
BEGIN
  SELECT id INTO old_id FROM public.custom_catalog_categories WHERE lower(trim(name))='kids uniform' LIMIT 1;
  SELECT id INTO new_id FROM public.custom_catalog_categories WHERE lower(trim(name))='uniform' LIMIT 1;
  IF old_id IS NOT NULL THEN
    IF new_id IS NOT NULL AND new_id <> old_id THEN
      UPDATE public.custom_catalog_items SET category_id=new_id WHERE category_id=old_id;
      DELETE FROM public.custom_catalog_categories WHERE id=old_id;
    ELSE
      UPDATE public.custom_catalog_categories SET name='Uniform',updated_at=now() WHERE id=old_id;
    END IF;
  END IF;
END $$;

DROP POLICY IF EXISTS "public custom catalogue categories read" ON public.custom_catalog_categories;
CREATE POLICY "public custom catalogue categories read" ON public.custom_catalog_categories
  FOR SELECT USING(active OR shareable OR public.has_role(array['admin','management']));
DROP POLICY IF EXISTS "public custom catalogue items read" ON public.custom_catalog_items;
CREATE POLICY "public custom catalogue items read" ON public.custom_catalog_items
  FOR SELECT USING(
    public.has_role(array['admin','management'])
    OR (active AND EXISTS(
      SELECT 1 FROM public.custom_catalog_categories c
      WHERE c.id=category_id AND (c.active OR c.shareable)
    ))
  );
