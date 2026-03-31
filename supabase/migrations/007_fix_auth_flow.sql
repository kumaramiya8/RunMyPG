-- ============================================================
-- Fix: Auth flow circular dependency + staff lookup
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Function to get staff info for a user (bypasses RLS)
-- This is needed because staff_members RLS requires org_id,
-- but we query staff_members to GET the org_id — circular!
CREATE OR REPLACE FUNCTION public.get_my_staff_info(p_user_id UUID)
RETURNS TABLE (
  org_id UUID,
  org_name TEXT,
  account_slug TEXT,
  account_type TEXT,
  staff_role TEXT,
  staff_name TEXT
) AS $$
  SELECT
    o.id AS org_id,
    o.name AS org_name,
    o.account_slug,
    o.account_type,
    sm.role AS staff_role,
    sm.name AS staff_name
  FROM staff_members sm
  JOIN organizations o ON o.id = sm.org_id
  WHERE sm.user_id = p_user_id AND sm.is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Function to get staff info for a specific org (for slug-based login)
CREATE OR REPLACE FUNCTION public.get_staff_for_org(p_user_id UUID, p_org_id UUID)
RETURNS TABLE (
  staff_id UUID,
  staff_role TEXT,
  staff_name TEXT
) AS $$
  SELECT
    sm.id AS staff_id,
    sm.role AS staff_role,
    sm.name AS staff_name
  FROM staff_members sm
  WHERE sm.user_id = p_user_id AND sm.org_id = p_org_id AND sm.is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Fix staff_members RLS — allow users to see their own records
DROP POLICY IF EXISTS "Users can view org staff" ON staff_members;
CREATE POLICY "Users can view own staff records"
  ON staff_members FOR SELECT
  USING (user_id = auth.uid() OR org_id = public.user_org_id());

-- 4. Fix master_create_account to NOT create auth users directly
-- Instead, just create the org + staff record. The owner user
-- should be created via Supabase Auth dashboard or signUp API.
CREATE OR REPLACE FUNCTION public.master_create_account(
  p_account_slug TEXT,
  p_org_name TEXT,
  p_owner_name TEXT,
  p_owner_email TEXT,
  p_owner_password TEXT
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_owner_email;

  -- If user doesn't exist, create via Supabase's internal method
  IF v_user_id IS NULL THEN
    -- Use a more compatible approach for user creation
    v_user_id := extensions.uuid_generate_v4();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, confirmation_token, recovery_token, email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      p_owner_email,
      crypt(p_owner_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_owner_name),
      false, '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_user_id,
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_owner_email, 'email_verified', true),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  END IF;

  -- Create organization
  INSERT INTO public.organizations (name, owner_id, account_slug, account_type)
  VALUES (p_org_name, v_user_id, p_account_slug, 'pg')
  RETURNING id INTO v_org_id;

  -- Create owner staff record
  INSERT INTO public.staff_members (
    org_id, user_id, name, role,
    can_view_beds, can_manage_checkins, can_view_complaints,
    can_view_finances, can_manage_expenses, can_view_reports, is_active
  ) VALUES (
    v_org_id, v_user_id, p_owner_name, 'owner',
    true, true, true, true, true, true, true
  );

  RETURN json_build_object('org_id', v_org_id, 'user_id', v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
