'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Search,
  Building2,
  Receipt,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFinancialSummary, getInvoices } from '@/lib/services/billing'
import { ListSkeleton, CardSkeleton } from '@/components/loading-skeleton'
import type { InvoiceStatus } from '@/lib/types'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatCompact(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`
  return `₹${amount}`
}

const statusConfig: Record<InvoiceStatus, { icon: typeof CheckCircle; label: string; color: string; bg: string }> = {
  paid: { icon: CheckCircle, label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  pending: { icon: Clock, label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50' },
  partially_paid: { icon: Clock, label: 'Partial', color: 'text-blue-600', bg: 'bg-blue-50' },
  overdue: { icon: AlertTriangle, label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50' },
}

type FilterType = 'all' | 'pending' | 'overdue' | 'paid'

export default function BillsOverview() {
  const { orgId } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')

  const { data: summary, loading: summaryLoading } = useQuery(
    () => getFinancialSummary(orgId!),
    [orgId]
  )

  const { data: invoices, loading: invoicesLoading } = useQuery(
    () => getInvoices(orgId!),
    [orgId]
  )

  if (!orgId || summaryLoading || invoicesLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
        <ListSkeleton rows={5} />
      </div>
    )
  }

  const allInvoices = invoices || []
  const fin = summary || { rentCollected: 0, rentPending: 0, rentOverdue: 0, netProfit: 0, totalRentExpected: 0, totalExpenses: 0, expensesByCategory: {}, invoices: [], expenses: [] }

  // Enrich invoices from the joined query
  const enrichedInvoices = allInvoices.map((inv: any) => {
    const occ = inv.occupancy
    const tenant = occ?.tenant
    const bed = occ?.bed
    const room = bed?.room
    return { invoice: inv, tenant, room, bed, occupancy: occ }
  })

  const filtered = enrichedInvoices.filter(({ invoice, tenant, room }: any) => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'pending' ? (invoice.status === 'pending' || invoice.status === 'partially_paid') :
      filter === 'overdue' ? invoice.status === 'overdue' :
      invoice.status === 'paid'
    const matchesSearch = !search ||
      tenant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      room?.name?.toLowerCase().includes(search.toLowerCase()) ||
      invoice.invoice_number?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const paidCount = allInvoices.filter((i: any) => i.status === 'paid').length
  const pendingCount = allInvoices.filter((i: any) => i.status === 'pending' || i.status === 'partially_paid').length
  const overdueCount = allInvoices.filter((i: any) => i.status === 'overdue').length

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Collected</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCompact(fin.rentCollected)}</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{paidCount} tenants paid</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-100">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Pending</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCompact(fin.rentPending)}</p>
          <p className="text-[10px] text-amber-600 font-medium mt-0.5">{pendingCount} awaiting</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-100">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Overdue</span>
          </div>
          <p className="text-xl font-bold text-slate-900">{formatCompact(fin.rentOverdue)}</p>
          <p className="text-[10px] text-red-600 font-medium mt-0.5">{overdueCount} overdue</p>
        </div>

        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-indigo-100">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Net Profit</span>
          </div>
          <p className={`text-xl font-bold ${fin.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCompact(fin.netProfit)}
          </p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">After expenses</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scroll-touch -mx-4 px-4 md:mx-0 md:px-0">
        <Link
          href="/bills/collect"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
        >
          <IndianRupee className="w-3.5 h-3.5" />
          Collect Rent
        </Link>
        <Link
          href="/bills/expenses"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <Receipt className="w-3.5 h-3.5" />
          Expenses
        </Link>
        <Link
          href="/bills/report"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Monthly Report
        </Link>
        <Link
          href="/bills/calendar"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
        >
          <Calendar className="w-3.5 h-3.5" />
          Payment Calendar
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by tenant, room, or invoice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all' as const, label: 'All', count: allInvoices.length },
          { key: 'pending' as const, label: 'Pending', count: pendingCount },
          { key: 'overdue' as const, label: 'Overdue', count: overdueCount },
          { key: 'paid' as const, label: 'Paid', count: paidCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filter === item.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {filtered.map(({ invoice, tenant, room, bed }: any) => {
          const cfg = statusConfig[invoice.status as InvoiceStatus]
          const StatusIcon = cfg.icon
          return (
            <Link
              key={invoice.id}
              href={`/bills/invoice/${invoice.id}`}
              className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary">
                  {tenant?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {tenant?.full_name || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                  <Building2 className="w-3 h-3" />
                  <span>{room?.name}{bed ? ` - ${bed.bed_number}` : ''}</span>
                  <span className="text-slate-300">|</span>
                  <span>Due {invoice.due_date?.split('-').reverse().slice(0, 2).join('/')}</span>
                </div>
              </div>

              {/* Amount + status */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">{formatINR(invoice.total_amount)}</p>
                <span className={`inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {cfg.label}
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">No invoices found</p>
          </div>
        )}
      </div>
    </div>
  )
}
