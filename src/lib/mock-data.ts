// Centralized mock data for the app — will be replaced by Supabase queries.
// This simulates a real PG building so all screens share consistent state.

import type { Building, Floor, Room, Bed, BedStatus, Tenant, Occupancy, Complaint, Invoice, InvoiceStatus, Expense } from './types'

// ─── Building Structure ────────────────────────────────────────────

export const mockBuilding: Building = {
  id: 'b1',
  org_id: 'org1',
  name: 'Block A',
  address: '42, MG Road, Koramangala',
  city: 'Bangalore',
}

export const mockFloors: Floor[] = [
  { id: 'f1', building_id: 'b1', name: 'Ground Floor', floor_number: 0 },
  { id: 'f2', building_id: 'b1', name: '1st Floor', floor_number: 1 },
  { id: 'f3', building_id: 'b1', name: '2nd Floor', floor_number: 2 },
  { id: 'f4', building_id: 'b1', name: '3rd Floor', floor_number: 3 },
]

function makeRooms(floorId: string, floorNum: number, count: number): Room[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `r${floorNum}${i + 1}`,
    floor_id: floorId,
    name: `Room ${floorNum}0${i + 1}`,
    room_number: `${floorNum}0${i + 1}`,
    has_ac: i % 3 === 0,
    has_attached_bathroom: i % 2 === 0,
    has_balcony: floorNum >= 2 && i < 2,
    has_tv: i % 4 === 0,
    base_rent: i % 3 === 0 ? 9000 : i % 2 === 0 ? 8000 : 7000,
  }))
}

export const mockRooms: Room[] = [
  ...makeRooms('f1', 0, 4),
  ...makeRooms('f2', 1, 6),
  ...makeRooms('f3', 2, 6),
  ...makeRooms('f4', 3, 5),
]

const bedStatuses: BedStatus[] = ['occupied', 'occupied', 'occupied', 'vacant', 'occupied', 'notice', 'occupied', 'blocked', 'vacant', 'occupied']

function makeBeds(room: Room, count: number, startIdx: number): Bed[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `bed-${room.room_number}-${String.fromCharCode(65 + i)}`,
    room_id: room.id,
    bed_number: `Bed ${String.fromCharCode(65 + i)}`,
    status: bedStatuses[(startIdx + i) % bedStatuses.length],
    monthly_rent: room.base_rent,
  }))
}

let bedIdx = 0
export const mockBeds: Bed[] = mockRooms.flatMap((room) => {
  const count = room.has_ac ? 2 : 3
  const beds = makeBeds(room, count, bedIdx)
  bedIdx += count
  return beds
})

// ─── Tenants ───────────────────────────────────────────────────────

const firstNames = ['Rahul', 'Priya', 'Suresh', 'Anita', 'Vikram', 'Deepa', 'Arjun', 'Meera', 'Karthik', 'Sneha', 'Amit', 'Pooja', 'Ravi', 'Neha', 'Sanjay', 'Kavita', 'Rohan', 'Divya', 'Arun', 'Nisha', 'Tarun', 'Swati', 'Gaurav', 'Rekha', 'Manish', 'Jaya', 'Pankaj', 'Sunita', 'Rajesh', 'Lakshmi', 'Nikhil', 'Anjali', 'Vishal', 'Isha', 'Prakash', 'Geeta', 'Harish', 'Komal', 'Naveen', 'Shilpa']
const lastNames = ['Sharma', 'Patel', 'Kumar', 'Desai', 'Singh', 'Reddy', 'Gupta', 'Nair', 'Verma', 'Joshi', 'Rao', 'Mehta', 'Iyer', 'Das', 'Mishra', 'Shah', 'Pillai', 'Bhat', 'Saxena', 'Chauhan']
const occupations = ['Working', 'Student', 'Working', 'Student', 'Working']
const companies = ['Infosys', 'TCS', 'Wipro', 'BITS Pilani', 'IIM Bangalore', 'Google', 'Flipkart', 'Christ University', 'PES University', 'Amazon']

