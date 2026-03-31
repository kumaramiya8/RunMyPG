-- ============================================================
-- Seed: Create Master User and Master Organization
-- Run this AFTER 004_master_and_accounts.sql
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  -- 1. Check if master user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'kumaramiya8@gmail.com';

  -- 2. Create master auth user if not exists
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
      'kumaramiya8@gmail.com',
      crypt('94500019016@Dad', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Kumar Amiya"}'::jsonb
    )
    RETURNING id INTO v_user_id;

    -- Create identity record
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'kumaramiya8@gmail.com'),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;

  -- 3. Create master organization if not exists
  SELECT id INTO v_org_id FROM organizations WHERE account_slug = 'runmypg';

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, owner_id, account_slug, account_type)
    VALUES ('RunMyPG Master', v_user_id, 'runmypg', 'master')
    RETURNING id INTO v_org_id;
  END IF;

  -- 4. Create master staff record if not exists
  IF NOT EXISTS (
    SELECT 1 FROM staff_members WHERE user_id = v_user_id AND org_id = v_org_id
  ) THEN
    INSERT INTO staff_members (
      org_id, user_id, name, role,
      can_view_beds, can_manage_checkins, can_view_complaints,
      can_view_finances, can_manage_expenses, can_view_reports, is_active
    ) VALUES (
      v_org_id, v_user_id, 'Kumar Amiya', 'owner',
      true, true, true, true, true, true, true
    );
  END IF;

  RAISE NOTICE 'Master user created: user_id=%, org_id=%', v_user_id, v_org_id;
END;
$$;
