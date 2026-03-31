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
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { getTenantById, getActiveOccupancies } from '@/lib/services/tenants'
import { ListSkeleton } from '@/components/loading-skeleton'
import type { Occupancy, Tenant, Bed, Room } from '@/lib/types'

interface OccupancyWithJoins extends Occupancy {
  tenant: Tenant
  bed: Bed & { room: Room }
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

  const { data: allOccupancies, loading: occLoading } = useQuery(
    () => getActiveOccupancies(orgId!),
    [orgId]
  )

  const loading = tenantLoading || occLoading

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
            {room.name} &mdash; {bed.bed_number}
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

      {/* Tenant Login */}
      <TenantLoginSection tenantId={tenantId} tenant={tenant} orgId={orgId!} />

      {/* Payment History placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment History</h3>
          <button className="text-xs font-semibold text-primary">View All</button>
        </div>
        <div className="px-4 pb-4">
          {[
            { month: 'March 2026', amount: occupancy?.monthly_rent || 7000, status: 'paid', date: '01 Mar' },
            { month: 'February 2026', amount: occupancy?.monthly_rent || 7000, status: 'paid', date: '01 Feb' },
            { month: 'January 2026', amount: occupancy?.monthly_rent || 7000, status: 'paid', date: '03 Jan' },
          ].map((payment) => (
            <div key={payment.month} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{payment.month}</p>
                <p className="text-[10px] text-slate-400">Paid on {payment.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">₹{payment.amount.toLocaleString('en-IN')}</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">PAID</span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
