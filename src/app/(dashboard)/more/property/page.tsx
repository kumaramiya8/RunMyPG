'use client'

import { ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'
import BuildingSetup from '@/components/property/building-setup'

export default function PropertySetupPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/more"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2.5 rounded-xl bg-indigo-50">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Property Setup</h1>
            <p className="text-xs text-slate-500">Configure buildings, floors, rooms, and beds</p>
          </div>
        </div>
      </div>
      <BuildingSetup />
    </div>
  )
}