export const mockTenants: Tenant[] = mockBeds
  .filter((b) => b.status === 'occupied' || b.status === 'notice')
  .map((bed, i) => ({
    id: `t${i + 1}`,
    org_id: 'org1',
    full_name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    phone: `+91 ${9800000000 + i * 111}`,
    email: `${firstNames[i % firstNames.length].toLowerCase()}@email.com`,
    photo_url: undefined,
    aadhaar_number: i % 3 === 0 ? `${4000 + i} ${5000 + i} ${6000 + i}` : undefined,
    aadhaar_verified: i % 3 === 0,
    occupation: occupations[i % occupations.length],
    company_or_college: companies[i % companies.length],
  }))

export const mockOccupancies: Occupancy[] = mockBeds
  .filter((b) => b.status === 'occupied' || b.status === 'notice')
  .map((bed, i) => ({
    id: `occ${i + 1}`,
    tenant_id: `t${i + 1}`,
    bed_id: bed.id,
    checkin_at: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    checkout_at: undefined,
    deposit_amount: bed.monthly_rent ? bed.monthly_rent : 7000,
    monthly_rent: bed.monthly_rent ? bed.monthly_rent : 7000,
    rent_due_day: [1, 5, 10, 15, 1][i % 5],
    notice_date: bed.status === 'notice' ? '2026-04-15' : undefined,
    expected_vacate_date: bed.status === 'notice' ? '2026-04-30' : undefined,
    status: bed.status === 'notice' ? 'notice_period' as const : 'active' as const,
  }))

// ─── Complaints ────────────────────────────────────────────────────

export const mockComplaints: Complaint[] = [
  { id: 'c1', org_id: 'org1', tenant_id: 't1', room_id: 'r21', category: 'Electrical', description: 'Ceiling fan making grinding noise', photo_url: undefined, priority: 'high', status: 'open', assigned_to: undefined, resolved_at: undefined, created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'c2', org_id: 'org1', tenant_id: 't3', room_id: 'r11', category: 'Plumbing', description: 'Bathroom tap leaking continuously', photo_url: undefined, priority: 'medium', status: 'in_progress', assigned_to: 'Raju (Plumber)', resolved_at: undefined, created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: 'c3', org_id: 'org1', tenant_id: 't5', room_id: 'r32', category: 'Furniture', description: 'Bed frame is broken, needs replacement', photo_url: undefined, priority: 'urgent', status: 'open', assigned_to: undefined, resolved_at: undefined, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'c4', org_id: 'org1', tenant_id: 't7', room_id: 'r12', category: 'Cleaning', description: 'Common bathroom needs deep cleaning', photo_url: undefined, priority: 'low', status: 'open', assigned_to: undefined, resolved_at: undefined, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'c5', org_id: 'org1', tenant_id: 't2', room_id: 'r03', category: 'Electrical', description: 'AC not cooling properly', photo_url: undefined, priority: 'high', status: 'open', assigned_to: undefined, resolved_at: undefined, created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: 'c6', org_id: 'org1', tenant_id: 't9', room_id: 'r23', category: 'Plumbing', description: 'Water heater not working', photo_url: undefined, priority: 'medium', status: 'open', assigned_to: undefined, resolved_at: undefined, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'c7', org_id: 'org1', tenant_id: 't4', room_id: 'r14', category: 'Electrical', description: 'Light switch sparking when pressed', photo_url: undefined, priority: 'urgent', status: 'in_progress', assigned_to: 'Vijay (Electrician)', resolved_at: undefined, created_at: new Date(Date.now() - 4 * 3600000).toISOString() },
]

// ─── Helper lookups ────────────────────────────────────────────────

export function getRoomForBed(bedId: string): Room | undefined {
  const bed = mockBeds.find((b) => b.id === bedId)
  if (!bed) return undefined
  return mockRooms.find((r) => r.id === bed.room_id)
}

export function getFloorForRoom(roomId: string): Floor | undefined {
  const room = mockRooms.find((r) => r.id === roomId)
  if (!room) return undefined
  return mockFloors.find((f) => f.id === room.floor_id)
}

export function getTenantForBed(bedId: string): Tenant | undefined {
  const occ = mockOccupancies.find((o) => o.bed_id === bedId && o.status !== 'checked_out')
  if (!occ) return undefined
  return mockTenants.find((t) => t.id === occ.tenant_id)
}

