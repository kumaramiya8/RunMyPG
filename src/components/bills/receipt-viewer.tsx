'use client'

import { useRef } from 'react'
import { Printer, Download, Share2 } from 'lucide-react'

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
  logo_url?: string | null
  gst_number?: string | null
  gst_enabled?: boolean
  receipt_header?: string | null
  receipt_footer?: string | null
  receipt_prefix?: string | null
  receipt_show_gst?: boolean
  phone?: string | null
  email?: string | null
  address?: string | null
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
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return dateStr }
}

function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = { upi: 'UPI', cash: 'Cash', bank_transfer: 'Bank Transfer', card: 'Card' }
  return labels[method] || method
}

function paymentTypeDescription(type: string): string {
  const labels: Record<string, string> = { rent: 'Monthly Rent', deposit: 'Security Deposit', advance: 'Advance Rent Payment' }
  return labels[type] || type
}

function receiptTitle(type: string): string {
  const labels: Record<string, string> = { rent: 'RENT RECEIPT', deposit: 'DEPOSIT RECEIPT', advance: 'ADVANCE RECEIPT' }
  return labels[type] || 'PAYMENT RECEIPT'
}

function amountToWords(amount: number): string {
  if (amount === 0) return 'Zero Only'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const wholePart = Math.floor(Math.abs(amount))
  function convertBelowHundred(n: number): string { if (n < 20) return ones[n]; return ones[n % 10] ? `${tens[Math.floor(n / 10)]} ${ones[n % 10]}` : tens[Math.floor(n / 10)] }
  function convertBelowThousand(n: number): string { if (n < 100) return convertBelowHundred(n); return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${convertBelowHundred(n % 100)}` : ''}` }
  function convertIndian(n: number): string {
    if (n === 0) return ''; if (n < 1000) return convertBelowThousand(n)
    let r = ''
    if (n >= 10000000) { r += `${convertBelowThousand(Math.floor(n / 10000000))} Crore `; n %= 10000000 }
    if (n >= 100000) { r += `${convertBelowHundred(Math.floor(n / 100000))} Lakh `; n %= 100000 }
    if (n >= 1000) { r += `${convertBelowHundred(Math.floor(n / 1000))} Thousand `; n %= 1000 }
    if (n > 0) r += convertBelowThousand(n)
    return r.trim()
  }
  return `Rupees ${convertIndian(wholePart)} Only`
}

