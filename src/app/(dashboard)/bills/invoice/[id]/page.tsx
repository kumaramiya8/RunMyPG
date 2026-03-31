'use client'

import { useParams } from 'next/navigation'
import InvoiceDetail from '@/components/bills/invoice-detail'

export default function InvoiceDetailPage() {
  const params = useParams()
  const id = params.id as string

  return <InvoiceDetail invoiceId={id} />
}
