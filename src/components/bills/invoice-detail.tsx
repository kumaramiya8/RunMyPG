'use client'

import {
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Send,
  Building2,
  Calendar,
  FileText,
} from 'lucide-react'
import { useQuery } from '@/lib/hooks/use-query'
import { getInvoiceById } from '@/lib/services/billing'
import { CardSkeleton } from '@/components/loading-skeleton'
import type { InvoiceStatus } from '@/lib/types'

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

const statusConfig: Record<InvoiceStatus, { icon: typeof CheckCircle; label: string; color: string; bg: string; border: string }> = {
  paid: { icon: CheckCircle, label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  pending: { icon: Clock, label: 'Payment Pending', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  partially_paid: { icon: Clock, label: 'Partially Paid', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  overdue: { icon: AlertTriangle, label: 'Overdue', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
}

export default function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { data: invoice, loading, error } = useQuery(
    () => getInvoiceById(invoiceId),
    [invoiceId]
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-400">Invoice not found</p>
      </div>
    )
  }

  const occ = (invoice as any).occupancy
  const tenant = occ?.tenant
  const bed = occ?.bed
  const room = bed?.room
  const cfg = statusConfig[invoice.status as InvoiceStatus]
  const StatusIcon = cfg.icon

  return (
    <div className="space-y-4">
      {/* Invoice card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Status banner */}
        <div className={`px-4 py-3 ${cfg.bg} border-b ${cfg.border} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
            <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          </div>
          <span className="text-xs font-medium text-slate-500">{invoice.invoice_number}</span>
        </div>

        {/* Tenant info */}
        <div className="p-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-base font-bold text-primary">
                {tenant?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}
              </span>
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">{tenant?.full_name || 'Unknown'}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {room?.name} - {bed?.bed_number}
              </p>
            </div>
          </div>
        </div>

        {/* Invoice details */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">
              Billing Period: {formatDate(invoice.period_start)} &mdash; {formatDate(invoice.period_end)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Base Rent</span>
              <span className="font-medium text-slate-800">{formatINR(invoice.base_amount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">GST @ 18%</span>
              <span className="font-medium text-slate-800">{formatINR(invoice.gst_amount)}</span>
            </div>
            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-slate-900">Total Amount</span>
              <span className="text-2xl font-bold text-slate-900">{formatINR(invoice.total_amount)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <FileText className="w-3 h-3" />
            <span>Due Date: {formatDate(invoice.due_date)}</span>
            {occ?.rent_due_day && (
              <>
                <span className="text-slate-300">|</span>
                <span>Rent Day: {occ.rent_due_day}{ordinal(occ.rent_due_day)} of month</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* GST Details */}
      {invoice.gst_amount > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">GST Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">CGST @ 9%</span>
              <span className="font-medium">{formatINR(invoice.gst_amount / 2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">SGST @ 9%</span>
              <span className="font-medium">{formatINR(invoice.gst_amount / 2)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between text-sm">
              <span className="text-slate-600 font-medium">Total GST</span>
              <span className="font-bold text-slate-800">{formatINR(invoice.gst_amount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {invoice.status !== 'paid' && (
          <a
            href="/bills/collect"
            className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <IndianRupee className="w-4 h-4" />
            Record Payment
          </a>
        )}
        <div className="flex gap-2">
          <button className="flex-1 py-3 bg-white text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="flex-1 py-3 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <Send className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
