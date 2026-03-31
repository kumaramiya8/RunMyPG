'use client'

import { useParams } from 'next/navigation'
import ComplaintDetail from '@/components/complaints/complaint-detail'

export default function ComplaintDetailPage() {
  const params = useParams()
  const id = params.id as string

  return <ComplaintDetail complaintId={id} />
}
