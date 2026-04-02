'use client'

import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { getPaymentById, getReceiptSettings } from '@/lib/services/billing'
import ReceiptViewer from '@/components/bills/receipt-viewer'
import { ListSkeleton } from '@/components/loading-skeleton'

export default function TenantReceiptPage() {
  const params = useParams()
  const paymentId = params.id as string
  const { orgId, orgName } = useAuth()

  const { data: payment, loading: paymentLoading, error: paymentError } = useQuery(
    () => paymentId ? getPaymentById(paymentId) : Promise.resolve(null),
    [paymentId]
  )

  const { data: orgSettings, loading: orgLoading } = useQuery(
    () => orgId ? getReceiptSettings(orgId) : Promise.resolve(null),
    [orgId]
  )

  if (paymentLoading || orgLoading) return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <ListSkeleton rows={6} />
    </div>
  )

  if (paymentError || !payment) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-500 font-medium">
          {paymentError || 'Payment not found'}
        </p>
        <Link href="/tenant/payments" className="text-xs text-primary font-semibold mt-3 inline-block">
          Back to Payments
        </Link>
      </div>
    )
  }

  const tenant = payment.occupancy?.tenant
  const bed = payment.occupancy?.bed
  const room = bed?.room

  if (!tenant || !room) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-slate-500">Could not load receipt details.</p>
        <Link href="/tenant/payments" className="text-xs text-primary font-semibold mt-3 inline-block">
          Back to Payments
        </Link>
      </div>
    )
  }

  const org = {
    name: orgSettings?.name || orgName || 'Organization',
    logo_url: orgSettings?.logo_url || null,
    gst_number: orgSettings?.gst_number || null,
    gst_enabled: orgSettings?.gst_enabled || false,
    receipt_header: orgSettings?.receipt_header || null,
    receipt_footer: orgSettings?.receipt_footer || null,
    receipt_prefix: orgSettings?.receipt_prefix || null,
    receipt_show_gst: orgSettings?.receipt_show_gst || false,
    phone: orgSettings?.phone || null,
    email: orgSettings?.email || null,
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="no-print flex items-center gap-3 mb-5">
        <Link
          href="/tenant/payments"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Payment Receipt</h1>
          <p className="text-xs text-slate-500">Download or print your receipt</p>
        </div>
      </div>

      <ReceiptViewer
        payment={{
          id: payment.id,
          amount: payment.amount,
          payment_date: payment.payment_date || payment.created_at,
          payment_method: payment.payment_method,
          payment_type: payment.payment_type,
          transaction_ref: payment.transaction_ref,
        }}
        tenant={{
          full_name: tenant.full_name,
          phone: tenant.phone,
        }}
        room={{
          name: room.name,
        }}
        bed={bed ? { bed_number: bed.bed_number } : null}
        org={org}
      />
    </div>
  )
}
