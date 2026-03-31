'use client'

import { IndianRupee } from 'lucide-react'
import BillsOverview from '@/components/bills/bills-overview'

export default function BillsPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-amber-50">
          <IndianRupee className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900">Bills & Rent</h1>
          <p className="text-xs text-slate-500">March 2026 billing cycle</p>
        </div>
      </div>
      <BillsOverview />
    </div>
  )
}
