import StaffDetailClient from './client'
import { mockStaff } from '@/lib/mock-data'

export function generateStaticParams() {
  return mockStaff.map((s) => ({ id: s.id }))
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <StaffDetailClient params={params} />
}
