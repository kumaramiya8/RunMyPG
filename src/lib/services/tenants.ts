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
  // First get tenant IDs for this org, then get their occupancies
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('org_id', orgId)

  if (!tenants?.length) return []

  const tenantIds = tenants.map((t) => t.id)

  const { data, error } = await supabase
    .from('occupancies')
    .select('*, tenant:tenants(*), bed:beds(*, room:rooms(*))')
    .in('tenant_id', tenantIds)
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
  rent: { monthlyRent: number; depositAmount: number; rentDueDay: number; checkinDate?: string }
) {
  const checkinDate = rent.checkinDate || new Date().toISOString()

  // 1. Create tenant
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

  // 2. Create occupancy
  const { data: occupancy, error: oErr } = await supabase
    .from('occupancies')
    .insert({
      tenant_id: newTenant.id,
      bed_id: bedId,
      checkin_at: checkinDate,
      monthly_rent: rent.monthlyRent,
      deposit_amount: rent.depositAmount,
      rent_due_day: rent.rentDueDay,
    })
    .select()
    .single()
  if (oErr) throw oErr

  // 3. Update bed status
  const { error: bErr } = await supabase
    .from('beds')
    .update({ status: 'occupied' })
    .eq('id', bedId)
  if (bErr) throw bErr

  // 4. Record deposit payment
  if (rent.depositAmount > 0) {
    await supabase
      .from('payments')
      .insert({
        occupancy_id: occupancy.id,
        org_id: orgId,
        amount: rent.depositAmount,
        payment_method: 'cash',
        payment_type: 'deposit',
        notes: 'Security deposit collected at check-in',
      })
  }

  // 5. Create first month's invoice (from checkin date)
  const checkinD = new Date(checkinDate)
  const periodStart = checkinD.toISOString().split('T')[0]
  const periodEnd = new Date(checkinD.getFullYear(), checkinD.getMonth() + 1, 0).toISOString().split('T')[0]
  const dueDate = new Date(checkinD.getFullYear(), checkinD.getMonth(), rent.rentDueDay).toISOString().split('T')[0]

  // Get org GST settings
  const { data: org } = await supabase
    .from('organizations')
    .select('gst_enabled')
    .eq('id', orgId)
    .single()

  const gstAmount = org?.gst_enabled ? Math.round(rent.monthlyRent * 0.18) : 0
  const totalAmount = rent.monthlyRent + gstAmount

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      org_id: orgId,
      occupancy_id: occupancy.id,
      invoice_number: `INV-${Date.now()}`,
      period_start: periodStart,
      period_end: periodEnd,
      base_amount: rent.monthlyRent,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      due_date: dueDate,
      status: 'paid', // First month is paid as advance
      amount_paid: totalAmount,
    })
    .select()
    .single()

  // 6. Record advance rent payment (first month)
  if (invoice) {
    await supabase
      .from('payments')
      .insert({
        invoice_id: invoice.id,
        occupancy_id: occupancy.id,
        org_id: orgId,
        amount: totalAmount,
        payment_method: 'cash',
        payment_type: 'advance',
        notes: 'First month advance rent collected at check-in',
      })
  }

  // 7. Create notification for tenant
  await supabase
    .from('messages')
    .insert({
      org_id: orgId,
      recipient_type: 'tenant',
      recipient_id: newTenant.id,
      message_type: 'announcement',
      content: `Welcome! You have been checked in. Monthly rent: ₹${rent.monthlyRent.toLocaleString('en-IN')}. Deposit paid: ₹${rent.depositAmount.toLocaleString('en-IN')}.`,
      sent_at: new Date().toISOString(),
      delivery_status: 'delivered',
    })

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

export async function putOnNotice(occupancyId: string, noticeDate: string, expectedVacateDate: string) {
  const { error } = await supabase
    .from('occupancies')
    .update({
      status: 'notice_period',
      notice_date: noticeDate,
      expected_vacate_date: expectedVacateDate,
    })
    .eq('id', occupancyId)
  if (error) throw error

  // Update bed status to notice
  const { data: occ } = await supabase
    .from('occupancies')
    .select('bed_id')
    .eq('id', occupancyId)
    .single()

  if (occ) {
    await supabase.from('beds').update({ status: 'notice' }).eq('id', occ.bed_id)
  }
}

export async function cancelNotice(occupancyId: string) {
  const { error } = await supabase
    .from('occupancies')
    .update({
      status: 'active',
      notice_date: null,
      expected_vacate_date: null,
    })
    .eq('id', occupancyId)
  if (error) throw error

  const { data: occ } = await supabase
    .from('occupancies')
    .select('bed_id')
    .eq('id', occupancyId)
    .single()

  if (occ) {
    await supabase.from('beds').update({ status: 'occupied' }).eq('id', occ.bed_id)
  }
}
