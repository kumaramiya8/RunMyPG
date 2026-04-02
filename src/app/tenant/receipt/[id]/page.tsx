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
  // Step 1: Get tenant's occupancy first (tenant_users RLS allows this)
  const { data: occupancies } = await supabase
    .from('occupancies')
    .select('id, tenant_id, monthly_rent, deposit_amount, bed_id')
    .eq('tenant_id', tenantId)

  if (!occupancies?.length) return { error: 'No occupancy found for tenant' }

  const occIds = occupancies.map((o) => o.id)

  // Step 2: Get the specific payment using occupancy IDs (bypasses payments RLS issue)
  const { data: allPayments, error: payErr } = await supabase
    .from('payments')
    .select('*')
    .in('occupancy_id', occIds)

  if (payErr) return { error: `Payment query error: ${payErr.message}` }

  const payment = (allPayments || []).find((p: any) => p.id === paymentId)
  if (!payment) return { error: `Payment not found. ID: ${paymentId}. Total payments: ${allPayments?.length || 0}` }

  // Step 3: Get occupancy with tenant
  const { data: occ } = await supabase
    .from('occupancies')
    .select('*, tenant:tenants(full_name, phone), bed:beds(bed_number, room_id)')
    .eq('id', payment.occupancy_id)
    .maybeSingle()

  // Step 3b: Get room separately (nested joins can fail with RLS)
  let roomData: any = null
  if (occ?.bed?.room_id) {
    const { data: rm } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', occ.bed.room_id)
      .maybeSingle()
    roomData = rm
  }

  // Step 4: Get org settings
  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, gst_number, gst_enabled, receipt_header, receipt_footer, receipt_prefix, receipt_show_gst, phone, email')
    .eq('id', orgId)
    .maybeSingle()

  return { payment, occupancy: occ, room: roomData, org, error: null }
}

export default function TenantReceiptPage() {
  const params = useParams()
  const paymentId = params.id as string
  const { orgId, orgName, tenantId } = useAuth()

  const { data, loading, error: queryError } = useQuery(
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

  // Show detailed error
  if (queryError || data?.error || !data?.payment) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium mb-2">Could not load receipt</p>
          <p className="text-xs text-red-500">{queryError || data?.error || 'Payment data not found'}</p>
          <p className="text-[10px] text-red-400 mt-2 font-mono">
            paymentId: {paymentId} | tenantId: {tenantId || 'null'} | orgId: {orgId || 'null'}
          </p>
        </div>
        <Link href="/tenant/payments" className="block text-center text-sm text-primary font-semibold mt-4">
          Back to Payments
        </Link>
      </div>
    )
  }

  const { payment, occupancy, room: roomData, org: orgSettings } = data
  const tenant = occupancy?.tenant
  const bed = occupancy?.bed

  if (!tenant) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm text-amber-700 font-medium">Receipt loaded but missing tenant details</p>
        </div>
        <Link href="/tenant/payments" className="block text-center text-sm text-primary font-semibold mt-4">
          Back to Payments
        </Link>
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
          payment_method: payment.payment_method || 'cash',
          payment_type: payment.payment_type || 'rent',
          transaction_ref: payment.transaction_ref,
        }}
        tenant={{ full_name: tenant.full_name, phone: tenant.phone }}
        room={{ name: roomData?.name || 'N/A' }}
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
