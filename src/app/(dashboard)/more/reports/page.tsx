'use client'

import { ArrowLeft, FileBarChart, Download } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getFinancialSummary, getInvoices, getExpenses } from '@/lib/services/billing'
import { getComplaints } from '@/lib/services/complaints'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { getFullPropertyTree } from '@/lib/services/property'
import { CardSkeleton } from '@/components/loading-skeleton'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escapeCell = (cell: string) => {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`
    }
    return cell
  }
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const { orgId } = useAuth()

  const { data: summary, loading: l1 } = useQuery(() => getFinancialSummary(orgId!), [orgId])
  const { data: invoices, loading: l2 } = useQuery(() => getInvoices(orgId!), [orgId])
  const { data: complaints, loading: l3 } = useQuery(() => getComplaints(orgId!), [orgId])
  const { data: occupancies, loading: l4 } = useQuery(() => getActiveOccupancies(orgId!), [orgId])
  const { data: property, loading: l5 } = useQuery(() => getFullPropertyTree(orgId!), [orgId])
  const { data: expenses, loading: l6 } = useQuery(() => getExpenses(orgId!), [orgId])

  const loading = l1 || l2 || l3 || l4 || l5 || l6

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
  const allExpenses = expenses || []
  const beds = property?.beds || []
  const rooms = property?.rooms || []

  const unpaidCount = allInvoices.filter((i: any) => i.status !== 'paid').length
  const openComplaints = allComplaints.filter((c: any) => c.status === 'open' || c.status === 'in_progress').length
  const occupancyRate = beds.length > 0 ? Math.round((beds.filter((b: any) => b.status === 'occupied').length / beds.length) * 100) : 0

  // ─── Download handlers ──────────────────────────────────────────

  function downloadRentCollection() {
    const headers = ['Tenant Name', 'Room', 'Monthly Rent', 'Status', 'Due Date', 'Amount Paid', 'Balance']
    const rows = allInvoices.map((inv: any) => {
      const tenantName = inv.occupancy?.tenant?.full_name || 'Unknown'
      const roomName = inv.occupancy?.bed?.room?.name || inv.occupancy?.bed?.room?.room_number || '-'
      const totalAmount = Number(inv.total_amount || 0)
      const amountPaid = Number(inv.amount_paid || 0)
      return [
        tenantName,
        roomName,
        totalAmount.toString(),
        inv.status || '-',
        inv.due_date || '-',
        amountPaid.toString(),
        (totalAmount - amountPaid).toString(),
      ]
    })
    downloadCSV('rent-collection-report.csv', headers, rows)
  }

  function downloadOccupancy() {
    const headers = ['Room', 'Bed', 'Status', 'Tenant Name', 'Check-in Date', 'Monthly Rent']
    // Build a lookup from occupancies
    const occByBedId: Record<string, any> = {}
    allOccupancies.forEach((occ: any) => {
      if (occ.bed_id || occ.bed?.id) {
        occByBedId[occ.bed_id || occ.bed?.id] = occ
      }
    })

    const rows = beds.map((bed: any) => {
      const room = rooms.find((r: any) => r.id === bed.room_id)
      const roomName = room?.name || room?.room_number || '-'
      const bedName = bed.bed_number || '-'
      const occ = occByBedId[bed.id]
      const tenantName = occ?.tenant?.full_name || '-'
      const checkIn = occ?.created_at ? new Date(occ.created_at).toLocaleDateString('en-IN') : '-'
      const rent = occ?.monthly_rent ? Number(occ.monthly_rent).toString() : (bed.monthly_rent ? Number(bed.monthly_rent).toString() : '-')
      return [roomName, bedName, bed.status || '-', tenantName, checkIn, rent]
    })
    downloadCSV('occupancy-report.csv', headers, rows)
  }

  function downloadExpenseReport() {
    const headers = ['Date', 'Category', 'Description', 'Amount']
    const rows = allExpenses.map((exp: any) => [
      exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN') : '-',
      exp.category || '-',
      exp.description || '-',
      Number(exp.amount || 0).toString(),
    ])
    downloadCSV('expense-report.csv', headers, rows)
  }

  function downloadTenantDirectory() {
    const headers = ['Name', 'Phone', 'Email', 'Room', 'Bed', 'Occupation', 'Company', 'Check-in Date']
    const rows = allOccupancies.map((occ: any) => {
      const t = occ.tenant || {}
      const roomName = occ.bed?.room?.name || occ.bed?.room?.room_number || '-'
      const bedName = occ.bed?.bed_number || '-'
      return [
        t.full_name || '-',
        t.phone || '-',
        t.email || '-',
        roomName,
        bedName,
        t.occupation || '-',
        t.company_or_college || '-',
        occ.created_at ? new Date(occ.created_at).toLocaleDateString('en-IN') : '-',
      ]
    })
    downloadCSV('tenant-directory.csv', headers, rows)
  }

  function downloadMaintenance() {
    const headers = ['Date', 'Room', 'Category', 'Description', 'Priority', 'Status', 'Assigned To']
    const rows = allComplaints.map((c: any) => [
      c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '-',
      c.room?.name || '-',
      c.category || '-',
      c.description || '-',
      c.priority || '-',
      c.status || '-',
      c.assigned_to || '-',
    ])
    downloadCSV('maintenance-report.csv', headers, rows)
  }

  function downloadProfitLoss() {
    const headers = ['Category', 'Amount']
    const rows: string[][] = [
      ['Total Revenue (Rent Collected)', fin.rentCollected.toString()],
    ]
    const expByCat = fin.expensesByCategory || {}
    Object.entries(expByCat).forEach(([cat, amt]) => {
      rows.push([`Expense: ${cat}`, (-(amt as number)).toString()])
    })
    rows.push(['Total Expenses', (-fin.totalExpenses).toString()])
    rows.push(['Net Profit', fin.netProfit.toString()])
    downloadCSV('profit-loss-statement.csv', headers, rows)
  }

  // ─── Report definitions ─────────────────────────────────────────

  const reports = [
    {
      title: 'Rent Collection Report',
      desc: 'Who paid, who hasn\'t, overdue amounts',
      stats: `${allInvoices.filter((i: any) => i.status === 'paid').length} paid, ${unpaidCount} pending`,
      onDownload: downloadRentCollection,
    },
    {
      title: 'Occupancy Report',
      desc: 'Bed status, vacancy rate',
      stats: `${occupancyRate}% occupied, ${beds.filter((b: any) => b.status === 'vacant').length} vacant`,
      onDownload: downloadOccupancy,
    },
    {
      title: 'Expense Report',
      desc: 'Category-wise expense breakdown',
      stats: `${formatINR(fin.totalExpenses)} total this month`,
      onDownload: downloadExpenseReport,
    },
    {
      title: 'Tenant Directory',
      desc: 'Complete list with contact details',
      stats: `${allOccupancies.length} active tenants`,
      onDownload: downloadTenantDirectory,
    },
    {
      title: 'Maintenance Report',
      desc: 'Open complaints, resolution time',
      stats: `${openComplaints} open issues`,
      onDownload: downloadMaintenance,
    },
    {
      title: 'Profit & Loss Statement',
      desc: 'Revenue minus expenses',
      stats: `Net: ${formatINR(fin.netProfit)}`,
      onDownload: downloadProfitLoss,
    },
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
              <button
                onClick={report.onDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
              >
                <Download className="w-3 h-3" /> Download CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
