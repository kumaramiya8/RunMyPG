-- ============================================================
-- Tenant Portal - Database Changes
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Tenant user accounts (links auth.users to tenants)
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,  -- references auth.users
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON tenant_users(tenant_id);

-- 2. Enable RLS
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- 3. RLS: tenants see their own records, staff see their org's
CREATE POLICY "tenant_users_select" ON tenant_users FOR SELECT
  USING (user_id = auth.uid() OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));
CREATE POLICY "tenant_users_insert" ON tenant_users FOR INSERT
  WITH CHECK (true);
CREATE POLICY "tenant_users_update" ON tenant_users FOR UPDATE
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 4. Allow tenants to read their own data
CREATE POLICY "tenants_self_read" ON tenants FOR SELECT
  USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 5. Allow tenants to read their own occupancies
CREATE POLICY "occupancies_tenant_read" ON occupancies FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR true);  -- staff already have access via existing policy

-- 6. Allow tenants to read invoices for their occupancies
CREATE POLICY "invoices_tenant_read" ON invoices FOR SELECT
  USING (occupancy_id IN (
    SELECT o.id FROM occupancies o
    WHERE o.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  ) OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 7. Allow tenants to read their payments
CREATE POLICY "payments_tenant_read" ON payments FOR SELECT
  USING (occupancy_id IN (
    SELECT o.id FROM occupancies o
    WHERE o.tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
  ) OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 8. Allow tenants to create complaints
CREATE POLICY "complaints_tenant_create" ON complaints FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 9. Allow tenants to read their complaints
CREATE POLICY "complaints_tenant_read" ON complaints FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 10. Allow tenants to manage their meal optouts
CREATE POLICY "meal_optouts_tenant" ON meal_optouts FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 11. Allow tenants to read messages sent to them or to all
CREATE POLICY "messages_tenant_read" ON messages FOR SELECT
  USING (recipient_type = 'all'
    OR (recipient_type = 'tenant' AND recipient_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()))
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 12. Function to get tenant auth info (for login)
CREATE OR REPLACE FUNCTION public.get_tenant_info(p_user_id UUID, p_org_id UUID)
RETURNS TABLE (
  tenant_user_id UUID,
  tenant_id UUID,
  tenant_name TEXT,
  org_name TEXT,
  account_slug TEXT
) AS $$
  SELECT
    tu.id AS tenant_user_id,
    tu.tenant_id,
    t.full_name AS tenant_name,
    o.name AS org_name,
    o.account_slug
  FROM tenant_users tu
  JOIN tenants t ON t.id = tu.tenant_id
  JOIN organizations o ON o.id = tu.org_id
  WHERE tu.user_id = p_user_id AND tu.org_id = p_org_id AND tu.is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
