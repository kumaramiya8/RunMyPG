import InvoiceDetailClient from './client'
import { mockInvoices } from '@/lib/mock-data'

export function generateStaticParams() {
  return mockInvoices.map((inv) => ({ id: inv.id }))
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <InvoiceDetailClient params={params} />
}
