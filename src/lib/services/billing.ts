import { supabase } from '../supabase'

// ─── Invoices ──────────────────────────────────────────────────────

export async function getInvoices(orgId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, occupancy:occupancies(*, tenant:tenants(*), bed:beds(*, room:rooms(*)))')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getInvoiceById(invoiceId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, occupancy:occupancies(*, tenant:tenants(*), bed:beds(*, room:rooms(*)))')
    .eq('id', invoiceId)
    .single()
  if (error) throw error
  return data
}

export async function createInvoice(
  orgId: string,
  occupancyId: string,
  baseAmount: number,
  gstAmount: number,
  periodStart: string,
  periodEnd: string,
  dueDate: string,
) {
  // Get next invoice number
  const { data: numData } = await supabase.rpc('next_invoice_number', { p_org_id: orgId })
  const invoiceNumber = numData || `INV-${Date.now()}`

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      org_id: orgId,
      occupancy_id: occupancyId,
      invoice_number: invoiceNumber,
      period_start: periodStart,
      period_end: periodEnd,
      base_amount: baseAmount,
      gst_amount: gstAmount,
      total_amount: baseAmount + gstAmount,
      due_date: dueDate,
      status: 'pending',
      amount_paid: 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Payments ──────────────────────────────────────────────────────

export async function recordPayment(
  orgId: string,
  invoiceId: string | null,
  occupancyId: string,
  amount: number,
  paymentMethod: string,
  paymentType: string = 'rent',
  transactionRef?: string,
  notes?: string,
) {
  // 1. Create payment record
  const { data: payment, error: pErr } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      occupancy_id: occupancyId,
      org_id: orgId,
      amount,
      payment_method: paymentMethod,
      payment_type: paymentType,
      transaction_ref: transactionRef,
      notes,
    })
    .select()
    .single()
  if (pErr) throw pErr

  // 2. If linked to an invoice, update the invoice amount_paid and status
  if (invoiceId) {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total_amount, amount_paid')
      .eq('id', invoiceId)
      .single()

    if (invoice) {
      const newAmountPaid = Number(invoice.amount_paid || 0) + amount
      const totalAmount = Number(invoice.total_amount)
      const newStatus = newAmountPaid >= totalAmount ? 'paid' : 'partially_paid'

      await supabase
        .from('invoices')
        .update({ amount_paid: newAmountPaid, status: newStatus })
        .eq('id', invoiceId)
    }
  }

  return payment
}

export async function recordDepositPayment(
  orgId: string,
  occupancyId: string,
  amount: number,
  paymentMethod: string,
  transactionRef?: string,
) {
  // Record as deposit payment
  const payment = await recordPayment(orgId, null, occupancyId, amount, paymentMethod, 'deposit', transactionRef, 'Security deposit')

  // Update deposit_paid on occupancy
  const { data: occ } = await supabase
    .from('occupancies')
    .select('deposit_paid')
    .eq('id', occupancyId)
    .single()

  const newPaid = Number(occ?.deposit_paid || 0) + amount
  await supabase
    .from('occupancies')
    .update({ deposit_paid: newPaid })
    .eq('id', occupancyId)

  return payment
}

export async function recordAdvanceRent(
  orgId: string,
  occupancyId: string,
  amount: number,
  months: number,
  paymentMethod: string,
  transactionRef?: string,
) {
  const payment = await recordPayment(
    orgId, null, occupancyId, amount, paymentMethod, 'advance',
    transactionRef, `Advance rent for ${months} month(s)`
  )
  return payment
}

export async function getPaymentById(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, occupancy:occupancies(*, tenant:tenants(*), bed:beds(*, room:rooms(*)))')
    .eq('id', paymentId)
    .single()
  if (error) throw error
  return data
}

export async function getPaymentsForOccupancy(occupancyId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('occupancy_id', occupancyId)
    .order('payment_date', { ascending: false })
  if (error) throw error
  return data
}

// ─── Expenses ──────────────────────────────────────────────────────

export async function getExpenses(orgId: string) {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('org_id', orgId)
    .order('expense_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createExpense(
  orgId: string,
  buildingId: string | null,
  category: string,
  description: string,
  amount: number,
  expenseDate: string
) {
  const { data, error } = await supabase
    .from('expenses')
    .insert({ org_id: orgId, building_id: buildingId, category, description, amount, expense_date: expenseDate })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Financial Summary ─────────────────────────────────────────────

export async function getFinancialSummary(orgId: string) {
  const [invoicesRes, expensesRes, paymentsRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('org_id', orgId),
    supabase.from('expenses').select('*').eq('org_id', orgId),
    supabase.from('payments').select('*').eq('org_id', orgId),
  ])

  const invoices = invoicesRes.data || []
  const expenses = expensesRes.data || []
  const payments = paymentsRes.data || []

  const totalRentExpected = invoices.reduce((s, inv) => s + Number(inv.total_amount), 0)
  const rentCollected = invoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + Number(inv.total_amount), 0)
  const rentPending = invoices.filter((inv) => inv.status === 'pending' || inv.status === 'partially_paid').reduce((s, inv) => s + Number(inv.total_amount), 0)
  const rentOverdue = invoices.filter((inv) => inv.status === 'overdue').reduce((s, inv) => s + Number(inv.total_amount), 0)
  const totalExpenses = expenses.reduce((s, exp) => s + Number(exp.amount), 0)
  const totalPayments = payments.reduce((s, p) => s + Number(p.amount), 0)
  const depositCollected = payments.filter((p) => p.payment_type === 'deposit').reduce((s, p) => s + Number(p.amount), 0)
  const advanceCollected = payments.filter((p) => p.payment_type === 'advance').reduce((s, p) => s + Number(p.amount), 0)
  const netProfit = rentCollected - totalExpenses

  const expensesByCategory: Record<string, number> = {}
  expenses.forEach((exp) => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + Number(exp.amount)
  })

  return {
    totalRentExpected, rentCollected, rentPending, rentOverdue,
    totalExpenses, netProfit, totalPayments, depositCollected, advanceCollected,
    expensesByCategory, invoices, expenses, payments,
  }
}

// ─── Receipt Settings ──────────────────────────────────────────────

export async function getReceiptSettings(orgId: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('receipt_header, receipt_footer, receipt_show_gst, receipt_prefix, name, gst_number, gst_enabled, phone, email')
    .eq('id', orgId)
    .single()
  if (error) throw error
  return data
}

export async function updateReceiptSettings(orgId: string, settings: Record<string, unknown>) {
  const { error } = await supabase
    .from('organizations')
    .update(settings)
    .eq('id', orgId)
  if (error) throw error
}