export function getOccupancyForBed(bedId: string): Occupancy | undefined {
  return mockOccupancies.find((o) => o.bed_id === bedId && o.status !== 'checked_out')
}

// ─── Invoices ──────────────────────────────────────────────────────

const invoiceStatuses: InvoiceStatus[] = ['paid', 'paid', 'pending', 'paid', 'overdue', 'paid', 'partially_paid', 'paid', 'pending', 'paid']

export const mockInvoices: Invoice[] = mockOccupancies.map((occ, i) => {
  const status = invoiceStatuses[i % invoiceStatuses.length]
  const baseAmount = occ.monthly_rent
  const gstAmount = Math.round(baseAmount * 0.18)
  const totalAmount = baseAmount + gstAmount
  return {
    id: `inv-${i + 1}`,
    occupancy_id: occ.id,
    org_id: 'org1',
    invoice_number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    base_amount: baseAmount,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    status,
    due_date: `2026-03-${String(occ.rent_due_day).padStart(2, '0')}`,
  }
})

// ─── Expenses ──────────────────────────────────────────────────────

export const mockExpenses: Expense[] = [
  { id: 'exp1', org_id: 'org1', building_id: 'b1', category: 'Water', description: 'Water tanker delivery', amount: 2500, expense_date: '2026-03-29' },
  { id: 'exp2', org_id: 'org1', building_id: 'b1', category: 'Electricity', description: 'March electricity bill', amount: 18500, expense_date: '2026-03-28' },
  { id: 'exp3', org_id: 'org1', building_id: 'b1', category: 'Food', description: 'Rice 50kg + Dal 20kg', amount: 4200, expense_date: '2026-03-28' },
  { id: 'exp4', org_id: 'org1', building_id: 'b1', category: 'Maintenance', description: 'Plumber - bathroom repair Room 108', amount: 1200, expense_date: '2026-03-27' },
  { id: 'exp5', org_id: 'org1', building_id: 'b1', category: 'Wi-Fi', description: 'Monthly internet bill - Airtel', amount: 3500, expense_date: '2026-03-25' },
  { id: 'exp6', org_id: 'org1', building_id: 'b1', category: 'Food', description: 'Vegetables and groceries', amount: 3800, expense_date: '2026-03-25' },
  { id: 'exp7', org_id: 'org1', building_id: 'b1', category: 'Maintenance', description: 'Electrician - fan repair Room 204', amount: 800, expense_date: '2026-03-24' },
  { id: 'exp8', org_id: 'org1', building_id: 'b1', category: 'Water', description: 'Water tanker delivery', amount: 2500, expense_date: '2026-03-22' },
  { id: 'exp9', org_id: 'org1', building_id: 'b1', category: 'Food', description: 'Cooking gas cylinder x3', amount: 2700, expense_date: '2026-03-20' },
  { id: 'exp10', org_id: 'org1', building_id: 'b1', category: 'Cleaning', description: 'Cleaning supplies and phenyl', amount: 1500, expense_date: '2026-03-18' },
  { id: 'exp11', org_id: 'org1', building_id: 'b1', category: 'Food', description: 'Rice 50kg', amount: 2800, expense_date: '2026-03-15' },
  { id: 'exp12', org_id: 'org1', building_id: 'b1', category: 'Maintenance', description: 'Pest control - full building', amount: 4500, expense_date: '2026-03-12' },
  { id: 'exp13', org_id: 'org1', building_id: 'b1', category: 'Water', description: 'Water tanker delivery', amount: 2500, expense_date: '2026-03-10' },
  { id: 'exp14', org_id: 'org1', building_id: 'b1', category: 'Staff', description: 'Cook salary - March', amount: 15000, expense_date: '2026-03-05' },
  { id: 'exp15', org_id: 'org1', building_id: 'b1', category: 'Staff', description: 'Warden salary - March', amount: 12000, expense_date: '2026-03-05' },
  { id: 'exp16', org_id: 'org1', building_id: 'b1', category: 'Staff', description: 'Cleaning staff salary - March', amount: 8000, expense_date: '2026-03-05' },
  { id: 'exp17', org_id: 'org1', building_id: 'b1', category: 'Electricity', description: 'Generator diesel', amount: 3500, expense_date: '2026-03-03' },
]

