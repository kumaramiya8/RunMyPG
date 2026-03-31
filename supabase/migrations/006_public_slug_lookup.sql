-- ============================================================
-- Public function to look up organization by slug
-- Needed because login happens BEFORE auth, so RLS blocks direct queries
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_org_by_slug(p_slug TEXT)
RETURNS TABLE (id UUID, account_type TEXT) AS $$
  SELECT id, account_type
  FROM public.organizations
  WHERE account_slug = p_slug
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
