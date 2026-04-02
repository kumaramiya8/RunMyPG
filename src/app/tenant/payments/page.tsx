'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  IndianRupee,
  Receipt,
  CreditCard,
  Banknote,
  Wallet,
  ChevronRight,
  Calendar,
  TrendingUp,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { CardSkeleton, ListSkeleton } from '@/components/loading-skeleton'

const paymentTypeLabels: Record<string, { label: string; color: string }> = {
  rent: { label: 'Rent', color: 'bg-blue-50 text-blue-600' },
  deposit: { label: 'Deposit', color: 'bg-purple-50 text-purple-600' },
  advance: { label: 'Advance', color: 'bg-emerald-50 text-emerald-600' },
}

const paymentMethodIcons: Record<string, typeof CreditCard> = {
  cash: Banknote,
  upi: Wallet,
  bank_transfer: CreditCard,
  card: CreditCard,
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

interface Invoice {
  id: string
  period_start: string
  period_end: string
  total_amount: number
  amount_paid: number
  status: string
  due_date: string
}

async function fetchPayments(tenantId: string) {
  // Get tenant's active occupancy
  const { data: occupancy, error: occError } = await supabase
    .from('occupancies')
    .select('id, monthly_rent, deposit_amount')
    .eq('tenant_id', tenantId)
    .neq('status', 'checked_out')
    .single()

  if (occError || !occupancy) return { payments: [], occupancy: null, invoices: [] }

  // Get all payments for this occupancy
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('*')
    .eq('occupancy_id', occupancy.id)
    .order('payment_date', { ascending: false })

  if (payError) return { payments: [], occupancy, invoices: [] }

  // Get invoices for this occupancy (for calendar)
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('id, period_start, period_end, total_amount, amount_paid, status, due_date')
    .eq('occupancy_id', occupancy.id)
    .order('period_start', { ascending: false })

  return {
    payments: payments || [],
    occupancy,
    invoices: (invoices || []) as Invoice[],
  }
}

export default function TenantPaymentsPage() {
  const { tenantId } = useAuth()
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const { data, loading, error } = useQuery(
    async () => {
      if (!tenantId) return null
      return fetchPayments(tenantId)
    },
    [tenantId]
  )

  // Build calendar data for last 6 months
  const calendarMonths = useMemo(() => {
    const months: { key: string; label: string; status: 'paid' | 'pending' | 'overdue' | 'none' }[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = getMonthKey(d)
      const label = getMonthLabel(key)

      // Find invoice for this month
      const invoice = data?.invoices?.find((inv: Invoice) => {
        const invMonth = getMonthKey(new Date(inv.period_start))
        return invMonth === key
      })

      let status: 'paid' | 'pending' | 'overdue' | 'none' = 'none'
      if (invoice) {
        if (invoice.status === 'paid') {
          status = 'paid'
        } else if (invoice.status === 'overdue') {
          status = 'overdue'
        } else {
          // pending or partially_paid
          const dueDate = new Date(invoice.due_date)
          status = dueDate < now ? 'overdue' : 'pending'
        }
      }

      months.push({ key, label, status })
    }

    return months
  }, [data?.invoices])

  const handleMonthTap = (monthKey: string) => {
    setSelectedMonth(monthKey)
    // Scroll to the first payment in that month
    const el = monthRefs.current[monthKey]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (!tenantId || loading) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Payment History</h1>
            <p className="text-xs text-slate-500">Your payment records</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ListSkeleton rows={5} />
      </div>
    )
  }

  const payments = data?.payments || []
  const occupancy = data?.occupancy

  // Calculate summary
  const currentYear = new Date().getFullYear()
  const totalPaidThisYear = payments
    .filter((p: any) => new Date(p.payment_date).getFullYear() === currentYear)
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  const depositPaid = payments
    .filter((p: any) => p.payment_type === 'deposit')
    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

  const monthlyRent = occupancy?.monthly_rent || 0

  // Group payments by month for scroll-to
  const paymentsByMonth = useMemo(() => {
    const grouped: Record<string, typeof payments> = {}
    payments.forEach((p: any) => {
      const key = getMonthKey(new Date(p.payment_date))
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(p)
    })
    return grouped
  }, [payments])

  const statusDotColor: Record<string, string> = {
    paid: 'bg-emerald-500',
    pending: 'bg-amber-500',
    overdue: 'bg-red-500',
    none: 'bg-slate-300',
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/tenant"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Payment History</h1>
            <p className="text-xs text-slate-500">Your payment records</p>
          </div>
        </div>
      </div>

      {/* Payment Calendar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Payment Calendar</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {calendarMonths.map((month) => (
            <button
              key={month.key}
              onClick={() => handleMonthTap(month.key)}
              className={`flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl min-w-[60px] transition-all border ${
                selectedMonth === month.key
                  ? 'bg-primary/5 border-primary/30 shadow-sm'
                  : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[11px] font-semibold ${
                selectedMonth === month.key ? 'text-primary' : 'text-slate-600'
              }`}>
                {month.label}
              </span>
              <span className={`w-2.5 h-2.5 rounded-full ${statusDotColor[month.status]}`} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-slate-400">Paid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-400">Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-slate-400">Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="text-[10px] text-slate-400">No Invoice</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-base font-bold text-slate-900">{formatAmount(totalPaidThisYear)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Paid in {currentYear}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <Shield className="w-4 h-4 text-purple-500 mx-auto mb-1" />
          <p className="text-base font-bold text-slate-900">{formatAmount(depositPaid)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Deposit</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-base font-bold text-slate-900">{formatAmount(monthlyRent)}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Monthly Rent</p>
        </div>
      </div>

      {/* Payment List */}
      <div className="space-y-2" ref={listRef}>
        {payments.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No payments yet</p>
            <p className="text-xs text-slate-400 mt-1">Your payment history will appear here</p>
          </div>
        )}

        {/* Render grouped by month with anchors */}
        {Object.entries(paymentsByMonth)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([monthKey, monthPayments]) => (
            <div key={monthKey} ref={(el) => { monthRefs.current[monthKey] = el }}>
              <div className="flex items-center gap-2 pt-2 pb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {getMonthLabel(monthKey)}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              {(monthPayments as any[]).map((payment: any) => {
                const typeCfg = paymentTypeLabels[payment.payment_type] || {
                  label: payment.payment_type || 'Payment',
                  color: 'bg-slate-50 text-slate-600',
                }
                const MethodIcon = paymentMethodIcons[payment.payment_method] || Wallet

                return (
                  <Link
                    key={payment.id}
                    href={`/bills/receipt/${payment.id}`}
                    className="block bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all mb-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 shrink-0">
                        <IndianRupee className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-900">
                            {formatAmount(payment.amount)}
                          </p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeCfg.color}`}>
                            {typeCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {formatDate(payment.payment_date || payment.created_at)}
                          </span>
                          <span className="text-slate-300">&middot;</span>
                          <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                            <MethodIcon className="w-3 h-3" />
                            {(payment.payment_method || 'cash').replace('_', ' ')}
                          </span>
                        </div>
                        {payment.transaction_ref && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">
                            Ref: {payment.transaction_ref}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-primary font-semibold">View Receipt</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
      </div>
    </div>
  )
}
