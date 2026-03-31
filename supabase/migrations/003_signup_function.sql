-- ============================================================
-- Signup helper function
-- Bypasses RLS to create org + owner during signup
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_org_and_owner(
  p_org_name TEXT,
  p_owner_name TEXT,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name, owner_id)
  VALUES (p_org_name, p_user_id)
  RETURNING id INTO v_org_id;

  -- Create owner staff record
  INSERT INTO public.staff_members (
    org_id, user_id, name, role,
    can_view_beds, can_manage_checkins, can_view_complaints,
    can_view_finances, can_manage_expenses, can_view_reports, is_active
  ) VALUES (
    v_org_id, p_user_id, p_owner_name, 'owner',
    true, true, true, true, true, true, true
  );

  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
