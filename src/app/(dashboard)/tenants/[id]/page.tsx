import TenantDetailClient from './client'
import { mockTenants } from '@/lib/mock-data'

export function generateStaticParams() {
  return mockTenants.map((t) => ({ id: t.id }))
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <TenantDetailClient params={params} />
}
