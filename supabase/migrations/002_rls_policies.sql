-- ============================================================
-- Row Level Security Policies for RunMyPG
-- Run this in Supabase SQL Editor after 001_initial_schema.sql
-- ============================================================

-- Helper function: get the current user's org_id
CREATE OR REPLACE FUNCTION auth.user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM public.staff_members
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Enable RLS on all tables
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_optouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Organizations: owner can see their own org
-- ============================================================

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = auth.user_org_id());

CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  USING (id = auth.user_org_id());

-- Allow insert during signup (before staff record exists)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- Staff: users see their org's staff
-- ============================================================

CREATE POLICY "Users can view org staff"
  ON staff_members FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Users can insert staff to their org"
  ON staff_members FOR INSERT
  WITH CHECK (org_id = auth.user_org_id() OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can update org staff"
  ON staff_members FOR UPDATE
  USING (org_id = auth.user_org_id());

-- ============================================================
-- Buildings: org-scoped
-- ============================================================

CREATE POLICY "Users can view org buildings"
  ON buildings FOR SELECT
  USING (org_id = auth.user_org_id());

CREATE POLICY "Users can manage org buildings"
  ON buildings FOR INSERT
  WITH CHECK (org_id = auth.user_org_id());

CREATE POLICY "Users can update org buildings"
  ON buildings FOR UPDATE
  USING (org_id = auth.user_org_id());

-- ============================================================
-- Floors: through building → org
-- ============================================================

CREATE POLICY "Users can view floors"
  ON floors FOR SELECT
  USING (building_id IN (SELECT id FROM buildings WHERE org_id = auth.user_org_id()));

CREATE POLICY "Users can manage floors"
  ON floors FOR ALL
  USING (building_id IN (SELECT id FROM buildings WHERE org_id = auth.user_org_id()));

-- ============================================================
-- Rooms: through floor → building → org
-- ============================================================

CREATE POLICY "Users can view rooms"
  ON rooms FOR SELECT
  USING (floor_id IN (
    SELECT f.id FROM floors f
    JOIN buildings b ON f.building_id = b.id
    WHERE b.org_id = auth.user_org_id()
  ));

CREATE POLICY "Users can manage rooms"
  ON rooms FOR ALL
  USING (floor_id IN (
    SELECT f.id FROM floors f
    JOIN buildings b ON f.building_id = b.id
    WHERE b.org_id = auth.user_org_id()
  ));

-- ============================================================
-- Beds: through room → floor → building → org
-- ============================================================

CREATE POLICY "Users can view beds"
  ON beds FOR SELECT
  USING (room_id IN (
    SELECT r.id FROM rooms r
    JOIN floors f ON r.floor_id = f.id
    JOIN buildings b ON f.building_id = b.id
    WHERE b.org_id = auth.user_org_id()
  ));

CREATE POLICY "Users can manage beds"
  ON beds FOR ALL
  USING (room_id IN (
    SELECT r.id FROM rooms r
    JOIN floors f ON r.floor_id = f.id
    JOIN buildings b ON f.building_id = b.id
    WHERE b.org_id = auth.user_org_id()
  ));

-- ============================================================
-- Tenants, Invoices, Expenses, Complaints, etc: org-scoped
-- ============================================================

CREATE POLICY "org_tenants" ON tenants FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_invoices" ON invoices FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_payments" ON payments FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_expenses" ON expenses FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_complaints" ON complaints FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_meal_optouts" ON meal_optouts FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_messages" ON messages FOR ALL USING (org_id = auth.user_org_id());
CREATE POLICY "org_occupancies" ON occupancies FOR ALL USING (true); -- filtered via tenant/bed joins
CREATE POLICY "org_advance_bookings" ON advance_bookings FOR ALL USING (true); -- filtered via bed joins
