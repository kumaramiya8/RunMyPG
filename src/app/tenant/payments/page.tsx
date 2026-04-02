'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  IndianRupee,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
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
  upi: Smartphone,
  bank_transfer: CreditCard,
  card: CreditCard,
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function TenantPaymentsPage() {
  const { tenantId } = useAuth()

  const { data, loading, error } = useQuery(
    async () => {
      if (!tenantId) return null

      // Get tenant's active occupancy
      const { data: occ } = await supabase
        .from('occupancies')
        .select('id, monthly_rent, deposit_amount')
        .eq('tenant_id', tenantId)
        .neq('status', 'checked_out')
        .maybeSingle()

      if (!occ) return { payments: [], monthlyRent: 0 }

      // Get payments
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('occupancy_id', occ.id)
        .order('payment_date', { ascending: false })

      return {
        payments: payments || [],
        monthlyRent: occ.monthly_rent || 0,
        depositAmount: occ.deposit_amount || 0,
      }
    },
    [tenantId]
  )

  if (!tenantId || loading) {
    return (
      <div className="px-4 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <IndianRupee className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-bold text-slate-900">Payment History</h1>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <ListSkeleton rows={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-4 max-w-lg mx-auto">
        <p className="text-sm text-red-500">Error loading payments: {error}</p>
      </div>
    )
  }

  const payments = data?.payments || []
  const monthlyRent = data?.monthlyRent || 0

  const currentYear = new Date().getFullYear()
  const totalPaidThisYear = payments
    .filter((p: any) => new Date(p.payment_date).getFullYear() === currentYear)
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  const depositPaid = payments
    .filter((p: any) => p.payment_type === 'deposit')
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)

  return (
    <div className="px-4 py-4 max-w-lg mx-auto pb-24">
      <div className="flex items-center gap-2 mb-4">
        <IndianRupee className="w-5 h-5 text-emerald-600" />
        <h1 className="text-lg font-bold text-slate-900">Payment History</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-900">{formatAmount(totalPaidThisYear)}</p>
          <p className="text-[10px] text-slate-400">Paid {currentYear}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <Shield className="w-4 h-4 text-purple-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-900">{formatAmount(depositPaid)}</p>
          <p className="text-[10px] text-slate-400">Deposit</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <Calendar className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-900">{formatAmount(monthlyRent)}</p>
          <p className="text-[10px] text-slate-400">Monthly Rent</p>
        </div>
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">No payments yet</p>
          <p className="text-xs text-slate-400 mt-1">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {payments.map((payment: any) => {
            const typeCfg = paymentTypeLabels[payment.payment_type] || { label: 'Payment', color: 'bg-slate-50 text-slate-600' }
            const MethodIcon = paymentMethodIcons[payment.payment_method] || Smartphone

            return (
              <Link
                key={payment.id}
                href={`/tenant/receipt/${payment.id}`}
                className="block bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 shrink-0">
                    <IndianRupee className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{formatAmount(Number(payment.amount))}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeCfg.color}`}>
                        {typeCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] text-slate-500">
                        {formatDate(payment.payment_date || payment.created_at)}
                      </span>
                      <span className="text-slate-300">&middot;</span>
                      <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-400">
                        <MethodIcon className="w-3 h-3" />
                        {(payment.payment_method || 'cash').replace('_', ' ')}
                      </span>
                    </div>
                    {payment.transaction_ref && (
                      <p className="text-[10px] text-slate-400 mt-1">Ref: {payment.transaction_ref}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-primary font-semibold">Receipt</span>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
