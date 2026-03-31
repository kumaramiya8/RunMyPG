'use client'

import { IndianRupee, Wrench, UtensilsCrossed, Bell, BedDouble, CalendarDays, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface Occupancy {
  id: string
  monthly_rent: number
  deposit_amount: number
  start_date: string
  status: string
  bed: {
    bed_label: string
    room: {
      room_number: string
      floor: number
    }
  } | null
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  status: string
  payment_type: string
}

export default function TenantDashboardPage() {
  const { tenantId, staffName } = useAuth()

  const { data: occupancy, loading: loadingOccupancy } = useQuery<Occupancy | null>(
    async () => {
      if (!tenantId) return null
      const { data, error } = await supabase
        .from('occupancies')
        .select('*, bed:beds(*, room:rooms(*))')
        .eq('tenant_id', tenantId)
        .neq('status', 'checked_out')
        .single()
      if (error) throw error
      return data
    },
    [tenantId]
  )

  const { data: payments, loading: loadingPayments } = useQuery<Payment[]>(
    async () => {
      if (!occupancy?.id) return []
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('occupancy_id', occupancy.id)
        .order('payment_date', { ascending: false })
        .limit(5)
      if (error) throw error
      return data ?? []
    },
    [occupancy?.id]
  )

  const loading = loadingOccupancy || loadingPayments
  const firstName = staffName ? staffName.split(' ')[0] : 'Tenant'

  if (loading) {
    return (
      <div className="px-4 py-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
          <div className="h-20 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  // Compute next due date (1st of next month)
  const today = new Date()
  const nextDue = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const nextDueStr = nextDue.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const daysUntilDue = Math.ceil((nextDue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Welcome Section */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Welcome, {firstName}!
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Here&apos;s your stay overview
        </p>
      </div>

      {/* Room & Bed Info Card */}
      {occupancy?.bed && (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BedDouble className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Your Room</h2>
              <p className="text-xs text-slate-500">Current accommodation</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Room</p>
              <p className="text-lg font-bold text-slate-900">{occupancy.bed.room.room_number}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Bed</p>
              <p className="text-lg font-bold text-slate-900">{occupancy.bed.bed_label}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Floor</p>
              <p className="text-lg font-bold text-slate-900">{occupancy.bed.room.floor}</p>
            </div>
            <div className="bg-white/70 rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Since</p>
              <p className="text-sm font-bold text-slate-900">{formatDate(occupancy.start_date)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rent Summary Card */}
      {occupancy && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Rent Summary</h2>
              <p className="text-xs text-slate-500">Payment details</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Monthly Rent</span>
              <span className="text-sm font-bold text-slate-900">
                {formatINR(occupancy.monthly_rent || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Next Due Date</span>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-900">{nextDueStr}</span>
                <p className="text-[10px] text-slate-400">{daysUntilDue} days away</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Deposit Paid</span>
              <span className="text-sm font-bold text-emerald-600">
                {formatINR(occupancy.deposit_amount || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/tenant/payments"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Pay History</span>
        </Link>
        <Link
          href="/tenant/complaints"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-orange-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Raise Complaint</span>
        </Link>
        <Link
          href="/tenant/meals"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Meal Schedule</span>
        </Link>
        <Link
          href="/tenant/notifications"
          className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center gap-2 active:bg-slate-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-rose-600" />
          </div>
          <span className="text-xs font-semibold text-slate-700">Notifications</span>
        </Link>
      </div>

      {/* Recent Payments */}
      {payments && payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Recent Payments</h2>
                <p className="text-xs text-slate-500">Last {payments.length} transactions</p>
              </div>
            </div>
            <Link href="/tenant/payments" className="text-xs font-semibold text-primary">
              View All
            </Link>
          </div>
          <div className="space-y-2">
            {payments.slice(0, 3).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {payment.payment_type?.replace('_', ' ') || 'Rent'}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDate(payment.payment_date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatINR(payment.amount)}</p>
                  <p className={`text-[10px] font-medium capitalize ${
                    payment.status === 'paid' ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {payment.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no occupancy */}
      {!occupancy && !loading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-slate-700">No Active Stay</h2>
          <p className="text-xs text-slate-400 mt-1">
            Your stay details will appear here once assigned.
          </p>
        </div>
      )}
    </div>
  )
}
