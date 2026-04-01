'use client'

import { useState } from 'react'
import { ArrowLeft, FileBarChart, Download, ChevronDown, ChevronUp } from 'lucide-react'
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

// ─── Reusable data table component ───────────────────────────────────
function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-slate-400 py-4 text-center">No data available</p>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 mt-3">
      <table className="min-w-full divide-y divide-slate-200">
        <thead>
          <tr className="bg-slate-50">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap sticky top-0 bg-slate-50"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-xs text-slate-700 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReportsPage() {
  const { orgId } = useAuth()
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({})

  const toggleReport = (title: string) => {
    setExpandedReports((prev) => ({ ...prev, [title]: !prev[title] }))
  }

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

  // ─── Inline data computations ─────────────────────────────────────

  // Rent Collection: top 5 entries
  const rentTop5 = allInvoices.slice(0, 5).map((inv: any) => ({
    name: inv.occupancy?.tenant?.full_name || 'Unknown',
    status: inv.status || '-',
    amount: Number(inv.total_amount || 0),
  }))

  // Occupancy numbers
  const occupiedBeds = beds.filter((b: any) => b.status === 'occupied').length
  const totalBeds = beds.length
  const vacantBeds = beds.filter((b: any) => b.status === 'vacant').length

  // Expenses: total + top 3 categories
  const expByCat = fin.expensesByCategory || {}
  const expCategories = Object.entries(expByCat)
    .map(([cat, amt]) => ({ category: cat, amount: amt as number }))
    .sort((a, b) => b.amount - a.amount)
  const expTop3 = expCategories.slice(0, 3)

  // Tenant Directory: count by occupation type
  const workingCount = allOccupancies.filter((occ: any) => {
    const occ_type = (occ.tenant?.occupation || '').toLowerCase()
    return occ_type.includes('work') || occ_type.includes('job') || occ_type.includes('employ') || occ_type.includes('professional')
  }).length
  const studentCount = allOccupancies.filter((occ: any) => {
    const occ_type = (occ.tenant?.occupation || '').toLowerCase()
    return occ_type.includes('student') || occ_type.includes('study')
  }).length

  // Maintenance breakdown
  const openCount = allComplaints.filter((c: any) => c.status === 'open').length
  const inProgressCount = allComplaints.filter((c: any) => c.status === 'in_progress').length
  const resolvedCount = allComplaints.filter((c: any) => c.status === 'resolved' || c.status === 'closed').length

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

  // ─── Status badge helper ──────────────────────────────────────────

  function statusBadge(status: string) {
    const colors: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      overdue: 'bg-red-100 text-red-700',
      partial: 'bg-orange-100 text-orange-700',
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  }

  function priorityBadge(priority: string) {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-blue-100 text-blue-700',
      urgent: 'bg-red-200 text-red-800',
    }
    return colors[priority?.toLowerCase()] || 'bg-slate-100 text-slate-600'
  }

  function maintenanceStatusBadge(status: string) {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-amber-100 text-amber-700',
      resolved: 'bg-emerald-100 text-emerald-700',
      closed: 'bg-slate-100 text-slate-600',
    }
    return colors[status] || 'bg-slate-100 text-slate-600'
  }

  function occupancyStatusBadge(status: string) {
    const colors: Record<string, string> = {
      occupied: 'bg-red-100 text-red-700',
      vacant: 'bg-emerald-100 text-emerald-700',
      maintenance: 'bg-amber-100 text-amber-700',
    }
    return colors[status?.toLowerCase()] || 'bg-slate-100 text-slate-600'
  }

  // ─── Table data builders ──────────────────────────────────────────

  const occByBedId: Record<string, any> = {}
  allOccupancies.forEach((occ: any) => {
    if (occ.bed_id || occ.bed?.id) {
      occByBedId[occ.bed_id || occ.bed?.id] = occ
    }
  })

  function buildRentTableRows(): React.ReactNode[][] {
    return allInvoices.map((inv: any, i: number) => {
      const tenantName = inv.occupancy?.tenant?.full_name || 'Unknown'
      const roomName = inv.occupancy?.bed?.room?.name || inv.occupancy?.bed?.room?.room_number || '-'
      const rent = Number(inv.rent_amount || inv.total_amount || 0)
      const gst = Number(inv.gst_amount || 0)
      const total = Number(inv.total_amount || 0)
      const paid = Number(inv.amount_paid || 0)
      const status = inv.status || '-'
      const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '-'
      return [
        <span key="n" className="text-slate-400">{i + 1}</span>,
        <span key="t" className="font-medium text-slate-800">{tenantName}</span>,
        roomName,
        formatINR(rent),
        formatINR(gst),
        <span key="tot" className="font-medium">{formatINR(total)}</span>,
        <span key="s" className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusBadge(status)}`}>{status}</span>,
        dueDate,
        formatINR(paid),
      ]
    })
  }

  function buildOccupancyTableRows(): React.ReactNode[][] {
    return beds.map((bed: any, i: number) => {
      const room = rooms.find((r: any) => r.id === bed.room_id)
      const roomName = room?.name || room?.room_number || '-'
      const bedName = bed.bed_number || '-'
      const occ = occByBedId[bed.id]
      const tenantName = occ?.tenant?.full_name || '-'
      const checkIn = occ?.created_at ? new Date(occ.created_at).toLocaleDateString('en-IN') : '-'
      const rent = occ?.monthly_rent ? formatINR(Number(occ.monthly_rent)) : (bed.monthly_rent ? formatINR(Number(bed.monthly_rent)) : '-')
      const status = bed.status || '-'
      return [
        <span key="n" className="text-slate-400">{i + 1}</span>,
        roomName,
        bedName,
        <span key="s" className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${occupancyStatusBadge(status)}`}>{status}</span>,
        tenantName,
        checkIn,
        rent,
      ]
    })
  }

  function buildExpenseTableRows(): React.ReactNode[][] {
    return allExpenses.map((exp: any, i: number) => [
      <span key="n" className="text-slate-400">{i + 1}</span>,
      exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('en-IN') : '-',
      <span key="c" className="capitalize">{exp.category || '-'}</span>,
      <span key="d" className="max-w-[200px] truncate inline-block">{exp.description || '-'}</span>,
      <span key="a" className="font-medium">{formatINR(Number(exp.amount || 0))}</span>,
    ])
  }

  function buildTenantTableRows(): React.ReactNode[][] {
    return allOccupancies.map((occ: any, i: number) => {
      const t = occ.tenant || {}
      const roomName = occ.bed?.room?.name || occ.bed?.room?.room_number || '-'
      const checkIn = occ.created_at ? new Date(occ.created_at).toLocaleDateString('en-IN') : '-'
      return [
        <span key="n" className="text-slate-400">{i + 1}</span>,
        <span key="name" className="font-medium text-slate-800">{t.full_name || '-'}</span>,
        t.phone || '-',
        roomName,
        <span key="occ" className="capitalize">{t.occupation || '-'}</span>,
        t.company_or_college || '-',
        checkIn,
      ]
    })
  }

  function buildMaintenanceTableRows(): React.ReactNode[][] {
    return allComplaints.map((c: any, i: number) => {
      const date = c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '-'
      const status = c.status || '-'
      const priority = c.priority || '-'
      return [
        <span key="n" className="text-slate-400">{i + 1}</span>,
        date,
        c.room?.name || '-',
        <span key="cat" className="capitalize">{c.category || '-'}</span>,
        <span key="d" className="max-w-[200px] truncate inline-block">{c.description || '-'}</span>,
        <span key="p" className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${priorityBadge(priority)}`}>{priority}</span>,
        <span key="s" className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${maintenanceStatusBadge(status)}`}>{status.replace('_', ' ')}</span>,
        c.assigned_to || '-',
      ]
    })
  }

  function buildPnLTableRows(): React.ReactNode[][] {
    const rows: React.ReactNode[][] = [
      [
        <span key="c" className="font-semibold text-slate-800">Rent Collected</span>,
        <span key="a" className="font-semibold text-emerald-600">{formatINR(fin.rentCollected)}</span>,
      ],
    ]
    const expByCat = fin.expensesByCategory || {}
    Object.entries(expByCat).forEach(([cat, amt]) => {
      rows.push([
        <span key="c" className="text-slate-600 capitalize pl-3">Expense: {cat}</span>,
        <span key="a" className="text-red-500">-{formatINR(amt as number)}</span>,
      ])
    })
    rows.push([
      <span key="c" className="font-semibold text-slate-800 border-t border-slate-200 pt-1">Total Expenses</span>,
      <span key="a" className="font-semibold text-red-500 border-t border-slate-200 pt-1">-{formatINR(fin.totalExpenses)}</span>,
    ])
    rows.push([
      <span key="c" className="font-bold text-slate-900 text-sm">Net Profit</span>,
      <span key="a" className={`font-bold text-sm ${fin.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(fin.netProfit)}</span>,
    ])
    return rows
  }

  // ─── Report definitions with inline previews ──────────────────────

  const reports = [
    {
      title: 'Rent Collection Report',
      desc: 'Who paid, who hasn\'t, overdue amounts',
      stats: `${allInvoices.filter((i: any) => i.status === 'paid').length} paid, ${unpaidCount} pending`,
      onDownload: downloadRentCollection,
      tableHeaders: ['#', 'Tenant', 'Room', 'Rent', 'GST', 'Total', 'Status', 'Due Date', 'Paid'],
      tableRows: buildRentTableRows,
      preview: (
        <div className="mt-3 mb-1">
          {rentTop5.length > 0 ? (
            <div className="space-y-1.5">
              {rentTop5.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate flex-1 mr-2">{entry.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge(entry.status)}`}>
                    {entry.status}
                  </span>
                  <span className="text-slate-600 font-medium ml-2 whitespace-nowrap">{formatINR(entry.amount)}</span>
                </div>
              ))}
              {allInvoices.length > 5 && (
                <p className="text-[10px] text-slate-400">+{allInvoices.length - 5} more entries</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No invoices yet</p>
          )}
        </div>
      ),
    },
    {
      title: 'Occupancy Report',
      desc: 'Bed status, vacancy rate',
      stats: `${occupancyRate}% occupied, ${vacantBeds} vacant`,
      onDownload: downloadOccupancy,
      tableHeaders: ['#', 'Room', 'Bed', 'Status', 'Tenant', 'Check-in', 'Rent'],
      tableRows: buildOccupancyTableRows,
      preview: (
        <div className="mt-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700">{occupancyRate}%</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-[11px] text-slate-600">{occupiedBeds} occupied</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-600">{vacantBeds} vacant</span>
            </div>
            <span className="text-[11px] text-slate-400">/ {totalBeds} total beds</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Expense Report',
      desc: 'Category-wise expense breakdown',
      stats: `${formatINR(fin.totalExpenses)} total this month`,
      onDownload: downloadExpenseReport,
      tableHeaders: ['#', 'Date', 'Category', 'Description', 'Amount'],
      tableRows: buildExpenseTableRows,
      preview: (
        <div className="mt-3 mb-1">
          <div className="text-lg font-bold text-slate-800">{formatINR(fin.totalExpenses)}</div>
          {expTop3.length > 0 ? (
            <div className="space-y-1.5 mt-2">
              {expTop3.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 capitalize">{cat.category}</span>
                  <span className="text-slate-700 font-medium">{formatINR(cat.amount)}</span>
                </div>
              ))}
              {expCategories.length > 3 && (
                <p className="text-[10px] text-slate-400">+{expCategories.length - 3} more categories</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-1">No expenses recorded</p>
          )}
        </div>
      ),
    },
    {
      title: 'Tenant Directory',
      desc: 'Complete list with contact details',
      stats: `${allOccupancies.length} active tenants`,
      onDownload: downloadTenantDirectory,
      tableHeaders: ['#', 'Name', 'Phone', 'Room', 'Occupation', 'Company', 'Check-in'],
      tableRows: buildTenantTableRows,
      preview: (
        <div className="mt-3 mb-1">
          <div className="text-lg font-bold text-slate-800">{allOccupancies.length} <span className="text-sm font-medium text-slate-500">tenants</span></div>
          <div className="flex items-center gap-3 mt-1.5">
            {workingCount > 0 && (
              <span className="text-[11px] text-slate-600 px-2 py-0.5 bg-blue-50 rounded-full">{workingCount} working</span>
            )}
            {studentCount > 0 && (
              <span className="text-[11px] text-slate-600 px-2 py-0.5 bg-purple-50 rounded-full">{studentCount} students</span>
            )}
            {allOccupancies.length - workingCount - studentCount > 0 && (
              <span className="text-[11px] text-slate-400">{allOccupancies.length - workingCount - studentCount} other</span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Maintenance Report',
      desc: 'Open complaints, resolution time',
      stats: `${openComplaints} open issues`,
      onDownload: downloadMaintenance,
      tableHeaders: ['#', 'Date', 'Room', 'Category', 'Description', 'Priority', 'Status', 'Assigned'],
      tableRows: buildMaintenanceTableRows,
      preview: (
        <div className="mt-3 mb-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-medium text-red-700">{openCount} open</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-medium text-amber-700">{inProgressCount} in progress</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-emerald-700">{resolvedCount} resolved</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Profit & Loss Statement',
      desc: 'Revenue minus expenses',
      stats: `Net: ${formatINR(fin.netProfit)}`,
      onDownload: downloadProfitLoss,
      tableHeaders: ['Category', 'Amount'],
      tableRows: buildPnLTableRows,
      preview: (
        <div className="mt-3 mb-1">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Revenue</p>
              <p className="text-sm font-bold text-emerald-600">{formatINR(fin.rentCollected)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Expenses</p>
              <p className="text-sm font-bold text-red-500">{formatINR(fin.totalExpenses)}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-medium">Net Profit</p>
              <p className={`text-sm font-bold ${fin.netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatINR(fin.netProfit)}</p>
            </div>
          </div>
        </div>
      ),
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
        {reports.map((report) => {
          const isExpanded = expandedReports[report.title] || false
          return (
            <div key={report.title} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div
                className="p-4 cursor-pointer select-none"
                onClick={() => toggleReport(report.title)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{report.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{report.desc}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{report.stats}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 ml-3 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
                {!isExpanded && report.preview}
              </div>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <DataTable headers={report.tableHeaders} rows={report.tableRows()} />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); report.onDownload() }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
                    >
                      <Download className="w-3 h-3" /> Download CSV
                    </button>
                  </div>
                </div>
              )}

              {!isExpanded && (
                <div className="px-4 pb-4">
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); report.onDownload() }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
                    >
                      <Download className="w-3 h-3" /> Download CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
