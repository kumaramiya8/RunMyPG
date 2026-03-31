'use client'

import { ArrowLeft, FileBarChart, Download, Calendar, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFinancialSummary, getInvoices } from '@/lib/services/billing'
import { getComplaints } from '@/lib/services/complaints'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { getFullPropertyTree } from '@/lib/services/property'
import { CardSkeleton } from '@/components/loading-skeleton'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function ReportsPage() {
  const { orgId } = useAuth()

  const { data: summary, loading: l1 } = useQuery(() => getFinancialSummary(orgId!), [orgId])
  const { data: invoices, loading: l2 } = useQuery(() => getInvoices(orgId!), [orgId])
  const { data: complaints, loading: l3 } = useQuery(() => getComplaints(orgId!), [orgId])
  const { data: occupancies, loading: l4 } = useQuery(() => getActiveOccupancies(orgId!), [orgId])
  const { data: property, loading: l5 } = useQuery(() => getFullPropertyTree(orgId!), [orgId])

  const loading = l1 || l2 || l3 || l4 || l5

  if (!orgId || loading) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
        <div className="space-y-3">{Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)}</div>
      </div>
    )
  }

  const fin = summary || { totalExpenses: 0, rentCollected: 0, netProfit: 0, totalRentExpected: 0, rentPending: 0, rentOverdue: 0, expensesByCategory: {}, invoices: [], expenses: [] }
  const allInvoices = invoices || []
  const allComplaints = complaints || []
  const allOccupancies = occupancies || []
  const beds = property?.beds || []

  const unpaidCount = allInvoices.filter((i: any) => i.status !== 'paid').length
  const openComplaints = allComplaints.filter((c: any) => c.status === 'open' || c.status === 'in_progress').length
  const occupancyRate = beds.length > 0 ? Math.round((beds.filter((b: any) => b.status === 'occupied').length / beds.length) * 100) : 0

  const reports = [
    { title: 'Rent Collection Report', desc: 'Who paid, who hasn\'t, overdue amounts', stats: `${allInvoices.filter((i: any) => i.status === 'paid').length} paid, ${unpaidCount} pending` },
    { title: 'Occupancy Report', desc: 'Bed status, vacancy rate', stats: `${occupancyRate}% occupied, ${beds.filter((b: any) => b.status === 'vacant').length} vacant` },
    { title: 'Expense Report', desc: 'Category-wise expense breakdown', stats: `${formatINR(fin.totalExpenses)} total this month` },
    { title: 'Tenant Directory', desc: 'Complete list with contact details', stats: `${allOccupancies.length} active tenants` },
    { title: 'Maintenance Report', desc: 'Open complaints, resolution time', stats: `${openComplaints} open issues` },
    { title: 'Profit & Loss Statement', desc: 'Revenue minus expenses', stats: `Net: ${formatINR(fin.netProfit)}` },
  ]

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/more" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-emerald-50"><FileBarChart className="w-5 h-5 text-emerald-600" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Reports</h1>
            <p className="text-xs text-slate-500">Download business reports</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.title} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <p className="text-sm font-semibold text-slate-900">{report.title}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{report.desc}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">{report.stats}</p>
            <div className="flex gap-2 mt-3">
              <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary-dark active:scale-[0.98] transition-all">
                <Download className="w-3 h-3" /> Excel
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-200 active:scale-[0.98] transition-all">
                <Download className="w-3 h-3" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
