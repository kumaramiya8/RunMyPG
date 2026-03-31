'use client'

import { Clock, ChevronRight, IndianRupee } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getInvoices } from '@/lib/services/billing'
import { ListSkeleton, EmptyState } from '@/components/loading-skeleton'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  const diff = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

function formatDueDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

export default function PendingRent() {
  const { orgId } = useAuth()

  const { data: invoices, loading } = useQuery(
    () => (orgId ? getInvoices(orgId) : Promise.resolve(null)),
    [orgId]
  )

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <ListSkeleton rows={3} />
      </div>
    )
  }

  // Filter to non-paid invoices only
  const pendingInvoices = (invoices || []).filter(
    (inv) => inv.status !== 'paid' && inv.status !== 'cancelled'
  )

  if (pendingInvoices.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-4 pb-2">
          <h3 className="text-sm font-semibold text-slate-900">Pending Rent</h3>
        </div>
        <div className="p-4">
          <EmptyState
            icon={IndianRupee}
            title="All caught up!"
            description="No pending rent payments right now."
          />
        </div>
      </div>
    )
  }

  // Show up to 4 most recent pending invoices
  const displayInvoices = pendingInvoices.slice(0, 4)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-900">Pending Rent</h3>
        <button className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
          View All
        </button>
      </div>

      <div className="divide-y divide-slate-50">
        {displayInvoices.map((inv) => {
          const tenantName = inv.occupancy?.tenant?.full_name || 'Unknown'
          const roomName = inv.occupancy?.bed?.room?.name || inv.occupancy?.bed?.room?.room_number || 'N/A'
          const dueDate = inv.due_date || inv.billing_period_end || inv.created_at
          const daysOverdue = getDaysOverdue(dueDate)

          return (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 transition-colors active:bg-slate-100 cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {tenantName}
                  </p>
                  {daysOverdue > 0 && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {daysOverdue}d late
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {roomName} &middot; Due {formatDueDate(dueDate)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">
                  {formatINR(Number(inv.total_amount))}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