// ─── Financial helpers ─────────────────────────────────────────────

export function getInvoiceForOccupancy(occupancyId: string): Invoice | undefined {
  return mockInvoices.find((inv) => inv.occupancy_id === occupancyId)
}

export function getTenantForInvoice(invoiceId: string) {
  const invoice = mockInvoices.find((inv) => inv.id === invoiceId)
  if (!invoice) return undefined
  const occ = mockOccupancies.find((o) => o.id === invoice.occupancy_id)
  if (!occ) return undefined
  return mockTenants.find((t) => t.id === occ.tenant_id)
}

export function getFinancialSummary() {
  const totalRentExpected = mockInvoices.reduce((s, inv) => s + inv.total_amount, 0)
  const rentCollected = mockInvoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + inv.total_amount, 0)
  const rentPending = mockInvoices.filter((inv) => inv.status === 'pending' || inv.status === 'partially_paid').reduce((s, inv) => s + inv.total_amount, 0)
  const rentOverdue = mockInvoices.filter((inv) => inv.status === 'overdue').reduce((s, inv) => s + inv.total_amount, 0)
  const totalExpenses = mockExpenses.reduce((s, exp) => s + exp.amount, 0)
  const netProfit = rentCollected - totalExpenses

  const expensesByCategory: Record<string, number> = {}
  mockExpenses.forEach((exp) => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount
  })

  return { totalRentExpected, rentCollected, rentPending, rentOverdue, totalExpenses, netProfit, expensesByCategory }
}

export function getBedStats() {
  const total = mockBeds.length
  const occupied = mockBeds.filter((b) => b.status === 'occupied').length
  const vacant = mockBeds.filter((b) => b.status === 'vacant').length
  const notice = mockBeds.filter((b) => b.status === 'notice').length
  const blocked = mockBeds.filter((b) => b.status === 'blocked').length
  const maintenance = mockBeds.filter((b) => b.status === 'maintenance').length
  return { total, occupied, vacant, notice, blocked, maintenance }
}

// ─── Staff ─────────────────────────────────────────────────────────

import type { StaffRole } from './types'

export interface MockStaff {
  id: string
  name: string
  phone: string
  role: StaffRole
  is_active: boolean
  initials: string
  can_view_beds: boolean
  can_manage_checkins: boolean
  can_view_complaints: boolean
  can_view_finances: boolean
  can_manage_expenses: boolean
  can_view_reports: boolean
}

export const mockStaff: MockStaff[] = [
  { id: 's1', name: 'Amit Kumar', phone: '+91 98000 00001', role: 'owner', is_active: true, initials: 'AK', can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: true, can_manage_expenses: true, can_view_reports: true },
  { id: 's2', name: 'Rajesh Verma', phone: '+91 98000 00002', role: 'manager', is_active: true, initials: 'RV', can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: true, can_manage_expenses: true, can_view_reports: true },
  { id: 's3', name: 'Sunil Yadav', phone: '+91 98000 00003', role: 'warden', is_active: true, initials: 'SY', can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: false, can_manage_expenses: false, can_view_reports: false },
  { id: 's4', name: 'Priya Menon', phone: '+91 98000 00004', role: 'accountant', is_active: true, initials: 'PM', can_view_beds: false, can_manage_checkins: false, can_view_complaints: false, can_view_finances: true, can_manage_expenses: true, can_view_reports: true },
  { id: 's5', name: 'Lakshmi Devi', phone: '+91 98000 00005', role: 'cook', is_active: true, initials: 'LD', can_view_beds: false, can_manage_checkins: false, can_view_complaints: false, can_view_finances: false, can_manage_expenses: false, can_view_reports: false },
  { id: 's6', name: 'Mohan Das', phone: '+91 98000 00006', role: 'warden', is_active: false, initials: 'MD', can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: false, can_manage_expenses: false, can_view_reports: false },
]
