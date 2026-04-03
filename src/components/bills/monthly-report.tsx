'use client'

import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Droplets,
  Zap,
  UtensilsCrossed,
  Wrench,
  Wifi,
  SprayCan,
  UserCog,
  HelpCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  BedDouble,
  Users,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useBuilding } from '@/lib/building-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFinancialSummary, getInvoices } from '@/lib/services/billing'
import { CardSkeleton, ListSkeleton } from '@/components/loading-skeleton'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount}`
}

const categoryIcons: Record<string, typeof Droplets> = {
  Water: Droplets,
  Electricity: Zap,
  Food: UtensilsCrossed,
  Maintenance: Wrench,
  'Wi-Fi': Wifi,
  Cleaning: SprayCan,
  Staff: UserCog,
}

const categoryColors: Record<string, string> = {
  Water: 'bg-blue-100 text-blue-600',
  Electricity: 'bg-yellow-100 text-yellow-600',
  Food: 'bg-orange-100 text-orange-600',
  Maintenance: 'bg-red-100 text-red-600',
  'Wi-Fi': 'bg-indigo-100 text-indigo-600',
  Cleaning: 'bg-teal-100 text-teal-600',
  Staff: 'bg-purple-100 text-purple-600',
}

export default function MonthlyReport() {
  const { orgId } = useAuth()
  const { selectedBuildingId } = useBuilding()

  const { data: summary, loading: summaryLoading } = useQuery(
    () => getFinancialSummary(orgId!, selectedBuildingId),
    [orgId, selectedBuildingId]
  )

  const { data: invoices, loading: invoicesLoading } = useQuery(
    () => getInvoices(orgId!, selectedBuildingId),
    [orgId, selectedBuildingId]
  )

  if (!orgId || summaryLoading || invoicesLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-3 gap-3">
          <CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  const fin = summary || { totalRentExpected: 0, rentCollected: 0, rentPending: 0, rentOverdue: 0, totalExpenses: 0, netProfit: 0, expensesByCategory: {}, invoices: [], expenses: [] }
  const allInvoices = invoices || []

  const paidCount = allInvoices.filter((i: any) => i.status === 'paid').length
  const overdueCount = allInvoices.filter((i: any) => i.status === 'overdue').length

  // Sort expenses by amount descending
  const sortedExpenses = Object.entries(fin.expensesByCategory)
    .sort(([, a], [, b]) => (b as number) - (a as number))

  // Get current month name
  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className={`rounded-2xl p-5 shadow-lg ${fin.netProfit >= 0 ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-red-600 to-red-800'} text-white`}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white/70">{monthLabel} &mdash; Net Profit</h3>
          {fin.netProfit >= 0 ? (
            <TrendingUp className="w-5 h-5 text-white/50" />
          ) : (
            <TrendingDown className="w-5 h-5 text-white/50" />
          )}
        </div>
        <p className="text-3xl font-bold">{formatINR(fin.netProfit)}</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-[11px] text-white/50 font-medium">Total Revenue</p>
            <p className="text-lg font-bold flex items-center gap-1">
              {formatCompact(fin.rentCollected)}
              <ArrowUpRight className="w-4 h-4 text-emerald-300" />
            </p>
          </div>
          <div>
            <p className="text-[11px] text-white/50 font-medium">Total Expenses</p>
            <p className="text-lg font-bold flex items-center gap-1">
              {formatCompact(fin.totalExpenses)}
              <ArrowDownRight className="w-4 h-4 text-red-300" />
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <BedDouble className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{allInvoices.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Invoices</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{paidCount}</p>
          <p className="text-[10px] text-slate-400 font-medium">Paid</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <IndianRupee className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-900">{formatCompact(fin.totalRentExpected)}</p>
          <p className="text-[10px] text-slate-400 font-medium">Expected Rent</p>
        </div>
      </div>

      {/* Collection Breakdown */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Rent Collection</h3>

        {/* Progress bar */}
        {fin.totalRentExpected > 0 && (
          <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex mb-3">
            <div
              className="bg-emerald-400 transition-all"
              style={{ width: `${(fin.rentCollected / fin.totalRentExpected) * 100}%` }}
            />
            <div
              className="bg-amber-400 transition-all"
              style={{ width: `${(fin.rentPending / fin.totalRentExpected) * 100}%` }}
            />
            <div
              className="bg-red-400 transition-all"
              style={{ width: `${(fin.rentOverdue / fin.totalRentExpected) * 100}%` }}
            />
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-600">Collected ({paidCount} tenants)</span>
            </div>
            <span className="text-sm font-bold text-slate-900">{formatINR(fin.rentCollected)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-slate-600">Pending</span>
            </div>
            <span className="text-sm font-bold text-amber-600">{formatINR(fin.rentPending)}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-slate-600">Overdue ({overdueCount} tenants)</span>
            </div>
            <span className="text-sm font-bold text-red-600">{formatINR(fin.rentOverdue)}</span>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {sortedExpenses.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Expense Breakdown</h3>
            <span className="text-xs font-bold text-slate-500">{formatINR(fin.totalExpenses)}</span>
          </div>

          <div className="space-y-3">
            {sortedExpenses.map(([category, amount]) => {
              const Icon = categoryIcons[category] || HelpCircle
              const color = categoryColors[category] || 'bg-slate-100 text-slate-500'
              const pct = fin.totalExpenses > 0 ? Math.round(((amount as number) / fin.totalExpenses) * 100) : 0
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-slate-700 font-medium">{category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{pct}%</span>
                      <span className="text-sm font-bold text-slate-900">{formatINR(amount as number)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color.split(' ')[0]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Download Report */}
      <button className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        <Download className="w-4 h-4" />
        Download Report as Excel
      </button>
    </div>
  )
}
