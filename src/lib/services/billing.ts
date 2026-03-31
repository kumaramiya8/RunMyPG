import { supabase } from '../supabase'

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

export async function recordPayment(
  orgId: string,
  invoiceId: string,
  occupancyId: string,
  amount: number,
  paymentMethod: string,
  transactionRef?: string
) {
  const { error: pErr } = await supabase
    .from('payments')
    .insert({
      invoice_id: invoiceId,
      occupancy_id: occupancyId,
      org_id: orgId,
      amount,
      payment_method: paymentMethod,
      transaction_ref: transactionRef,
    })
  if (pErr) throw pErr

  const { error: iErr } = await supabase
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', invoiceId)
  if (iErr) throw iErr
}

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

export async function getFinancialSummary(orgId: string) {
  const [invoicesRes, expensesRes] = await Promise.all([
    supabase.from('invoices').select('*').eq('org_id', orgId),
    supabase.from('expenses').select('*').eq('org_id', orgId),
  ])

  const invoices = invoicesRes.data || []
  const expenses = expensesRes.data || []

  const totalRentExpected = invoices.reduce((s, inv) => s + Number(inv.total_amount), 0)
  const rentCollected = invoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + Number(inv.total_amount), 0)
  const rentPending = invoices.filter((inv) => inv.status === 'pending' || inv.status === 'partially_paid').reduce((s, inv) => s + Number(inv.total_amount), 0)
  const rentOverdue = invoices.filter((inv) => inv.status === 'overdue').reduce((s, inv) => s + Number(inv.total_amount), 0)
  const totalExpenses = expenses.reduce((s, exp) => s + Number(exp.amount), 0)
  const netProfit = rentCollected - totalExpenses

  const expensesByCategory: Record<string, number> = {}
  expenses.forEach((exp) => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + Number(exp.amount)
  })

  return { totalRentExpected, rentCollected, rentPending, rentOverdue, totalExpenses, netProfit, expensesByCategory, invoices, expenses }
}
