'use client'

import { useState } from 'react'
import {
  User,
  Phone,
  Mail,
  Building2,
  BedDouble,
  IndianRupee,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Briefcase,
  Clock,
  AlertTriangle,
  ChevronRight,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  Receipt,
  CreditCard,
  BellRing,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { getTenantById, getActiveOccupancies, putOnNotice, cancelNotice } from '@/lib/services/tenants'
import { getPaymentsForOccupancy, getInvoices } from '@/lib/services/billing'
import { getFullPropertyTree } from '@/lib/services/property'
import { notifyNoticePeriod } from '@/lib/services/notifications'
import { ListSkeleton } from '@/components/loading-skeleton'
import type { Occupancy, Tenant, Bed, Room, Invoice } from '@/lib/types'

interface OccupancyWithJoins extends Occupancy {
  tenant: Tenant
  bed: Bed & { room: Room }
}

interface Payment {
  id: string
  occupancy_id: string
  org_id: string
  amount: number
  payment_method: string
  payment_type: string
  payment_date: string
  transaction_ref?: string
  notes?: string
  invoice_id?: string
}

function InfoRow({ icon: Icon, label, value, color }: { icon: typeof User; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="p-1.5 rounded-lg bg-slate-100 shrink-0">
        <Icon className={`w-4 h-4 ${color || 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
        <p className="text-sm text-slate-800 font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export default function TenantProfile({ tenantId }: { tenantId: string }) {
  const { orgId } = useAuth()

  const { data: tenant, loading: tenantLoading } = useQuery(
    () => getTenantById(tenantId),
    [tenantId]
  )

  const { data: allOccupancies, loading: occLoading, refetch: refetchOccupancies } = useQuery(
    () => getActiveOccupancies(orgId!),
    [orgId]
  )

  const { data: propertyTree, loading: propLoading } = useQuery(
    () => (orgId ? getFullPropertyTree(orgId) : Promise.resolve(null)),
    [orgId]
  )

  const loading = tenantLoading || occLoading || propLoading

  if (loading) {
    return <ListSkeleton rows={4} />
  }

  if (!tenant) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-400">Tenant not found</p>
        <Link href="/tenants" className="text-sm text-primary font-semibold mt-2 inline-block">
          Back to Tenants
        </Link>
      </div>
    )
  }

  const occupancies = (allOccupancies ?? []) as OccupancyWithJoins[]
  const occupancy = occupancies.find((o) => o.tenant_id === tenantId)
  const bed = occupancy?.bed
  const room = bed?.room

  // Resolve building name from property tree: bed -> room -> floor -> building
  const buildingName = (() => {
    if (!room || !propertyTree) return null
    const floor = propertyTree.floors?.find((f: any) => f.id === room.floor_id)
    if (!floor) return null
    const building = propertyTree.buildings?.find((b: any) => b.id === floor.building_id)
    return building?.name || null
  })()

  return (
    <div className="space-y-4">
      {/* Header card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl font-bold text-primary">
            {tenant.full_name.split(' ').map((n: string) => n[0]).join('')}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">{tenant.full_name}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          {tenant.aadhaar_verified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Aadhaar Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> Not Verified
            </span>
          )}
          {occupancy?.status === 'notice_period' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" /> On Notice
            </span>
          )}
        </div>
        {room && bed && (
          <p className="text-xs text-slate-500 mt-2">
            {buildingName ? `${buildingName} \u2022 ` : ''}{room.name} &mdash; {bed.bed_number}
          </p>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 mt-4">
          <a href={`tel:${tenant.phone}`} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:bg-emerald-100 transition-colors">
            <Phone className="w-3.5 h-3.5" /> Call
          </a>
          <button className="flex-1 py-2.5 bg-blue-50 text-blue-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:bg-blue-100 transition-colors">
            <Mail className="w-3.5 h-3.5" /> Message
          </button>
          <Link href="/tenants/checkout" className="flex-1 py-2.5 bg-red-50 text-red-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 active:bg-red-100 transition-colors">
            <XCircle className="w-3.5 h-3.5" /> Check Out
          </Link>
        </div>
      </div>

      {/* Contact Details */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact</h3>
        <InfoRow icon={Phone} label="Phone" value={tenant.phone} />
        <InfoRow icon={Mail} label="Email" value={tenant.email || 'Not provided'} />
        {tenant.father_phone && (
          <InfoRow icon={Phone} label="Father" value={`${tenant.father_name || 'Father'} — ${tenant.father_phone}`} />
        )}
        {tenant.mother_phone && (
          <InfoRow icon={Phone} label="Mother" value={`${tenant.mother_name || 'Mother'} — ${tenant.mother_phone}`} />
        )}
      </div>

      {/* Work / Study */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Work / Study</h3>
        <InfoRow icon={Briefcase} label="Occupation" value={tenant.occupation || 'Not provided'} />
        <InfoRow icon={Building2} label="Company / College" value={tenant.company_or_college || 'Not provided'} />
      </div>

      {/* Rent & Stay */}
      {occupancy && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Stay Details</h3>
          <InfoRow
            icon={Calendar}
            label="Check-in Date"
            value={new Date(occupancy.checkin_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          />
          <InfoRow icon={IndianRupee} label="Monthly Rent" value={`₹${occupancy.monthly_rent.toLocaleString('en-IN')}`} color="text-emerald-500" />
          <InfoRow icon={IndianRupee} label="Security Deposit" value={`₹${occupancy.deposit_amount.toLocaleString('en-IN')}`} />
          <InfoRow icon={Clock} label="Rent Due Day" value={`${occupancy.rent_due_day}${ordinal(occupancy.rent_due_day)} of every month`} />
          {occupancy.notice_date && (
            <InfoRow icon={AlertTriangle} label="Notice Given" value={occupancy.notice_date} color="text-amber-500" />
          )}
        </div>
      )}

      {/* Notice Period */}
      {occupancy && (
        <NoticePeriodSection
          occupancy={occupancy}
          tenantId={tenantId}
          orgId={orgId!}
          onUpdate={refetchOccupancies}
        />
      )}

      {/* Tenant Login */}
      <TenantLoginSection tenantId={tenantId} tenant={tenant} orgId={orgId!} />

      {/* Invoice Links */}
      {occupancy && (
        <InvoiceSection occupancyId={occupancy.id} orgId={orgId!} />
      )}

      {/* Payment History */}
      {occupancy && (
        <PaymentHistorySection occupancyId={occupancy.id} />
      )}

      {/* ID Details */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Identity</h3>
        <InfoRow
          icon={Shield}
          label="Aadhaar Number"
          value={tenant.aadhaar_number || 'Not provided'}
          color={tenant.aadhaar_verified ? 'text-emerald-500' : 'text-slate-400'}
        />
      </div>
    </div>
  )
}

// ─── Notice Period Section ──────────────────────────────────────────

const NOTICE_PERIOD_DAYS = 30

function NoticePeriodSection({
  occupancy,
  tenantId,
  orgId,
  onUpdate,
}: {
  occupancy: OccupancyWithJoins
  tenantId: string
  orgId: string
  onUpdate: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [noticeDate, setNoticeDate] = useState(today)

  const computedVacateDate = (() => {
    const d = new Date(noticeDate)
    d.setDate(d.getDate() + NOTICE_PERIOD_DAYS)
    return d.toISOString().split('T')[0]
  })()

  const [vacateDate, setVacateDate] = useState(computedVacateDate)

  // Keep vacate date in sync when notice date changes
  const handleNoticeDateChange = (val: string) => {
    setNoticeDate(val)
    const d = new Date(val)
    d.setDate(d.getDate() + NOTICE_PERIOD_DAYS)
    setVacateDate(d.toISOString().split('T')[0])
  }

  const handlePutOnNotice = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await putOnNotice(occupancy.id, noticeDate, vacateDate)
      await notifyNoticePeriod(orgId, tenantId, vacateDate)
      onUpdate()
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to put on notice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelNotice = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await cancelNotice(occupancy.id)
      onUpdate()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel notice')
    } finally {
      setSubmitting(false)
    }
  }

  if (occupancy.status === 'checked_out') return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notice Period</h3>

      {occupancy.status === 'notice_period' ? (
        // Tenant is already on notice — show details
        <div className="space-y-3">
          <InfoRow
            icon={Calendar}
            label="Notice Date"
            value={new Date(occupancy.notice_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            color="text-amber-500"
          />
          <InfoRow
            icon={Calendar}
            label="Expected Vacate Date"
            value={new Date(occupancy.expected_vacate_date!).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            color="text-red-500"
          />
          <button
            onClick={handleCancelNotice}
            disabled={submitting}
            className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-slate-200 active:bg-slate-300 transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            {submitting ? 'Cancelling...' : 'Cancel Notice'}
          </button>
        </div>
      ) : (
        // Tenant is active — show "Put on Notice" button / form
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 bg-amber-50 text-amber-700 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-amber-100 active:bg-amber-200 transition-colors"
            >
              <BellRing className="w-4 h-4" /> Put on Notice
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Notice Date</label>
                <input
                  type="date"
                  value={noticeDate}
                  onChange={(e) => handleNoticeDateChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                  Expected Vacate Date
                  <span className="text-slate-400 ml-1">({NOTICE_PERIOD_DAYS} days notice)</span>
                </label>
                <input
                  type="date"
                  value={vacateDate}
                  onChange={(e) => setVacateDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setError(null) }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePutOnNotice}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-500 text-white font-semibold rounded-xl text-sm hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  {submitting ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Invoice Section ────────────────────────────────────────────────

function InvoiceSection({ occupancyId, orgId }: { occupancyId: string; orgId: string }) {
  const { data: allInvoices, loading } = useQuery(
    () => getInvoices(orgId),
    [orgId]
  )

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Latest Invoice</h3>
        <div className="py-3 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
        </div>
      </div>
    )
  }

  const invoices = (allInvoices ?? []).filter(
    (inv: Invoice & { occupancy_id?: string }) => inv.occupancy_id === occupancyId
  )

  if (invoices.length === 0) return null

  const latest = invoices[0] // already sorted desc by created_at from service

  const statusColors: Record<string, string> = {
    paid: 'text-emerald-600 bg-emerald-50',
    pending: 'text-amber-600 bg-amber-50',
    partially_paid: 'text-blue-600 bg-blue-50',
    overdue: 'text-red-600 bg-red-50',
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Latest Invoice</h3>
      <Link
        href={`/bills/invoice/${latest.id}`}
        className="flex items-center justify-between py-2.5 group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-50 shrink-0">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 group-hover:text-primary transition-colors">
              {latest.invoice_number}
            </p>
            <p className="text-[10px] text-slate-400">
              {new Date(latest.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              {' — '}
              ₹{Number(latest.total_amount).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${statusColors[latest.status] || 'text-slate-600 bg-slate-100'}`}>
            {latest.status.replace('_', ' ')}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
        </div>
      </Link>
    </div>
  )
}

// ─── Payment History Section ────────────────────────────────────────

function PaymentHistorySection({ occupancyId }: { occupancyId: string }) {
  const { data: payments, loading } = useQuery(
    () => getPaymentsForOccupancy(occupancyId),
    [occupancyId]
  )

  const typeBadge = (type: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      rent: { label: 'RENT', cls: 'text-emerald-600 bg-emerald-50' },
      deposit: { label: 'DEPOSIT', cls: 'text-blue-600 bg-blue-50' },
      advance: { label: 'ADVANCE', cls: 'text-violet-600 bg-violet-50' },
    }
    const info = map[type] || { label: type.toUpperCase(), cls: 'text-slate-600 bg-slate-100' }
    return (
      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${info.cls}`}>
        {info.label}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between p-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment History</h3>
        <Link
          href="/bills/collect"
          className="text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-lg hover:bg-primary/90 active:bg-primary/80 transition-colors flex items-center gap-1"
        >
          <CreditCard className="w-3 h-3" /> Collect Payment
        </Link>
      </div>
      <div className="px-4 pb-4">
        {loading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading payments...
          </div>
        ) : !payments || payments.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">No payments recorded yet</div>
        ) : (
          (payments as Payment[]).map((payment) => (
            <Link
              key={payment.id}
              href={`/bills/receipt/${payment.id}`}
              className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-slate-50 shrink-0">
                  <Receipt className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 group-hover:text-primary transition-colors">
                    ₹{Number(payment.amount).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {payment.payment_method ? ` — ${payment.payment_method}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {typeBadge(payment.payment_type)}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Tenant Login Section ───────────────────────────────────────────

function TenantLoginSection({ tenantId, tenant, orgId }: { tenantId: string; tenant: Tenant; orgId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState(tenant.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const { data: loginInfo, loading: loginLoading, refetch: refetchLogin } = useQuery(
    async () => {
      const { data, error } = await supabase
        .from('tenant_users')
        .select('email')
        .eq('tenant_id', tenantId)
        .maybeSingle()
      if (error) throw error
      return data
    },
    [tenantId]
  )

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/create-tenant-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, orgId, email: email.trim(), password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setResult({ success: false, message: json.error || 'Failed to create login' })
      } else {
        setResult({ success: true, message: 'Login created successfully' })
        setShowForm(false)
        setPassword('')
        refetchLogin()
      }
    } catch {
      setResult({ success: false, message: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tenant Login</h3>

      {loginLoading ? (
        <div className="py-3 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking...
        </div>
      ) : loginInfo ? (
        <div className="flex items-center gap-3 py-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 shrink-0">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 font-medium">Login enabled</p>
            <p className="text-sm text-slate-800 font-medium truncate">{loginInfo.email}</p>
          </div>
        </div>
      ) : (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 bg-primary/10 text-primary font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/20 active:bg-primary/25 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Create Login
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@email.com"
                  className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2.5 pr-10 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setResult(null) }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-semibold rounded-xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !email.trim() || password.length < 6}
                  className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {result && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
          result.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.message}
        </div>
      )}
    </div>
  )
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
