-- ============================================================
-- PG SaaS - Database Schema
-- Backend: Supabase (PostgreSQL)
--
-- Why Supabase over Firebase?
-- 1. Relational data (buildings→floors→rooms→beds→tenants) maps
--    naturally to PostgreSQL foreign keys and joins.
-- 2. Row Level Security lets us restrict wardens/accountants
--    to only what they should see — no custom middleware.
-- 3. Real-time subscriptions for the live bed availability map.
-- 4. Edge Functions for WhatsApp integrations and Aadhaar API.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROPERTY MODULE
-- ============================================================

-- Organization / Owner account
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,  -- references auth.users
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  gst_enabled BOOLEAN DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Buildings (e.g., "Block A", "Main Building")
CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Floors within a building
CREATE TABLE floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,           -- "Ground Floor", "1st Floor"
  floor_number INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rooms on a floor
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,            -- "Room 101"
  room_number TEXT NOT NULL,
  has_ac BOOLEAN DEFAULT false,
  has_attached_bathroom BOOLEAN DEFAULT false,
  has_balcony BOOLEAN DEFAULT false,
  has_tv BOOLEAN DEFAULT false,
  base_rent DECIMAL(10,2),       -- default rent for beds in this room
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual beds within a room
CREATE TABLE beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,      -- "Bed A", "Bed 1"
  status TEXT NOT NULL DEFAULT 'vacant'
    CHECK (status IN ('vacant', 'occupied', 'notice', 'blocked', 'maintenance')),
  monthly_rent DECIMAL(10,2),    -- overrides room base_rent if set
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Advance bookings / token payments
CREATE TABLE advance_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  token_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  expected_checkin DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'checked_in')),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 2. TENANT MODULE
-- ============================================================

-- Tenant profiles
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,

  -- Aadhaar verification
  aadhaar_number TEXT,
  aadhaar_verified BOOLEAN DEFAULT false,
  aadhaar_name TEXT,
  aadhaar_dob DATE,
  aadhaar_address TEXT,

  -- Emergency contacts
  father_name TEXT,
  father_phone TEXT,
  mother_name TEXT,
  mother_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,

  -- Work / Study
  occupation TEXT,                -- "Working", "Student"
  company_or_college TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Occupancy records (check-in / check-out history)
CREATE TABLE occupancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bed_id UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
  checkin_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  checkout_at TIMESTAMPTZ,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_returned DECIMAL(10,2) DEFAULT 0,
  rent_due_day INT NOT NULL DEFAULT 1 CHECK (rent_due_day BETWEEN 1 AND 28),
  monthly_rent DECIMAL(10,2) NOT NULL,
  notice_date DATE,               -- when tenant gave notice
  expected_vacate_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'notice_period', 'checked_out')),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 3. FINANCIAL MODULE
-- ============================================================

-- Rent invoices (generated monthly per occupancy)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupancy_id UUID NOT NULL REFERENCES occupancies(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount DECIMAL(10,2) NOT NULL,
  gst_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'partially_paid', 'overdue')),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Payment records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  occupancy_id UUID NOT NULL REFERENCES occupancies(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash'
    CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'card', 'other')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  transaction_ref TEXT,           -- UPI transaction ID, etc.
  receipt_url TEXT,               -- generated PDF receipt link
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
  category TEXT NOT NULL,         -- "Water", "Electricity", "Food", "Maintenance", "Wi-Fi", "Other"
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_by UUID,                 -- references auth.users (warden/staff)
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 4. OPERATIONS MODULE
-- ============================================================

-- Food opt-out (meal skip tracking)
CREATE TABLE meal_optouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (tenant_id, meal_date, meal_type)
);

-- Maintenance complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  category TEXT NOT NULL,         -- "Electrical", "Plumbing", "Furniture", "Cleaning", "Other"
  description TEXT NOT NULL,
  photo_url TEXT,
  priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to TEXT,               -- name of person assigned
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 5. STAFF & ACCESS MODULE
-- ============================================================

-- Staff members with role-based access
CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,          -- references auth.users
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'warden'
    CHECK (role IN ('owner', 'manager', 'warden', 'accountant', 'cook')),
  -- Granular permissions
  can_view_beds BOOLEAN DEFAULT true,
  can_manage_checkins BOOLEAN DEFAULT true,
  can_view_complaints BOOLEAN DEFAULT true,
  can_view_finances BOOLEAN DEFAULT false,
  can_manage_expenses BOOLEAN DEFAULT false,
  can_view_reports BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- WhatsApp message log
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('tenant', 'all', 'building', 'floor')),
  recipient_id UUID,              -- tenant_id, building_id, or floor_id
  message_type TEXT NOT NULL,     -- "rent_reminder", "announcement", "complaint_update"
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_beds_room_id ON beds(room_id);
CREATE INDEX idx_beds_status ON beds(status);
CREATE INDEX idx_occupancies_tenant_id ON occupancies(tenant_id);
CREATE INDEX idx_occupancies_bed_id ON occupancies(bed_id);
CREATE INDEX idx_occupancies_status ON occupancies(status);
CREATE INDEX idx_invoices_occupancy_id ON invoices(occupancy_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_occupancy_id ON payments(occupancy_id);
CREATE INDEX idx_expenses_org_id ON expenses(org_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_complaints_org_id ON complaints(org_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_staff_org_id ON staff_members(org_id);
CREATE INDEX idx_staff_user_id ON staff_members(user_id);


-- ============================================================
-- 7. UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
