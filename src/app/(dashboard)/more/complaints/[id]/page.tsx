import ComplaintDetailClient from './client'
import { mockComplaints } from '@/lib/mock-data'

export function generateStaticParams() {
  return mockComplaints.map((c) => ({ id: c.id }))
}

export default function ComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <ComplaintDetailClient params={params} />
}
