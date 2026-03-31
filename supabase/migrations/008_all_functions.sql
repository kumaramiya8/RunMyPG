-- ============================================================
-- ALL FUNCTIONS FOR RUNMYPG
-- Run this single file in Supabase SQL Editor
-- It creates/replaces ALL needed functions
-- ============================================================

-- 1. Look up org by slug (used during login BEFORE auth)
CREATE OR REPLACE FUNCTION public.get_org_by_slug(p_slug TEXT)
RETURNS TABLE (id UUID, account_type TEXT) AS $$
  SELECT id, account_type
  FROM public.organizations
  WHERE account_slug = p_slug
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Get staff+org info for a user (used after login)
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

-- 3. Verify user belongs to a specific org (used during login)
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

-- 4. Get current user's org_id (used by RLS policies)
CREATE OR REPLACE FUNCTION public.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.staff_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 5. Get all PG accounts (used by master dashboard)
CREATE OR REPLACE FUNCTION public.get_all_accounts()
RETURNS TABLE (
  id UUID,
  name TEXT,
  account_slug TEXT,
  account_type TEXT,
  owner_name TEXT,
  owner_email TEXT,
  created_at TIMESTAMPTZ,
  tenant_count BIGINT,
  bed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.account_slug,
    o.account_type,
    sm.name AS owner_name,
    au.email AS owner_email,
    o.created_at,
    (SELECT COUNT(*) FROM tenants t WHERE t.org_id = o.id) AS tenant_count,
    (SELECT COUNT(*) FROM beds b
     JOIN rooms r ON b.room_id = r.id
     JOIN floors f ON r.floor_id = f.id
     JOIN buildings bl ON f.building_id = bl.id
     WHERE bl.org_id = o.id) AS bed_count
  FROM organizations o
  LEFT JOIN staff_members sm ON sm.org_id = o.id AND sm.role = 'owner'
  LEFT JOIN auth.users au ON au.id = sm.user_id
  WHERE o.account_type = 'pg'
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a PG account from master dashboard
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

  -- Create auth user if not exists
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

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

-- 7. Delete a PG account from master dashboard
CREATE OR REPLACE FUNCTION public.master_delete_account(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete staff records first
  DELETE FROM public.staff_members WHERE org_id = p_org_id;
  -- Delete the organization (cascades to buildings, floors, rooms, beds, etc.)
  DELETE FROM public.organizations WHERE id = p_org_id AND account_type = 'pg';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create org + owner during signup
CREATE OR REPLACE FUNCTION public.create_org_and_owner(
  p_org_name TEXT,
  p_owner_name TEXT,
  p_user_id UUID,
  p_account_slug TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  INSERT INTO public.organizations (name, owner_id, account_slug, account_type)
  VALUES (p_org_name, p_user_id, p_account_slug, 'pg')
  RETURNING id INTO v_org_id;

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
