'use client'

import { useState } from 'react'
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

async function fetchPayments(tenantId: string) {
  // Get tenant's active occupancy
  const { data: occupancy, error: occError } = await supabase
    .from('occupancies')
    .select('id, monthly_rent, deposit_amount')
    .eq('tenant_id', tenantId)
    .neq('status', 'checked_out')
    .single()

  if (occError || !occupancy) throw new Error('Could not find active occupancy')

  // Get all payments for this occupancy
  const { data: payments, error: payError } = await supabase
    .from('payments')
    .select('*')
    .eq('occupancy_id', occupancy.id)
    .order('payment_date', { ascending: false })

  if (payError) throw new Error('Could not load payments')

  return { payments: payments || [], occupancy }
}

export default function TenantPaymentsPage() {
  const { tenantId } = useAuth()

  const { data, loading } = useQuery(
    () => fetchPayments(tenantId!),
    [tenantId]
  )

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
      <div className="space-y-2">
        {payments.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No payments yet</p>
            <p className="text-xs text-slate-400 mt-1">Your payment history will appear here</p>
          </div>
        )}

        {payments.map((payment: any) => {
          const typeCfg = paymentTypeLabels[payment.payment_type] || {
            label: payment.payment_type || 'Payment',
            color: 'bg-slate-50 text-slate-600',
          }
          const MethodIcon = paymentMethodIcons[payment.payment_method] || Wallet

          return (
            <Link
              key={payment.id}
              href={`/bills/receipt/${payment.id}`}
              className="block bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all"
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
    </div>
  )
}
