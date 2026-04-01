'use client'

import { useState } from 'react'
import {
  Search, IndianRupee, AlertTriangle, Send, Check,
  Smartphone, Banknote, CreditCard, ArrowLeftRight,
  Calendar, Shield, FastForward,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery, useMutation } from '@/lib/hooks/use-query'
import { getInvoices, recordPayment, recordDepositPayment, recordAdvanceRent, getPaymentsForOccupancy } from '@/lib/services/billing'
import { getActiveOccupancies } from '@/lib/services/tenants'
import { notifyPaymentReceived } from '@/lib/services/notifications'
import { ListSkeleton } from '@/components/loading-skeleton'
import Link from 'next/link'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

type PaymentTab = 'rent' | 'deposit' | 'advance'

const paymentMethods = [
  { key: 'upi', label: 'UPI', icon: Smartphone },
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: ArrowLeftRight },
  { key: 'card', label: 'Card', icon: CreditCard },
]

export default function CollectRent() {
  const { orgId } = useAuth()
  const [tab, setTab] = useState<PaymentTab>('rent')
  const [search, setSearch] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [selectedOccupancy, setSelectedOccupancy] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [transactionRef, setTransactionRef] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [advanceMonths, setAdvanceMonths] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  const [lastPaymentId, setLastPaymentId] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const { data: invoices, loading: invLoading, refetch: refetchInvoices } = useQuery(
    () => getInvoices(orgId!), [orgId]
  )
  const { data: occupancies, loading: occLoading } = useQuery(
    () => getActiveOccupancies(orgId!), [orgId]
  )

  if (!orgId || invLoading || occLoading) return <ListSkeleton rows={5} />

  // Build unpaid invoices list
  const unpaidInvoices = (invoices || [])
    .filter((inv: any) => inv.status !== 'paid')
    .map((inv: any) => ({
      invoice: inv,
      tenant: inv.occupancy?.tenant,
      room: inv.occupancy?.bed?.room,
      bed: inv.occupancy?.bed,
      occupancy: inv.occupancy,
    }))

  // Build active tenant list for deposit/advance
  const activeTenants = (occupancies || []).map((occ: any) => ({
    occupancy: occ,
    tenant: occ.tenant,
    room: occ.bed?.room,
    bed: occ.bed,
  }))

  const filteredInvoices = search
    ? unpaidInvoices.filter(({ tenant, room }: any) =>
        tenant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        room?.name?.toLowerCase().includes(search.toLowerCase()))
    : unpaidInvoices

  const filteredTenants = search
    ? activeTenants.filter(({ tenant, room }: any) =>
        tenant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        room?.name?.toLowerCase().includes(search.toLowerCase()))
    : activeTenants

  const selectedInv = selectedInvoice ? unpaidInvoices.find(({ invoice }: any) => invoice.id === selectedInvoice) : null
  const selectedTenant = selectedOccupancy ? activeTenants.find(({ occupancy }: any) => occupancy.id === selectedOccupancy) : null

  const handlePayRent = async () => {
    if (!selectedInv || !orgId) return
    setPaying(true)
    setError('')
    try {
      const amount = customAmount ? Number(customAmount) : Number(selectedInv.invoice.total_amount)
      const payment = await recordPayment(
        orgId, selectedInv.invoice.id, selectedInv.invoice.occupancy_id,
        amount, paymentMethod, 'rent', transactionRef || undefined
      )
      setLastPaymentId(payment?.id || null)
      setConfirmed(true)
      refetchInvoices()
      try {
        const tenantId = selectedInv.tenant?.id
        if (tenantId) {
          await notifyPaymentReceived(orgId, tenantId, amount, 'rent', `/bills/receipt/${payment?.id}`)
        }
      } catch { /* best-effort */ }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally { setPaying(false) }
  }

  const handlePayDeposit = async () => {
    if (!selectedTenant || !orgId || !customAmount) return
    setPaying(true)
    setError('')
    try {
      const depositPayment = await recordDepositPayment(orgId, selectedTenant.occupancy.id, Number(customAmount), paymentMethod, transactionRef || undefined)
      setLastPaymentId(depositPayment?.id || null)
      setConfirmed(true)
      try {
        const tenantId = selectedTenant.tenant?.id
        if (tenantId) {
          await notifyPaymentReceived(orgId, tenantId, Number(customAmount), 'deposit', `/bills/receipt/${depositPayment?.id}`)
        }
      } catch { /* best-effort */ }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally { setPaying(false) }
  }

  const handlePayAdvance = async () => {
    if (!selectedTenant || !orgId) return
    setPaying(true)
    setError('')
    try {
      const amount = Number(selectedTenant.occupancy.monthly_rent) * advanceMonths
      const advancePayment = await recordAdvanceRent(orgId, selectedTenant.occupancy.id, amount, advanceMonths, paymentMethod, transactionRef || undefined)
      setLastPaymentId(advancePayment?.id || null)
      setConfirmed(true)
      try {
        const tenantId = selectedTenant.tenant?.id
        if (tenantId) {
          await notifyPaymentReceived(orgId, tenantId, amount, 'advance', `/bills/receipt/${advancePayment?.id}`)
        }
      } catch { /* best-effort */ }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally { setPaying(false) }
  }

  if (confirmed) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Payment Recorded</h3>
        <p className="text-sm text-slate-500 mt-1">
          {tab === 'rent' ? 'Rent payment' : tab === 'deposit' ? 'Deposit' : 'Advance rent'} has been recorded successfully
        </p>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          {lastPaymentId && (
            <Link
              href={`/bills/receipt/${lastPaymentId}`}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm text-center hover:bg-slate-200 active:scale-[0.98] transition-all"
            >
              View Receipt
            </Link>
          )}
          <button
            onClick={() => { setConfirmed(false); setSelectedInvoice(null); setSelectedOccupancy(null); setCustomAmount(''); setTransactionRef(''); setLastPaymentId(null) }}
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Collect Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Tab selector */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {[
          { key: 'rent' as const, label: 'Rent', icon: IndianRupee },
          { key: 'deposit' as const, label: 'Deposit', icon: Shield },
          { key: 'advance' as const, label: 'Advance', icon: FastForward },
        ].map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSelectedInvoice(null); setSelectedOccupancy(null); setCustomAmount('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-white shadow-sm text-primary' : 'text-slate-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* ── RENT TAB ── */}
      {tab === 'rent' && !selectedInvoice && (
        <div className="space-y-2">
          {unpaidInvoices.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-slate-400">No pending invoices</p></div>
          ) : (
            filteredInvoices.map(({ invoice, tenant, room, bed }: any) => (
              <button
                key={invoice.id}
                onClick={() => setSelectedInvoice(invoice.id)}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{tenant?.full_name?.split(' ').map((n: string) => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{tenant?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{room?.name} - {bed?.bed_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">{formatINR(invoice.total_amount)}</p>
                  {invoice.status === 'overdue' && (
                    <span className="text-[10px] text-red-600 font-semibold">Overdue</span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected invoice detail */}
      {tab === 'rent' && selectedInv && (
        <div>
          <button onClick={() => setSelectedInvoice(null)} className="text-xs text-primary font-semibold mb-3">&larr; Back</button>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <p className="text-base font-bold text-slate-900">{selectedInv.tenant?.full_name}</p>
            <p className="text-xs text-slate-500">{selectedInv.room?.name} - {selectedInv.bed?.bed_number}</p>
            <div className="bg-slate-50 rounded-lg p-3 mt-3 space-y-1.5">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Total Due</span><span className="font-bold">{formatINR(selectedInv.invoice.total_amount)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Already Paid</span><span className="font-medium">{formatINR(selectedInv.invoice.amount_paid || 0)}</span></div>
              <div className="border-t pt-1.5 flex justify-between text-sm"><span className="font-semibold">Remaining</span><span className="text-lg font-bold text-primary">{formatINR(Number(selectedInv.invoice.total_amount) - Number(selectedInv.invoice.amount_paid || 0))}</span></div>
            </div>
          </div>

          {/* Amount (allows partial) */}
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Amount to collect</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
              <input
                type="number"
                value={customAmount || (Number(selectedInv.invoice.total_amount) - Number(selectedInv.invoice.amount_paid || 0))}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <PaymentMethodPicker method={paymentMethod} onChange={setPaymentMethod} ref_={transactionRef} onRefChange={setTransactionRef} />

          <button onClick={handlePayRent} disabled={paying} className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-3">
            <Check className="w-4 h-4" />
            {paying ? 'Processing...' : `Record Payment`}
          </button>
        </div>
      )}

      {/* ── DEPOSIT TAB ── */}
      {tab === 'deposit' && !selectedOccupancy && (
        <div className="space-y-2">
          {activeTenants.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-slate-400">No active tenants</p></div>
          ) : (
            filteredTenants.map(({ occupancy, tenant, room, bed }: any) => (
              <button
                key={occupancy.id}
                onClick={() => { setSelectedOccupancy(occupancy.id); setCustomAmount(String(occupancy.deposit_amount || occupancy.monthly_rent)) }}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{tenant?.full_name?.split(' ').map((n: string) => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{tenant?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{room?.name}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-semibold text-slate-700">Deposit: {formatINR(occupancy.deposit_amount || 0)}</p>
                  <p className="text-slate-400">Paid: {formatINR(occupancy.deposit_paid || 0)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {tab === 'deposit' && selectedTenant && (
        <div>
          <button onClick={() => setSelectedOccupancy(null)} className="text-xs text-primary font-semibold mb-3">&larr; Back</button>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <p className="text-base font-bold text-slate-900">{selectedTenant.tenant?.full_name}</p>
            <div className="flex justify-between text-sm mt-2"><span className="text-slate-500">Deposit Required</span><span className="font-bold">{formatINR(selectedTenant.occupancy.deposit_amount || 0)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-slate-500">Already Paid</span><span className="font-medium text-emerald-600">{formatINR(selectedTenant.occupancy.deposit_paid || 0)}</span></div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Deposit amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>
              <input type="number" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <PaymentMethodPicker method={paymentMethod} onChange={setPaymentMethod} ref_={transactionRef} onRefChange={setTransactionRef} />
          <button onClick={handlePayDeposit} disabled={paying || !customAmount} className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-3">
            <Shield className="w-4 h-4" />
            {paying ? 'Processing...' : 'Record Deposit'}
          </button>
        </div>
      )}

      {/* ── ADVANCE TAB ── */}
      {tab === 'advance' && !selectedOccupancy && (
        <div className="space-y-2">
          {activeTenants.length === 0 ? (
            <div className="text-center py-8"><p className="text-sm text-slate-400">No active tenants</p></div>
          ) : (
            filteredTenants.map(({ occupancy, tenant, room }: any) => (
              <button
                key={occupancy.id}
                onClick={() => setSelectedOccupancy(occupancy.id)}
                className="w-full flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">{tenant?.full_name?.split(' ').map((n: string) => n[0]).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{tenant?.full_name}</p>
                  <p className="text-[11px] text-slate-500">{room?.name} &middot; {formatINR(occupancy.monthly_rent)}/mo</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {tab === 'advance' && selectedTenant && (
        <div>
          <button onClick={() => setSelectedOccupancy(null)} className="text-xs text-primary font-semibold mb-3">&larr; Back</button>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <p className="text-base font-bold text-slate-900">{selectedTenant.tenant?.full_name}</p>
            <p className="text-xs text-slate-500">Monthly rent: {formatINR(selectedTenant.occupancy.monthly_rent)}</p>
          </div>
          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Number of months</label>
            <div className="flex gap-2">
              {[1, 2, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setAdvanceMonths(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                    advanceMonths === m ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 mb-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">{advanceMonths} × {formatINR(selectedTenant.occupancy.monthly_rent)}</span>
              <span className="text-lg font-bold text-slate-900">{formatINR(Number(selectedTenant.occupancy.monthly_rent) * advanceMonths)}</span>
            </div>
          </div>
          <PaymentMethodPicker method={paymentMethod} onChange={setPaymentMethod} ref_={transactionRef} onRefChange={setTransactionRef} />
          <button onClick={handlePayAdvance} disabled={paying} className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-3">
            <FastForward className="w-4 h-4" />
            {paying ? 'Processing...' : `Pay ${advanceMonths} Month${advanceMonths > 1 ? 's' : ''} Advance`}
          </button>
        </div>
      )}
    </div>
  )
}

function PaymentMethodPicker({ method, onChange, ref_, onRefChange }: { method: string; onChange: (m: string) => void; ref_: string; onRefChange: (r: string) => void }) {
  return (
    <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm mb-3">
      <p className="text-xs font-semibold text-slate-600 mb-2">Payment Method</p>
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map((m) => {
          const Icon = m.icon
          return (
            <button
              key={m.key}
              onClick={() => onChange(m.key)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
                method === m.key ? 'border-primary bg-primary/5' : 'border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${method === m.key ? 'text-primary' : 'text-slate-400'}`} />
              <span className={`text-sm font-medium ${method === m.key ? 'text-primary' : 'text-slate-600'}`}>{m.label}</span>
            </button>
          )
        })}
      </div>
      {method !== 'cash' && (
        <div className="mt-2">
          <input type="text" placeholder="Transaction reference" value={ref_} onChange={(e) => onRefChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      )}
    </div>
  )
}
