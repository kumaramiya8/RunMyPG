'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getInvoices } from '@/lib/services/billing'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { ListSkeleton } from '@/components/loading-skeleton'

type CellStatus = 'paid' | 'pending' | 'overdue' | 'partially_paid' | 'none'

const cellConfig: Record<CellStatus, { emoji: string; label: string; bg: string; text: string }> = {
  paid: { emoji: '\u2705', label: 'Paid', bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700' },
  pending: { emoji: '\u23F3', label: 'Pending', bg: 'bg-amber-50 hover:bg-amber-100', text: 'text-amber-700' },
  partially_paid: { emoji: '\u23F3', label: 'Partial', bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-700' },
  overdue: { emoji: '\u274C', label: 'Overdue', bg: 'bg-red-50 hover:bg-red-100', text: 'text-red-700' },
  none: { emoji: '\u2014', label: 'No invoice', bg: 'bg-slate-50', text: 'text-slate-400' },
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthShort(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function formatMonthFull(date: Date): string {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export default function PaymentCalendarPage() {
  const { orgId } = useAuth()
  const [centerDate, setCenterDate] = useState(() => new Date())

  const { data: invoices, loading: loadingInvoices } = useQuery(
    () => (orgId ? getInvoices(orgId) : Promise.resolve([])),
    [orgId]
  )

  const { data: occupancies, loading: loadingOccupancies } = useQuery(
    () => (orgId ? getActiveOccupancies(orgId) : Promise.resolve([])),
    [orgId]
  )

  // Generate the 6 month columns: 3 past + current + 2 future
  const months = useMemo(() => {
    const result: Date[] = []
    for (let offset = -3; offset <= 2; offset++) {
      const d = new Date(centerDate.getFullYear(), centerDate.getMonth() + offset, 1)
      result.push(d)
    }
    return result
  }, [centerDate])

  // Build lookup: monthKey -> occupancyId -> invoice
  const invoiceMap = useMemo(() => {
    const map: Record<string, Record<string, { id: string; status: string }>> = {}
    if (!invoices) return map
    for (const inv of invoices as any[]) {
      if (!inv.period_start) continue
      const d = new Date(inv.period_start)
      const key = getMonthKey(d)
      if (!map[key]) map[key] = {}
      map[key][inv.occupancy_id] = { id: inv.id, status: inv.status }
    }
    return map
  }, [invoices])

  // Build tenant rows from active occupancies
  const tenantRows = useMemo(() => {
    if (!occupancies) return []
    return (occupancies as any[]).map((occ) => ({
      occupancyId: occ.id,
      tenantName: occ.tenant?.full_name || 'Unknown',
      roomName: occ.bed?.room?.name || '',
      bedNumber: occ.bed?.bed_number || '',
      checkinAt: occ.checkin_at,
    }))
  }, [occupancies])

  const loading = loadingInvoices || loadingOccupancies

  const shiftMonth = (delta: number) => {
    setCenterDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  if (!orgId || loading) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold text-slate-900">Payment Calendar</h1>
        </div>
        <ListSkeleton rows={8} />
      </div>
    )
  }

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/bills"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-slate-900">Payment Calendar</h1>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => shiftMonth(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <span className="text-sm font-semibold text-slate-700 min-w-[160px] text-center">
          {formatMonthFull(centerDate)}
        </span>
        <button
          onClick={() => shiftMonth(1)}
          className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-[11px] font-medium">
        {(['paid', 'pending', 'overdue', 'none'] as CellStatus[]).map((status) => {
          const cfg = cellConfig[status]
          return (
            <span key={status} className="flex items-center gap-1">
              <span>{cfg.emoji}</span>
              <span className={cfg.text}>{cfg.label}</span>
            </span>
          )
        })}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 z-10 bg-slate-50 text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide min-w-[180px]">
                  Tenant
                </th>
                {months.map((m) => {
                  const isCurrentMonth =
                    m.getMonth() === new Date().getMonth() &&
                    m.getFullYear() === new Date().getFullYear()
                  return (
                    <th
                      key={getMonthKey(m)}
                      className={`px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide min-w-[80px] ${
                        isCurrentMonth
                          ? 'bg-primary/5 text-primary'
                          : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      {formatMonthShort(m)}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {tenantRows.length === 0 && (
                <tr>
                  <td
                    colSpan={months.length + 1}
                    className="text-center py-10 text-sm text-slate-400"
                  >
                    No active tenants found
                  </td>
                </tr>
              )}
              {tenantRows.map((row) => (
                <tr key={row.occupancyId} className="border-b border-slate-50 last:border-b-0">
                  <td className="sticky left-0 z-10 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {row.tenantName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {row.roomName}
                      {row.bedNumber ? ` - ${row.bedNumber}` : ''}
                    </p>
                  </td>
                  {months.map((m) => {
                    const monthKey = getMonthKey(m)
                    const match = invoiceMap[monthKey]?.[row.occupancyId]
                    const status: CellStatus = match
                      ? (match.status as CellStatus)
                      : 'none'
                    const cfg = cellConfig[status]
                    const isCurrentMonth =
                      m.getMonth() === new Date().getMonth() &&
                      m.getFullYear() === new Date().getFullYear()

                    const cell = (
                      <td
                        key={monthKey}
                        className={`px-3 py-3 text-center ${
                          isCurrentMonth ? 'bg-primary/[0.02]' : ''
                        }`}
                      >
                        {match ? (
                          <Link
                            href={`/bills/invoice/${match.id}`}
                            className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${cfg.bg} ${cfg.text}`}
                          >
                            <span>{cfg.emoji}</span>
                            <span className="hidden sm:inline">{cfg.label}</span>
                          </Link>
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-[11px] font-medium ${cfg.bg} ${cfg.text}`}
                          >
                            {cfg.emoji}
                          </span>
                        )}
                      </td>
                    )

                    return cell
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      {tenantRows.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {(() => {
            const currentKey = getMonthKey(new Date())
            const currentMonthInvoices = invoiceMap[currentKey] || {}
            const total = tenantRows.length
            const paid = Object.values(currentMonthInvoices).filter(
              (i) => i.status === 'paid'
            ).length
            const pending = Object.values(currentMonthInvoices).filter(
              (i) => i.status === 'pending' || i.status === 'partially_paid'
            ).length
            const overdue = Object.values(currentMonthInvoices).filter(
              (i) => i.status === 'overdue'
            ).length
            return (
              <>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-emerald-700">{paid}</p>
                  <p className="text-[10px] text-emerald-600 font-medium">
                    Paid this month
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-amber-700">{pending}</p>
                  <p className="text-[10px] text-amber-600 font-medium">
                    Pending
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-red-700">{overdue}</p>
                  <p className="text-[10px] text-red-600 font-medium">
                    Overdue
                  </p>
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
