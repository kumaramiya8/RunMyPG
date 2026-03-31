'use client'

import { Printer, Download } from 'lucide-react'

interface ReceiptPayment {
  id: string
  amount: number
  payment_date: string
  payment_method: string
  payment_type: string
  transaction_ref?: string | null
}

interface ReceiptTenant {
  full_name: string
  phone?: string | null
}

interface ReceiptRoom {
  name: string
}

interface ReceiptBed {
  bed_number: string
}

interface ReceiptOrg {
  name: string
  gst_number?: string | null
  gst_enabled?: boolean
  receipt_header?: string | null
  receipt_footer?: string | null
  receipt_prefix?: string | null
  receipt_show_gst?: boolean
  phone?: string | null
  email?: string | null
}

interface ReceiptViewerProps {
  payment: ReceiptPayment
  tenant: ReceiptTenant
  room: ReceiptRoom
  bed?: ReceiptBed | null
  org: ReceiptOrg
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    upi: 'UPI',
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
  }
  return labels[method] || method
}

function paymentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rent: 'Rent',
    deposit: 'Security Deposit',
    advance: 'Advance Rent',
  }
  return labels[type] || type
}

export default function ReceiptViewer({ payment, tenant, room, bed, org }: ReceiptViewerProps) {
  const receiptNumber = `${org.receipt_prefix || 'RCP'}${payment.id.slice(0, 8).toUpperCase()}`
  const showGst = org.receipt_show_gst && org.gst_enabled

  // GST calculation: if enabled, the amount includes 18% GST (9% CGST + 9% SGST)
  const totalAmount = Number(payment.amount)
  const baseAmount = showGst ? totalAmount / 1.18 : totalAmount
  const cgst = showGst ? baseAmount * 0.09 : 0
  const sgst = showGst ? baseAmount * 0.09 : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-container,
          #receipt-container * {
            visibility: visible;
          }
          #receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="max-w-md mx-auto">
        {/* Action buttons - hidden in print */}
        <div className="no-print flex gap-2 mb-4">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200 active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>

        {/* Receipt card */}
        <div id="receipt-container" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-5 text-center">
            <h1 className="text-xl font-bold tracking-tight">{org.name}</h1>
            {org.receipt_header && (
              <p className="text-xs text-slate-300 mt-1">{org.receipt_header}</p>
            )}
            {org.phone && (
              <p className="text-xs text-slate-400 mt-1">Ph: {org.phone}</p>
            )}
            {org.email && (
              <p className="text-xs text-slate-400">{org.email}</p>
            )}
          </div>

          {/* Receipt title + number */}
          <div className="px-6 py-4 border-b border-dashed border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Payment Receipt</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{receiptNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{formatDate(payment.payment_date)}</p>
              </div>
            </div>
          </div>

          {/* Tenant details */}
          <div className="px-6 py-4 border-b border-dashed border-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Received From</p>
            <p className="text-sm font-bold text-slate-900">{tenant.full_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {room.name}{bed ? ` - ${bed.bed_number}` : ''}
            </p>
            {tenant.phone && (
              <p className="text-xs text-slate-400 mt-0.5">Ph: {tenant.phone}</p>
            )}
          </div>

          {/* Payment details */}
          <div className="px-6 py-4 border-b border-dashed border-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Payment Details</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment For</span>
                <span className="font-medium text-slate-700">{paymentTypeLabel(payment.payment_type)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Payment Method</span>
                <span className="font-medium text-slate-700">{paymentMethodLabel(payment.payment_method)}</span>
              </div>
              {payment.transaction_ref && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Transaction Ref</span>
                  <span className="font-mono text-xs font-medium text-slate-700">{payment.transaction_ref}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount breakdown */}
          <div className="px-6 py-4 border-b border-dashed border-slate-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Amount</p>
            <div className="space-y-2">
              {showGst ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base Amount</span>
                    <span className="font-medium text-slate-700">{formatINR(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">CGST (9%)</span>
                    <span className="font-medium text-slate-700">{formatINR(cgst)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">SGST (9%)</span>
                    <span className="font-medium text-slate-700">{formatINR(sgst)}</span>
                  </div>
                  {org.gst_number && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">GSTIN</span>
                      <span className="font-mono text-slate-500">{org.gst_number}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-2 flex justify-between">
                    <span className="text-sm font-semibold text-slate-700">Total Amount</span>
                    <span className="text-lg font-bold text-slate-900">{formatINR(totalAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-700">Total Amount</span>
                  <span className="text-lg font-bold text-slate-900">{formatINR(totalAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 text-center">
            {org.receipt_footer ? (
              <p className="text-xs text-slate-500">{org.receipt_footer}</p>
            ) : (
              <p className="text-xs text-slate-400">Thank you for your payment</p>
            )}
            <p className="text-[10px] text-slate-300 mt-2">Generated by RunMyPG</p>
          </div>
        </div>
      </div>
    </>
  )
}
