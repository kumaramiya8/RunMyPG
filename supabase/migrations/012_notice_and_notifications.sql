-- ============================================================
-- Notice policy + notification improvements
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add notice policy settings to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS notice_period_days INT DEFAULT 30;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_deposit_months INT DEFAULT 1;

-- 2. Add notification table for in-app notifications (separate from WhatsApp messages)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('staff', 'tenant', 'all')),
  recipient_id UUID, -- staff_member id or tenant id
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'payment', 'receipt', 'reminder', 'notice', 'complaint', 'broadcast')),
  read BOOLEAN DEFAULT false,
  link TEXT, -- optional link to navigate to
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON notifications(org_id);

-- 3. RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications FOR SELECT
  USING (
    recipient_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR recipient_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
    OR (recipient_type = 'all' AND org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()))
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_insert" ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_update" ON notifications FOR UPDATE
  USING (
    recipient_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
    OR recipient_id IN (SELECT id FROM staff_members WHERE user_id = auth.uid())
    OR org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid())
  );
