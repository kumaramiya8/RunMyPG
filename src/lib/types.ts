// Core types matching the database schema

export interface Organization {
  id: string
  name: string
  owner_id: string
  phone?: string
  email?: string
  gst_number?: string
  gst_enabled: boolean
  logo_url?: string
}

export interface Building {
  id: string
  org_id: string
  name: string
  address?: string
  city?: string
}

export interface Floor {
  id: string
  building_id: string
  name: string
  floor_number: number
}

export interface Room {
  id: string
  floor_id: string
  name: string
  room_number: string
  has_ac: boolean
  has_attached_bathroom: boolean
  has_balcony: boolean
  has_tv: boolean
  base_rent?: number
}

export type BedStatus = 'vacant' | 'occupied' | 'notice' | 'blocked' | 'maintenance'

export interface Bed {
  id: string
  room_id: string
  bed_number: string
  status: BedStatus
  monthly_rent?: number
}

export interface Tenant {
  id: string
  org_id: string
  full_name: string
  phone: string
  email?: string
  photo_url?: string
  aadhaar_number?: string
  aadhaar_verified: boolean
  father_name?: string
  father_phone?: string
  mother_name?: string
  mother_phone?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  occupation?: string
  company_or_college?: string
}

export type OccupancyStatus = 'active' | 'notice_period' | 'checked_out'

export interface Occupancy {
  id: string
  tenant_id: string
  bed_id: string
  checkin_at: string
  checkout_at?: string
  deposit_amount: number
  monthly_rent: number
  rent_due_day: number
  notice_date?: string
  expected_vacate_date?: string
  status: OccupancyStatus
}

export type InvoiceStatus = 'pending' | 'paid' | 'partially_paid' | 'overdue'

export interface Invoice {
  id: string
  occupancy_id: string
  org_id: string
  invoice_number: string
  period_start: string
  period_end: string
  base_amount: number
  gst_amount: number
  total_amount: number
  status: InvoiceStatus
  due_date: string
}

export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Complaint {
  id: string
  org_id: string
  tenant_id?: string
  room_id?: string
  category: string
  description: string
  photo_url?: string
  priority: string
  status: ComplaintStatus
  assigned_to?: string
  resolved_at?: string
  created_at: string
}

export interface Expense {
  id: string
  org_id: string
  building_id?: string
  category: string
  description: string
  amount: number
  expense_date: string
}

export type StaffRole = 'owner' | 'manager' | 'warden' | 'accountant' | 'cook'

export interface StaffMember {
  id: string
  org_id: string
  user_id: string
  name: string
  role: StaffRole
  can_view_beds: boolean
  can_manage_checkins: boolean
  can_view_complaints: boolean
  can_view_finances: boolean
  can_manage_expenses: boolean
  can_view_reports: boolean
  is_active: boolean
}
