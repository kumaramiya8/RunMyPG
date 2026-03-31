'use client'

import { useState } from 'react'
import {
  Search,
  User,
  Building2,
  IndianRupee,
  Calendar,
  AlertTriangle,
  Minus,
  Plus,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import {
  mockTenants,
  mockOccupancies,
  mockBeds,
  mockRooms,
} from '@/lib/mock-data'

interface Deduction {
  id: string
  label: string
  amount: number
}

export default function CheckoutForm() {
  const [search, setSearch] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [newDeductionLabel, setNewDeductionLabel] = useState('')
  const [newDeductionAmount, setNewDeductionAmount] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  // Build active tenants
  const activeTenants = mockTenants.map((tenant) => {
    const occupancy = mockOccupancies.find((o) => o.tenant_id === tenant.id && o.status !== 'checked_out')
    const bed = occupancy ? mockBeds.find((b) => b.id === occupancy.bed_id) : undefined
    const room = bed ? mockRooms.find((r) => r.id === bed.room_id) : undefined
    return { tenant, occupancy, bed, room }
  }).filter((t) => t.occupancy)

  const filtered = search
    ? activeTenants.filter(({ tenant, room }) =>
        tenant.full_name.toLowerCase().includes(search.toLowerCase()) ||
        room?.name.toLowerCase().includes(search.toLowerCase())
      )
    : activeTenants

  const selected = selectedTenant
    ? activeTenants.find(({ tenant }) => tenant.id === selectedTenant)
    : null

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0)
  const depositAmount = selected?.occupancy?.deposit_amount || 0
  const refundAmount = Math.max(0, depositAmount - totalDeductions)

  const addDeduction = () => {
    if (!newDeductionLabel || !newDeductionAmount) return
    setDeductions([
      ...deductions,
      { id: Date.now().toString(), label: newDeductionLabel, amount: Number(newDeductionAmount) },
    ])
    setNewDeductionLabel('')
    setNewDeductionAmount('')
  }

  const removeDeduction = (id: string) => {
    setDeductions(deductions.filter((d) => d.id !== id))
  }

  if (confirmed && selected) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Check-Out Complete</h3>
        <p className="text-sm text-slate-500 mt-1">
          {selected.tenant.full_name} has been checked out from {selected.room?.name}
        </p>
        <div className="bg-slate-50 rounded-xl p-4 mt-4 max-w-xs mx-auto">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Deposit</span>
            <span className="font-medium">₹{depositAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Deductions</span>
            <span className="font-medium text-red-500">-₹{totalDeductions.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-slate-200 pt-1 mt-1 flex justify-between text-sm">
            <span className="font-semibold text-slate-700">Refund</span>
            <span className="font-bold text-emerald-600">₹{refundAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          <Link
            href="/tenants"
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm text-center hover:bg-slate-200"
          >
            Back to Tenants
          </Link>
          <Link
            href="/beds"
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm text-center hover:bg-primary-dark"
          >
            View Bed Map
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {!selectedTenant ? (
        <>
          {/* Search & Select Tenant */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tenant to check out..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            {filtered.map(({ tenant, occupancy, room, bed }) => (
              <button
                key={tenant.id}
                onClick={() => setSelectedTenant(tenant.id)}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {tenant.full_name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{tenant.full_name}</p>
                  <p className="text-[11px] text-slate-500">
                    {room?.name} - {bed?.bed_number} &middot; Since {new Date(occupancy!.checkin_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </>
      ) : selected ? (
        <>
          {/* Selected tenant summary */}
          <button
            onClick={() => setSelectedTenant(null)}
            className="flex items-center gap-1 text-xs text-primary font-semibold mb-3 hover:underline"
          >
            <ArrowLeft className="w-3 h-3" />
            Change Tenant
          </button>

          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-base font-bold text-primary">
                  {selected.tenant.full_name.split(' ').map((n) => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{selected.tenant.full_name}</p>
                <p className="text-xs text-slate-500">
                  {selected.room?.name} - {selected.bed?.bed_number}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-400">Check-in</p>
                <p className="text-xs font-semibold text-slate-700">
                  {new Date(selected.occupancy!.checkin_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-400">Monthly Rent</p>
                <p className="text-xs font-semibold text-slate-700">₹{selected.occupancy!.monthly_rent.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <p className="text-[10px] text-slate-400">Deposit Paid</p>
                <p className="text-xs font-semibold text-slate-700">₹{depositAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Deductions from Deposit</h4>

            {deductions.length > 0 && (
              <div className="space-y-2 mb-3">
                {deductions.map((d) => (
                  <div key={d.id} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-slate-700">{d.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-red-600">-₹{d.amount.toLocaleString('en-IN')}</span>
                      <button onClick={() => removeDeduction(d.id)} className="p-1 rounded hover:bg-red-100">
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Reason (e.g., Broken chair)"
                value={newDeductionLabel}
                onChange={(e) => setNewDeductionLabel(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="relative w-24">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                <input
                  type="number"
                  placeholder="Amt"
                  value={newDeductionAmount}
                  onChange={(e) => setNewDeductionAmount(e.target.value)}
                  className="w-full pl-5 pr-2 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={addDeduction}
                disabled={!newDeductionLabel || !newDeductionAmount}
                className="px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-40 transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Settlement summary */}
          <div className="bg-slate-900 rounded-xl p-4 text-white mb-4">
            <h4 className="text-sm font-semibold text-white/70 mb-3">Settlement Summary</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Security Deposit</span>
                <span className="font-medium">₹{depositAmount.toLocaleString('en-IN')}</span>
              </div>
              {deductions.map((d) => (
                <div key={d.id} className="flex justify-between text-sm">
                  <span className="text-white/60">{d.label}</span>
                  <span className="font-medium text-red-400">-₹{d.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="border-t border-white/20 pt-2 flex justify-between">
                <span className="font-semibold">Refund to Tenant</span>
                <span className="text-lg font-bold text-emerald-400">₹{refundAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Checkout date & confirm */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Check-out Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-3 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm Check-Out
          </button>
        </>
      ) : null}
    </div>
  )
}
