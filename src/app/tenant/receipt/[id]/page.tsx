'use client'

import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import ReceiptViewer from '@/components/bills/receipt-viewer'
import { ListSkeleton } from '@/components/loading-skeleton'

async function fetchReceiptData(paymentId: string, tenantId: string, orgId: string) {
  // Get payment — query through occupancy -> tenant to ensure RLS allows it
  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle()

  if (payErr || !payment) return null

  // Get occupancy with tenant and bed/room
  const { data: occ } = await supabase
    .from('occupancies')
    .select('*, tenant:tenants(*), bed:beds(*, room:rooms(*))')
    .eq('id', payment.occupancy_id)
    .maybeSingle()

  // Get org settings
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, gst_number, gst_enabled, receipt_header, receipt_footer, receipt_prefix, receipt_show_gst, phone, email')
    .eq('id', orgId)
    .maybeSingle()

  return { payment, occupancy: occ, org }
}

export default function TenantReceiptPage() {
  const params = useParams()
  const paymentId = params.id as string
  const { orgId, orgName, tenantId } = useAuth()

  const { data, loading, error } = useQuery(
    async () => {
      if (!paymentId || !tenantId || !orgId) return null
      return fetchReceiptData(paymentId, tenantId, orgId)
    },
    [paymentId, tenantId, orgId]
  )

  if (loading) return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <ListSkeleton rows={6} />
    </div>
  )

  if (error || !data?.payment) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-red-500 font-medium">{error || 'Receipt not found'}</p>
        <Link href="/tenant/payments" className="text-xs text-primary font-semibold mt-3 inline-block">Back to Payments</Link>
      </div>
    )
  }

  const { payment, occupancy, org: orgSettings } = data
  const tenant = occupancy?.tenant
  const bed = occupancy?.bed
  const room = bed?.room

  if (!tenant || !room) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="text-sm text-slate-500">Could not load receipt details.</p>
        <Link href="/tenant/payments" className="text-xs text-primary font-semibold mt-3 inline-block">Back to Payments</Link>
      </div>
    )
  }

  return (
    <div className="px-4 py-4 max-w-lg mx-auto">
      <div className="no-print flex items-center gap-3 mb-5">
        <Link href="/tenant/payments" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors">
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
          payment_type: payment.payment_type || 'rent',
          transaction_ref: payment.transaction_ref,
        }}
        tenant={{ full_name: tenant.full_name, phone: tenant.phone }}
        room={{ name: room.name }}
        bed={bed ? { bed_number: bed.bed_number } : null}
        org={{
          name: orgSettings?.name || orgName || 'Organization',
          logo_url: orgSettings?.logo_url,
          gst_number: orgSettings?.gst_number,
          gst_enabled: orgSettings?.gst_enabled,
          receipt_header: orgSettings?.receipt_header,
          receipt_footer: orgSettings?.receipt_footer,
          receipt_prefix: orgSettings?.receipt_prefix,
          receipt_show_gst: orgSettings?.receipt_show_gst,
          phone: orgSettings?.phone,
          email: orgSettings?.email,
        }}
      />
    </div>
  )
}
