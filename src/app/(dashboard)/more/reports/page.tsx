'use client'

import {
  ArrowLeft,
  FileBarChart,
  Download,
  Users,
  IndianRupee,
  BedDouble,
  Wrench,
  Calendar,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import { getFinancialSummary, getBedStats, mockTenants, mockOccupancies, mockComplaints, mockInvoices } from '@/lib/mock-data'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export default function ReportsPage() {
  const summary = getFinancialSummary()
  const bedStats = getBedStats()
  const occupancyRate = Math.round(((bedStats.occupied + bedStats.notice) / bedStats.total) * 100)
  const unpaidTenants = mockInvoices.filter((i) => i.status !== 'paid').length
  const openComplaints = mockComplaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length

  const reports = [
    {
      title: 'Rent Collection Report',
      desc: 'Who paid, who hasn\'t, overdue amounts',
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-600',
      stats: `${mockInvoices.filter((i) => i.status === 'paid').length} paid, ${unpaidTenants} pending`,
    },
    {
      title: 'Occupancy Report',
      desc: 'Bed status, vacancy rate, notice periods',
      icon: BedDouble,
      color: 'bg-indigo-50 text-indigo-600',
      stats: `${occupancyRate}% occupied, ${bedStats.vacant} vacant`,
    },
    {
      title: 'Expense Report',
      desc: 'Category-wise expense breakdown',
      icon: IndianRupee,
      color: 'bg-amber-50 text-amber-600',
      stats: `${formatINR(summary.totalExpenses)} total this month`,
    },
    {
      title: 'Tenant Directory',
      desc: 'Complete list with contact details',
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      stats: `${mockTenants.length} tenants`,
    },
    {
      title: 'Maintenance Report',
      desc: 'Open complaints, resolution time',
      icon: Wrench,
      color: 'bg-red-50 text-red-600',
      stats: `${openComplaints} open issues`,
    },
    {
      title: 'Profit & Loss Statement',
      desc: 'Revenue minus expenses for the month',
      icon: FileBarChart,
      color: 'bg-purple-50 text-purple-600',
      stats: `Net: ${formatINR(summary.netProfit)}`,
    },
  ]

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/more"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-emerald-50">
            <FileBarChart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Reports</h1>
            <p className="text-xs text-slate-500">Download business reports</p>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">March 2026</span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Change Month <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      {/* Report cards */}
      <div className="space-y-3">
        {reports.map((report) => {
          const Icon = report.icon
          return (
            <div
              key={report.title}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${report.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{report.desc}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">{report.stats}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 ml-11">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary-dark active:scale-[0.98] transition-all">
                  <Download className="w-3 h-3" />
                  Excel
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 font-semibold rounded-lg text-xs hover:bg-slate-200 active:scale-[0.98] transition-all">
                  <Download className="w-3 h-3" />
                  PDF
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
