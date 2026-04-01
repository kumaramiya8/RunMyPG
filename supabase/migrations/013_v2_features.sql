-- ============================================================
-- V2 Features: Lock-in, Booking, Gender, Room Type, Amenities,
-- Logo, Pro-rata, Payment Calendar
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Organization settings for deposit, booking, lock-in
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_deposit_months INT DEFAULT 1;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS pro_rata_first_month BOOLEAN DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_lockin_months INT DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS lockin_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS booking_fee_enabled BOOLEAN DEFAULT false;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS default_booking_fee DECIMAL(10,2) DEFAULT 2000;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Room type (female_only, male_only, co_living)
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS room_type TEXT DEFAULT 'co_living'
  CHECK (room_type IN ('male_only', 'female_only', 'co_living'));

-- 3. Tenant gender
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- 4. Lock-in on occupancy
ALTER TABLE occupancies ADD COLUMN IF NOT EXISTS lockin_months INT DEFAULT 0;
ALTER TABLE occupancies ADD COLUMN IF NOT EXISTS lockin_end_date DATE;

-- 5. Advance bookings enhancements
ALTER TABLE advance_bookings ADD COLUMN IF NOT EXISTS booking_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE advance_bookings ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- 6. Custom amenities table
CREATE TABLE IF NOT EXISTS custom_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Star',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amenities_org" ON custom_amenities FOR ALL
  USING (org_id IN (SELECT org_id FROM staff_members WHERE user_id = auth.uid()));

-- 7. Room-amenity junction (for custom amenities)
CREATE TABLE IF NOT EXISTS room_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES custom_amenities(id) ON DELETE CASCADE,
  UNIQUE(room_id, amenity_id)
);

ALTER TABLE room_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room_amenities_all" ON room_amenities FOR ALL USING (true);

-- 8. Monthly rent auto-generation function
CREATE OR REPLACE FUNCTION public.generate_monthly_invoices(p_org_id UUID)
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_occ RECORD;
  v_invoice_exists BOOLEAN;
  v_period_start DATE;
  v_period_end DATE;
  v_due_date DATE;
  v_gst_enabled BOOLEAN;
  v_gst_amount DECIMAL;
  v_total DECIMAL;
BEGIN
  -- Get org GST setting
  SELECT gst_enabled INTO v_gst_enabled FROM organizations WHERE id = p_org_id;

  -- Current month period
  v_period_start := date_trunc('month', CURRENT_DATE)::date;
  v_period_end := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;

  -- Loop through active occupancies
  FOR v_occ IN
    SELECT o.id, o.monthly_rent, o.rent_due_day, o.tenant_id
    FROM occupancies o
    JOIN tenants t ON t.id = o.tenant_id AND t.org_id = p_org_id
    WHERE o.status IN ('active', 'notice_period')
  LOOP
    -- Check if invoice already exists for this month
    SELECT EXISTS(
      SELECT 1 FROM invoices
      WHERE occupancy_id = v_occ.id
        AND period_start = v_period_start
    ) INTO v_invoice_exists;

    IF NOT v_invoice_exists THEN
      v_due_date := make_date(
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        EXTRACT(MONTH FROM CURRENT_DATE)::int,
        LEAST(v_occ.rent_due_day, 28)
      );

      v_gst_amount := CASE WHEN v_gst_enabled THEN ROUND(v_occ.monthly_rent * 0.18) ELSE 0 END;
      v_total := v_occ.monthly_rent + v_gst_amount;

      INSERT INTO invoices (
        org_id, occupancy_id, invoice_number,
        period_start, period_end, base_amount, gst_amount, total_amount,
        due_date, status, amount_paid
      ) VALUES (
        p_org_id, v_occ.id,
        'INV-' || to_char(CURRENT_DATE, 'YYYYMM') || '-' || lpad((v_count + 1)::text, 4, '0'),
        v_period_start, v_period_end, v_occ.monthly_rent, v_gst_amount, v_total,
        v_due_date, 'pending', 0
      );

      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RLS for advance_bookings
DROP POLICY IF EXISTS "org_advance_bookings" ON advance_bookings;
CREATE POLICY "advance_bookings_all" ON advance_bookings FOR ALL USING (true);
