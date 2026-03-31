-- ============================================================
-- Payment system enhancements
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add payment_type to payments for tracking deposit vs rent vs advance
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'rent'
  CHECK (payment_type IN ('rent', 'deposit', 'advance', 'refund', 'other'));

-- 2. Add deposit_paid tracking to occupancies (actual amount collected)
ALTER TABLE occupancies ADD COLUMN IF NOT EXISTS deposit_paid DECIMAL(10,2) DEFAULT 0;

-- 3. Add receipt settings to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS receipt_header TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS receipt_footer TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS receipt_show_gst BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS receipt_prefix TEXT DEFAULT 'RCP';

-- 4. Add amount_paid to invoices to track partial payments
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;

-- 5. Function to generate next invoice number
CREATE OR REPLACE FUNCTION public.next_invoice_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM invoices WHERE org_id = p_org_id;
  RETURN 'INV-' || to_char(now(), 'YYYY') || '-' || lpad(v_count::text, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Function to generate next receipt number
CREATE OR REPLACE FUNCTION public.next_receipt_number(p_org_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_count INT;
BEGIN
  SELECT COALESCE(receipt_prefix, 'RCP') INTO v_prefix FROM organizations WHERE id = p_org_id;
  SELECT COUNT(*) + 1 INTO v_count FROM payments WHERE org_id = p_org_id;
  RETURN v_prefix || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_count::text, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
