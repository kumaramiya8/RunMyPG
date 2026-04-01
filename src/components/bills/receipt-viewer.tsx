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
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
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

function paymentTypeDescription(type: string): string {
  const labels: Record<string, string> = {
    rent: 'Monthly Rent',
    deposit: 'Security Deposit',
    advance: 'Advance Rent Payment',
  }
  return labels[type] || type
}

function receiptTitle(type: string): string {
  const labels: Record<string, string> = {
    rent: 'RENT RECEIPT',
    deposit: 'PAYMENT RECEIPT',
    advance: 'PAYMENT RECEIPT',
  }
  return labels[type] || 'PAYMENT RECEIPT'
}

function amountToWords(amount: number): string {
  if (amount === 0) return 'Zero Only'

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ]

  const wholePart = Math.floor(Math.abs(amount))
  const decimalPart = Math.round((Math.abs(amount) - wholePart) * 100)

  function convertBelowHundred(n: number): string {
    if (n < 20) return ones[n]
    const t = tens[Math.floor(n / 10)]
    const o = ones[n % 10]
    return o ? `${t} ${o}` : t
  }

  function convertBelowThousand(n: number): string {
    if (n < 100) return convertBelowHundred(n)
    const h = ones[Math.floor(n / 100)]
    const remainder = n % 100
    const rest = remainder ? ` ${convertBelowHundred(remainder)}` : ''
    return `${h} Hundred${rest}`
  }

  // Indian numbering: after thousands, we use Lakh (1,00,000) and Crore (1,00,00,000)
  function convertIndian(n: number): string {
    if (n === 0) return ''
    if (n < 1000) return convertBelowThousand(n)

    let result = ''

    // Crore (1,00,00,000)
    if (n >= 10000000) {
      const crores = Math.floor(n / 10000000)
      result += `${convertBelowThousand(crores)} Crore`
      n = n % 10000000
      if (n > 0) result += ' '
    }

    // Lakh (1,00,000)
    if (n >= 100000) {
      const lakhs = Math.floor(n / 100000)
      result += `${convertBelowHundred(lakhs)} Lakh`
      n = n % 100000
      if (n > 0) result += ' '
    }

    // Thousand
    if (n >= 1000) {
      const thousands = Math.floor(n / 1000)
      result += `${convertBelowHundred(thousands)} Thousand`
      n = n % 1000
      if (n > 0) result += ' '
    }

    if (n > 0) {
      result += convertBelowThousand(n)
    }

    return result
  }

  let words = convertIndian(wholePart)

  if (decimalPart > 0) {
    words += ` and ${convertBelowHundred(decimalPart)} Paise`
  }

  return `${words} Only`
}

export default function ReceiptViewer({ payment, tenant, room, bed, org }: ReceiptViewerProps) {
  const receiptNumber = `${org.receipt_prefix || 'RCP'}${payment.id.slice(0, 8).toUpperCase()}`
  const showGst = org.receipt_show_gst && org.gst_enabled

  const totalAmount = Number(payment.amount)
  const baseAmount = showGst ? totalAmount / 1.18 : totalAmount
  const cgst = showGst ? baseAmount * 0.09 : 0
  const sgst = showGst ? baseAmount * 0.09 : 0

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
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
            max-width: 800px;
            margin: 0 auto;
            padding: 0;
            box-shadow: none;
            border: none;
            border-radius: 0;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

      <div className="max-w-2xl mx-auto">
        {/* Action buttons */}
        <div className="no-print flex gap-3 mb-6">
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

        {/* Receipt */}
        <div
          id="receipt-container"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-5">
            <div className="flex items-start gap-5">
              {org.logo_url ? (
                <img
                  src={org.logo_url}
                  alt={org.name}
                  className="w-16 h-16 object-contain rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  {org.name}
                </h1>
                {org.address && (
                  <p className="text-xs text-slate-500 mt-1">{org.address}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {org.phone && (
                    <p className="text-xs text-slate-500">Ph: {org.phone}</p>
                  )}
                  {org.email && (
                    <p className="text-xs text-slate-500">{org.email}</p>
                  )}
                </div>
                {org.gst_number && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    GSTIN: <span className="font-mono">{org.gst_number}</span>
                  </p>
                )}
              </div>
            </div>
            {org.receipt_header && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                {org.receipt_header}
              </p>
            )}
          </div>

          {/* Title bar */}
          <div className="bg-slate-900 py-2.5 text-center">
            <h2 className="text-sm font-bold text-white tracking-[0.2em] uppercase">
              {receiptTitle(payment.payment_type)}
            </h2>
          </div>

          {/* Receipt details box */}
          <div className="mx-8 mt-6 border border-slate-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-slate-200">
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Receipt No.
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {receiptNumber}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Date
                </p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {formatDate(payment.payment_date)}
                </p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Payment Method
                </p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">
                  {paymentMethodLabel(payment.payment_method)}
                </p>
                {payment.transaction_ref && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Ref: {payment.transaction_ref}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mx-8 mt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Bill To
            </p>
            <p className="text-sm font-bold text-slate-900">{tenant.full_name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Room: {room.name}
              {bed ? ` | Bed: ${bed.bed_number}` : ''}
            </p>
            {tenant.phone && (
              <p className="text-xs text-slate-500 mt-0.5">Ph: {tenant.phone}</p>
            )}
          </div>

          {/* Payment breakdown table */}
          <div className="mx-8 mt-5 mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-200">
                    Description
                  </th>
                  <th className="text-right py-2.5 px-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border border-slate-200 w-36">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2.5 px-4 text-slate-700 border border-slate-200">
                    {paymentTypeDescription(payment.payment_type)}
                  </td>
                  <td className="py-2.5 px-4 text-slate-700 text-right font-medium border border-slate-200">
                    {formatINR(baseAmount)}
                  </td>
                </tr>
                {showGst && (
                  <>
                    <tr>
                      <td className="py-2 px-4 text-slate-500 text-xs border border-slate-200">
                        CGST @ 9%
                      </td>
                      <td className="py-2 px-4 text-slate-500 text-xs text-right border border-slate-200">
                        {formatINR(cgst)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-slate-500 text-xs border border-slate-200">
                        SGST @ 9%
                      </td>
                      <td className="py-2 px-4 text-slate-500 text-xs text-right border border-slate-200">
                        {formatINR(sgst)}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900 border border-slate-200">
                    Total Amount
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 text-right text-base border border-slate-200">
                    {formatINR(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount in words */}
          <div className="mx-8 mb-6 px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-600">Amount in words:</span>{' '}
              <span className="italic">{amountToWords(totalAmount)}</span>
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 px-8 py-5">
            {org.receipt_footer && (
              <p className="text-xs text-slate-600 text-center mb-3">
                {org.receipt_footer}
              </p>
            )}
            <p className="text-[10px] text-slate-400 text-center">
              This is a computer generated receipt
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
