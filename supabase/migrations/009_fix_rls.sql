-- ============================================================
-- Fix RLS policies that break GoTrue auth
-- The user_org_id() function in RLS causes "Database error
-- querying schema" during signInWithPassword.
-- Solution: simplify policies to use auth.uid() directly.
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Drop ALL existing policies first
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END;
$$;

-- ============================================================
-- Simple RLS policies using auth.uid() only
-- No circular dependencies, no complex functions in policies
-- ============================================================

-- Organizations: users see orgs they belong to
CREATE POLICY "org_select" ON organizations FOR SELECT
  USING (id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));
CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (true);
CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- Staff members: users see their own records + records in their org
CREATE POLICY "staff_select" ON staff_members FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "staff_insert" ON staff_members FOR INSERT
  WITH CHECK (true);
CREATE POLICY "staff_update" ON staff_members FOR UPDATE
  USING (user_id = auth.uid() OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- Buildings: users see buildings in their org
CREATE POLICY "buildings_all" ON buildings FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));
CREATE POLICY "buildings_insert" ON buildings FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- Floors: through building
CREATE POLICY "floors_all" ON floors FOR ALL
  USING (building_id IN (
    SELECT b.id FROM buildings b WHERE b.org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  ));

-- Rooms: through floor→building
CREATE POLICY "rooms_all" ON rooms FOR ALL
  USING (floor_id IN (
    SELECT f.id FROM floors f JOIN buildings b ON f.building_id = b.id
    WHERE b.org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  ));

-- Beds: through room→floor→building
CREATE POLICY "beds_all" ON beds FOR ALL
  USING (room_id IN (
    SELECT r.id FROM rooms r JOIN floors f ON r.floor_id = f.id JOIN buildings b ON f.building_id = b.id
    WHERE b.org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  ));

-- Simple org-scoped tables
CREATE POLICY "tenants_all" ON tenants FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "occupancies_all" ON occupancies FOR ALL
  USING (true);

CREATE POLICY "invoices_all" ON invoices FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "payments_all" ON payments FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "expenses_all" ON expenses FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "complaints_all" ON complaints FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "meal_optouts_all" ON meal_optouts FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "messages_all" ON messages FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "advance_bookings_all" ON advance_bookings FOR ALL
  USING (true);
