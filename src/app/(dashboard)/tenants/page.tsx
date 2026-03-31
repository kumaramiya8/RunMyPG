'use client'

import { Users, UserPlus, UserMinus } from 'lucide-react'
import Link from 'next/link'
import TenantList from '@/components/tenants/tenant-list'

export default function TenantsPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Tenants</h1>
            <p className="text-xs text-slate-500">Manage your residents</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/tenants/checkout"
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 font-semibold rounded-xl text-xs hover:bg-red-100 active:scale-[0.98] transition-all"
          >
            <UserMinus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Check Out</span>
          </Link>
          <Link
            href="/tenants/checkin"
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Check In</span>
          </Link>
        </div>
      </div>
      <TenantList />
    </div>
  )
}
