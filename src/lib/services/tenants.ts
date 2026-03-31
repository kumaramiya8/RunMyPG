import { supabase } from '../supabase'

export async function getTenants(orgId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('org_id', orgId)
    .order('full_name')
  if (error) throw error
  return data
}

export async function getTenantById(tenantId: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()
  if (error) throw error
  return data
}

export async function getActiveOccupancies(orgId: string) {
  const { data, error } = await supabase
    .from('occupancies')
    .select('*, tenant:tenants(*), bed:beds(*, room:rooms(*))')
    .neq('status', 'checked_out')
  if (error) throw error
  return data
}

export async function checkIn(
  orgId: string,
  bedId: string,
  tenant: {
    fullName: string; phone: string; email?: string;
    fatherName?: string; fatherPhone?: string;
    motherName?: string; motherPhone?: string;
    aadhaarNumber?: string; occupation?: string; companyOrCollege?: string;
  },
  rent: { monthlyRent: number; depositAmount: number; rentDueDay: number }
) {
  // Create tenant
  const { data: newTenant, error: tErr } = await supabase
    .from('tenants')
    .insert({
      org_id: orgId,
      full_name: tenant.fullName,
      phone: tenant.phone,
      email: tenant.email,
      father_name: tenant.fatherName,
      father_phone: tenant.fatherPhone,
      mother_name: tenant.motherName,
      mother_phone: tenant.motherPhone,
      aadhaar_number: tenant.aadhaarNumber,
      occupation: tenant.occupation,
      company_or_college: tenant.companyOrCollege,
    })
    .select()
    .single()
  if (tErr) throw tErr

  // Create occupancy
  const { error: oErr } = await supabase
    .from('occupancies')
    .insert({
      tenant_id: newTenant.id,
      bed_id: bedId,
      monthly_rent: rent.monthlyRent,
      deposit_amount: rent.depositAmount,
      rent_due_day: rent.rentDueDay,
    })
  if (oErr) throw oErr

  // Update bed status
  const { error: bErr } = await supabase
    .from('beds')
    .update({ status: 'occupied' })
    .eq('id', bedId)
  if (bErr) throw bErr

  return newTenant
}

export async function checkOut(occupancyId: string, bedId: string, deductions: number) {
  const { error: oErr } = await supabase
    .from('occupancies')
    .update({ status: 'checked_out', checkout_at: new Date().toISOString(), deposit_returned: deductions })
    .eq('id', occupancyId)
  if (oErr) throw oErr

  const { error: bErr } = await supabase
    .from('beds')
    .update({ status: 'vacant' })
    .eq('id', bedId)
  if (bErr) throw bErr
}
