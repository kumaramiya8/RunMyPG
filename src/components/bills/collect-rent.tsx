'use client'

import { useState } from 'react'
import {
  Search,
  IndianRupee,
  AlertTriangle,
  Send,
  Check,
  Smartphone,
  Banknote,
  CreditCard,
  ArrowLeftRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { useMutation } from '@/lib/hooks/use-query'
import { getInvoices, recordPayment } from '@/lib/services/billing'
import { ListSkeleton } from '@/components/loading-skeleton'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const paymentMethods = [
  { key: 'upi', label: 'UPI', icon: Smartphone },
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'bank_transfer', label: 'Bank Transfer', icon: ArrowLeftRight },
  { key: 'card', label: 'Card', icon: CreditCard },
]

export default function CollectRent() {
  const { orgId } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [transactionRef, setTransactionRef] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const { data: invoices, loading, refetch } = useQuery(
    () => getInvoices(orgId!),
    [orgId]
  )

  const { mutate: doRecordPayment, loading: paying } = useMutation(
    (invoiceId: string, occupancyId: string, amount: number, method: string, ref?: string) =>
      recordPayment(orgId!, invoiceId, occupancyId, amount, method, ref)
  )

  if (!orgId || loading) {
    return <ListSkeleton rows={5} />
  }

  // Get unpaid invoices with joined data
  const unpaidInvoices = (invoices || [])
    .filter((inv: any) => inv.status !== 'paid')
    .map((inv: any) => {
      const occ = inv.occupancy
      const tenant = occ?.tenant
      const bed = occ?.bed
      const room = bed?.room
      return { invoice: inv, tenant, room, bed, occupancy: occ }
    })

  const filtered = search
    ? unpaidInvoices.filter(({ tenant, room }: any) =>
        tenant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        room?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : unpaidInvoices

  const selected = selectedInvoice
    ? unpaidInvoices.find(({ invoice }: any) => invoice.id === selectedInvoice)
    : null

  const handleConfirmPayment = async () => {
    if (!selected) return
    const result = await doRecordPayment(
      selected.invoice.id,
      selected.invoice.occupancy_id,
      selected.invoice.total_amount,
      paymentMethod,
      transactionRef || undefined
    )
    if (result !== null) {
      setConfirmed(true)
      refetch()
    }
  }

  if (confirmed && selected) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Payment Recorded</h3>
        <p className="text-sm text-slate-500 mt-1">
          {formatINR(selected.invoice.total_amount)} received from {selected.tenant?.full_name}
        </p>
        <div className="bg-emerald-50 rounded-xl p-4 mt-4 max-w-xs mx-auto border border-emerald-100">
          <p className="text-xs text-emerald-600 font-semibold mb-2">Receipt generated</p>
          <p className="text-[11px] text-emerald-700">{selected.invoice.invoice_number}</p>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 active:scale-[0.98] transition-all">
              <Send className="w-3 h-3" />
              WhatsApp Receipt
            </button>
          </div>
        </div>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          <button
            onClick={() => { setConfirmed(false); setSelectedInvoice(null); setTransactionRef('') }}
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm text-center hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Collect Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {!selectedInvoice ? (
        <>
          <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2 mb-4 border border-amber-100">
            <IndianRupee className="w-5 h-5 text-amber-600" />
            <p className="text-xs font-medium text-amber-700">
              {unpaidInvoices.length} tenant{unpaidInvoices.length !== 1 ? 's' : ''} with pending rent this cycle
            </p>
          </div>

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

          <div className="space-y-2">
            {filtered.map(({ invoice, tenant, room, bed }: any) => {
              const isOverdue = invoice.status === 'overdue'
              return (
                <button
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice.id)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">
                      {tenant?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{tenant?.full_name}</p>
                      {isOverdue && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-50 text-[10px] font-semibold text-red-600 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> Overdue
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {room?.name} - {bed?.bed_number} &middot; Due {invoice.due_date?.split('-')[2]}/{invoice.due_date?.split('-')[1]}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900 shrink-0">{formatINR(invoice.total_amount)}</p>
                </button>
              )
            })}
          </div>
        </>
      ) : selected ? (
        <div>
          <button
            onClick={() => setSelectedInvoice(null)}
            className="text-xs text-primary font-semibold mb-4 hover:underline"
          >
            &larr; Back to list
          </button>

          {/* Invoice summary */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-base font-bold text-primary">
                  {selected.tenant?.full_name?.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">{selected.tenant?.full_name}</p>
                <p className="text-xs text-slate-500">{selected.room?.name} - {selected.bed?.bed_number}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Base Rent</span>
                <span className="font-medium">{formatINR(selected.invoice.base_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST (18%)</span>
                <span className="font-medium">{formatINR(selected.invoice.gst_amount)}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                <span className="text-sm font-semibold text-slate-700">Total Due</span>
                <span className="text-lg font-bold text-slate-900">{formatINR(selected.invoice.total_amount)}</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Invoice {selected.invoice.invoice_number}
            </p>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm mb-4">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Payment Method</h4>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <button
                    key={method.key}
                    onClick={() => setPaymentMethod(method.key)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 transition-all ${
                      paymentMethod === method.key
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${paymentMethod === method.key ? 'text-primary' : 'text-slate-400'}`} />
                    <span className={`text-sm font-medium ${paymentMethod === method.key ? 'text-primary' : 'text-slate-600'}`}>
                      {method.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {paymentMethod !== 'cash' && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Transaction Reference</label>
                <input
                  type="text"
                  placeholder={paymentMethod === 'upi' ? 'UPI Transaction ID' : 'Transaction reference'}
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Confirm */}
          <button
            onClick={handleConfirmPayment}
            disabled={paying}
            className="w-full py-3.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {paying ? 'Recording...' : `Record Payment of ${formatINR(selected.invoice.total_amount)}`}
          </button>

          <p className="text-[11px] text-slate-400 text-center mt-2">
            A PDF receipt will be generated automatically
          </p>
        </div>
      ) : null}
    </div>
  )
}
