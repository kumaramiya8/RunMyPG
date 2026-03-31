-- ============================================================
-- Seed: Create Master User and Master Organization
-- Run this AFTER 004_master_and_accounts.sql
-- ============================================================

-- 1. Create master auth user (kumaramiya8@gmail.com / 94500019016@Dad)
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
ON CONFLICT (email) DO NOTHING;

-- 2. Create identity for the master user
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  u.id::text,
  now(),
  now(),
  now()
FROM auth.users u
WHERE u.email = 'kumaramiya8@gmail.com'
ON CONFLICT DO NOTHING;

-- 3. Create master organization
INSERT INTO organizations (id, name, owner_id, account_slug, account_type)
SELECT
  gen_random_uuid(),
  'RunMyPG Master',
  u.id,
  'runmypg',
  'master'
FROM auth.users u
WHERE u.email = 'kumaramiya8@gmail.com'
ON CONFLICT (account_slug) DO NOTHING;

-- 4. Create master staff record
INSERT INTO staff_members (
  org_id, user_id, name, role,
  can_view_beds, can_manage_checkins, can_view_complaints,
  can_view_finances, can_manage_expenses, can_view_reports, is_active
)
SELECT
  o.id,
  u.id,
  'Kumar Amiya',
  'owner',
  true, true, true, true, true, true, true
FROM auth.users u
JOIN organizations o ON o.owner_id = u.id AND o.account_slug = 'runmypg'
WHERE u.email = 'kumaramiya8@gmail.com'
ON CONFLICT DO NOTHING;
