'use client'

import { useState } from 'react'
import { IndianRupee, Wrench, UtensilsCrossed, Bell, BedDouble, CalendarDays, CheckCircle2, Lock, Shield, LogOut, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { putOnNotice } from '@/lib/services/tenants'
import { createNotification, notifyNoticePeriod } from '@/lib/services/notifications'

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
  deposit_paid: number
  start_date: string
  status: string
  lockin_months: number
  lockin_end_date: string | null
  notice_date: string | null
  expected_vacate_date: string | null
  bed_id: string
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
  const { tenantId, orgId, staffName } = useAuth()
  const [showNoticeConfirm, setShowNoticeConfirm] = useState(false)
  const [noticeLoading, setNoticeLoading] = useState(false)

  const { data: occupancy, loading: loadingOccupancy, refetch: refetchOccupancy } = useQuery<Occupancy | null>(
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

  const { data: orgSettings } = useQuery(
    async () => {
      if (!orgId) return null
      const { data, error } = await supabase
        .from('organizations')
        .select('notice_period_days')
        .eq('id', orgId)
        .single()
      if (error) return null
      return data
    },
    [orgId]
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

  // Notice period logic
  const noticePeriodDays = orgSettings?.notice_period_days ?? 30

  const handleInitiateNotice = async () => {
    if (!occupancy?.id || !orgId || !tenantId) return
    setNoticeLoading(true)
    try {
      const today = new Date()
      const vacateDate = new Date(today)
      vacateDate.setDate(vacateDate.getDate() + noticePeriodDays)
      const noticeDateStr = today.toISOString().split('T')[0]
      const vacateDateStr = vacateDate.toISOString().split('T')[0]

      await putOnNotice(occupancy.id, noticeDateStr, vacateDateStr)
      await notifyNoticePeriod(orgId, tenantId, formatDate(vacateDateStr))

      // Notify org/staff about the notice
      await createNotification(
        orgId,
        'staff',
        null,
        'Tenant Initiated Notice',
        `${staffName || 'A tenant'} has initiated notice. Expected vacate date: ${formatDate(vacateDateStr)}.`,
        'notice'
      )

      setShowNoticeConfirm(false)
      refetchOccupancy()
    } catch (err) {
      console.error('Failed to initiate notice:', err)
    } finally {
      setNoticeLoading(false)
    }
  }

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

  // Lock-in calculations
  const lockinMonths = occupancy?.lockin_months ?? 0
  const lockinEndDate = occupancy?.lockin_end_date ? new Date(occupancy.lockin_end_date) : null
  const lockinActive = lockinEndDate ? today < lockinEndDate : false
  const lockinDaysRemaining = lockinEndDate
    ? Math.max(0, Math.ceil((lockinEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Deposit calculations
  const depositRequired = occupancy?.deposit_amount ?? 0
  const depositPaid = occupancy?.deposit_paid ?? 0
  const depositBalance = Math.max(0, depositRequired - depositPaid)

  // Notice eligibility: active status and lock-in ended (or no lock-in)
  const isActive = occupancy?.status === 'active'
  const isOnNotice = occupancy?.status === 'notice_period'
  const canInitiateNotice = isActive && !lockinActive

  // Vacate date for notice confirmation dialog
  const expectedVacateDate = new Date(today)
  expectedVacateDate.setDate(expectedVacateDate.getDate() + noticePeriodDays)
  const expectedVacateDateStr = formatDate(expectedVacateDate.toISOString().split('T')[0])

  // Notice period remaining
  const noticeDaysRemaining = occupancy?.expected_vacate_date
    ? Math.max(0, Math.ceil((new Date(occupancy.expected_vacate_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

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

      {/* Lock-in Info Card */}
      {occupancy && lockinMonths > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lock-in Period</h2>
              <p className="text-xs text-slate-500">Minimum stay commitment</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Duration</span>
              <span className="text-sm font-bold text-slate-900">{lockinMonths} months</span>
            </div>
            {lockinEndDate && (
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-500">End Date</span>
                <span className="text-sm font-bold text-slate-900">
                  {formatDate(occupancy.lockin_end_date!)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Status</span>
              {lockinActive ? (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    Active
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{lockinDaysRemaining} days remaining</p>
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deposit Card */}
      {occupancy && depositRequired > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Security Deposit</h2>
              <p className="text-xs text-slate-500">Deposit tracking</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Required</span>
              <span className="text-sm font-bold text-slate-900">{formatINR(depositRequired)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-sm text-slate-500">Paid</span>
              <span className="text-sm font-bold text-emerald-600">{formatINR(depositPaid)}</span>
            </div>
            {depositBalance > 0 && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-500">Balance Due</span>
                <span className="text-sm font-bold text-red-600">{formatINR(depositBalance)}</span>
              </div>
            )}
            {depositBalance === 0 && (
              <div className="flex items-center justify-center py-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fully Paid
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notice Section */}
      {occupancy && isOnNotice && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Notice Period</h2>
              <p className="text-xs text-orange-600 font-medium">You are on notice</p>
            </div>
          </div>
          <div className="space-y-3">
            {occupancy.notice_date && (
              <div className="flex items-center justify-between py-2 border-b border-orange-100">
                <span className="text-sm text-slate-500">Notice Date</span>
                <span className="text-sm font-bold text-slate-900">{formatDate(occupancy.notice_date)}</span>
              </div>
            )}
            {occupancy.expected_vacate_date && (
              <div className="flex items-center justify-between py-2 border-b border-orange-100">
                <span className="text-sm text-slate-500">Expected Vacate</span>
                <span className="text-sm font-bold text-slate-900">{formatDate(occupancy.expected_vacate_date)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">Days Remaining</span>
              <span className={`text-sm font-bold ${noticeDaysRemaining <= 7 ? 'text-red-600' : 'text-orange-600'}`}>
                {noticeDaysRemaining} days
              </span>
            </div>
          </div>
        </div>
      )}

      {occupancy && canInitiateNotice && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Move Out</h2>
              <p className="text-xs text-slate-500">Initiate your notice period</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            You can initiate a {noticePeriodDays}-day notice period to vacate your accommodation.
          </p>
          <button
            onClick={() => setShowNoticeConfirm(true)}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 text-sm font-semibold rounded-xl transition-colors border border-red-200"
          >
            Initiate Notice
          </button>
        </div>
      )}

      {/* Notice Confirmation Dialog */}
      {showNoticeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Confirm Notice</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to initiate notice? You will need to vacate by{' '}
              <span className="font-semibold text-slate-900">{expectedVacateDateStr}</span>.
            </p>
            <p className="text-xs text-slate-400 mb-5">
              This action cannot be undone. A {noticePeriodDays}-day notice period will begin from today.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoticeConfirm(false)}
                disabled={noticeLoading}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleInitiateNotice}
                disabled={noticeLoading}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {noticeLoading ? 'Processing...' : 'Confirm'}
              </button>
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