export default function ReceiptViewer({ payment, tenant, room, bed, org }: ReceiptViewerProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const receiptNumber = `${org.receipt_prefix || 'RCP'}-${payment.id.slice(0, 8).toUpperCase()}`
  const showGst = org.receipt_show_gst && org.gst_enabled
  const totalAmount = Number(payment.amount)
  const baseAmount = showGst ? Math.round((totalAmount / 1.18) * 100) / 100 : totalAmount
  const cgst = showGst ? Math.round(baseAmount * 0.09 * 100) / 100 : 0
  const sgst = showGst ? Math.round(baseAmount * 0.09 * 100) / 100 : 0

  const handlePrint = () => window.print()

  const handleDownloadPDF = () => {
    if (!receiptRef.current) return
    // Create a new window with just the receipt content for PDF download
    const printWindow = window.open('', '_blank')
    if (!printWindow) { handlePrint(); return }

    const content = receiptRef.current.innerHTML
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Receipt - ${receiptNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; padding: 20px; max-width: 800px; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; font-size: 13px; }
        th { background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
        .header { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 16px; }
        .logo { width: 60px; height: 60px; background: #0f172a; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; flex-shrink: 0; }
        .logo img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
        .org-name { font-size: 18px; font-weight: 700; }
        .title-bar { background: #0f172a; color: white; text-align: center; padding: 8px; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; margin: 12px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin: 16px 0; }
        .details-grid > div { padding: 10px 14px; border-right: 1px solid #e2e8f0; }
        .details-grid > div:last-child { border-right: none; }
        .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 600; }
        .value { font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 2px; }
        .bill-to { margin: 16px 0; }
        .amount-words { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin: 16px 0; font-size: 12px; color: #64748b; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 16px; text-align: center; font-size: 10px; color: #94a3b8; }
        .total-row { background: #f8fafc; font-weight: 700; font-size: 15px; }
        .text-right { text-align: right; }
        .text-sm { font-size: 12px; }
        .text-xs { font-size: 11px; color: #64748b; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${content}
      <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
      </body></html>
    `)
    printWindow.document.close()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt ${receiptNumber}`,
          text: `Payment receipt of ${formatINR(totalAmount)} from ${org.name}`,
          url: window.location.href,
        })
      } catch { /* user cancelled */ }
    }
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-print, #receipt-print * { visibility: visible; }
          #receipt-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          @page { size: A4; margin: 15mm; }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Action buttons */}
        <div className="no-print flex gap-2 mb-4">
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white font-semibold rounded-xl text-sm hover:bg-slate-800 active:scale-[0.98] transition-all">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button onClick={handleShare} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl text-sm hover:bg-emerald-100 active:scale-[0.98] transition-all">
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Receipt content */}
        <div id="receipt-print" ref={receiptRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="header px-8 pt-8 pb-4">
            <div className="flex items-start gap-4">
              {org.logo_url ? (
                <img src={org.logo_url} alt={org.name} className="w-14 h-14 object-contain rounded-lg shrink-0" />
              ) : (
                <div className="logo w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold">{org.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1">
                <p className="org-name text-lg font-bold text-slate-900">{org.name}</p>
                {org.address && <p className="text-xs text-slate-500 mt-0.5">{org.address}</p>}
                <div className="flex flex-wrap gap-x-3 mt-0.5">
                  {org.phone && <p className="text-xs text-slate-500">Ph: {org.phone}</p>}
                  {org.email && <p className="text-xs text-slate-500">{org.email}</p>}
                </div>
                {org.gst_number && <p className="text-xs text-slate-500 mt-0.5">GSTIN: <span className="font-mono">{org.gst_number}</span></p>}
              </div>
            </div>
            {org.receipt_header && <p className="text-xs text-slate-500 mt-3 text-center">{org.receipt_header}</p>}
          </div>

          {/* Title */}
          <div className="title-bar bg-slate-900 py-2 text-center">
            <h2 className="text-sm font-bold text-white tracking-[0.15em]">{receiptTitle(payment.payment_type)}</h2>
          </div>

          {/* Details grid */}
          <div className="details-grid mx-6 mt-5 border border-slate-200 rounded-lg overflow-hidden grid grid-cols-3 divide-x divide-slate-200">
            <div className="px-3 py-2.5">
              <p className="label text-[9px] font-semibold uppercase tracking-wider text-slate-400">Receipt No.</p>
              <p className="value text-sm font-bold text-slate-900 mt-0.5">{receiptNumber}</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="label text-[9px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
              <p className="value text-sm font-medium text-slate-700 mt-0.5">{formatDate(payment.payment_date)}</p>
            </div>
            <div className="px-3 py-2.5">
              <p className="label text-[9px] font-semibold uppercase tracking-wider text-slate-400">Method</p>
              <p className="value text-sm font-medium text-slate-700 mt-0.5">{paymentMethodLabel(payment.payment_method)}</p>
              {payment.transaction_ref && <p className="text-[9px] text-slate-400 font-mono mt-0.5">Ref: {payment.transaction_ref}</p>}
            </div>
          </div>

          {/* Bill To */}
          <div className="bill-to mx-6 mt-4">
            <p className="label text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Bill To</p>
            <p className="text-sm font-bold text-slate-900">{tenant.full_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">Room: {room.name}{bed ? ` | Bed: ${bed.bed_number}` : ''}</p>
            {tenant.phone && <p className="text-xs text-slate-500 mt-0.5">Ph: {tenant.phone}</p>}
          </div>

          {/* Table */}
          <div className="mx-6 mt-4 mb-5">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2 px-3 text-[9px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-200">Description</th>
                  <th className="text-right py-2 px-3 text-[9px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-200 w-32">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3 text-slate-700 border border-slate-200">{paymentTypeDescription(payment.payment_type)}</td>
                  <td className="py-2 px-3 text-slate-700 text-right font-medium border border-slate-200">{formatINR(baseAmount)}</td>
                </tr>
                {showGst && (
                  <>
                    <tr><td className="py-1.5 px-3 text-slate-500 text-xs border border-slate-200">CGST @ 9%</td><td className="py-1.5 px-3 text-slate-500 text-xs text-right border border-slate-200">{formatINR(cgst)}</td></tr>
                    <tr><td className="py-1.5 px-3 text-slate-500 text-xs border border-slate-200">SGST @ 9%</td><td className="py-1.5 px-3 text-slate-500 text-xs text-right border border-slate-200">{formatINR(sgst)}</td></tr>
                  </>
                )}
                <tr className="total-row bg-slate-50">
                  <td className="py-2.5 px-3 font-bold text-slate-900 border border-slate-200">Total Amount</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 text-right text-base border border-slate-200">{formatINR(totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in words */}
          <div className="amount-words mx-6 mb-5 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500"><span className="font-semibold text-slate-600">Amount in words:</span> <span className="italic">{amountToWords(totalAmount)}</span></p>
          </div>

          {/* Footer */}
          <div className="footer border-t border-slate-200 px-6 py-4">
            {org.receipt_footer && <p className="text-xs text-slate-600 text-center mb-2">{org.receipt_footer}</p>}
            <p className="text-[10px] text-slate-400 text-center">This is a computer generated receipt</p>
          </div>
        </div>
      </div>
    </>
  )
}
