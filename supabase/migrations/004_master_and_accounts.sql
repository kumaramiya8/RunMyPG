-- ============================================================
-- Migration 004: Master Dashboard + Account System
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add account fields to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS account_slug TEXT UNIQUE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'pg' CHECK (account_type IN ('master', 'pg'));

-- 2. Add settings columns to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS auto_rent_reminders BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS whatsapp_receipts BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS meal_notifications BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS complaint_alerts BOOLEAN DEFAULT true;

-- 3. Update the signup function to accept account_slug
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

-- 4. Master admin function: create PG account with owner auth user
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
  -- Create auth user via Supabase admin
  v_user_id := (
    SELECT id FROM auth.users WHERE email = p_owner_email
  );

  -- If user doesn't exist, create via internal API
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at, confirmation_token,
      raw_app_meta_data, raw_user_meta_data
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_owner_email,
      crypt(p_owner_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb
    )
    RETURNING id INTO v_user_id;

    -- Create identity record
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', p_owner_email),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
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

-- 5. Master delete account function
CREATE OR REPLACE FUNCTION public.master_delete_account(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.organizations WHERE id = p_org_id AND account_type = 'pg';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to get all accounts (for master dashboard)
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
