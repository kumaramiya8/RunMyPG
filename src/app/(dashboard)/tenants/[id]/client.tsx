'use client'

import { use } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import TenantProfile from '@/components/tenants/tenant-profile'

export default function TenantDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/tenants"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Tenant Profile</h1>
      </div>
      <TenantProfile tenantId={id} />
    </div>
  )
}
