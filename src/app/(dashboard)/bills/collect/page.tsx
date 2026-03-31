'use client'

import { ArrowLeft, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import CollectRent from '@/components/bills/collect-rent'

export default function CollectRentPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/bills"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50">
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Collect Rent</h1>
            <p className="text-xs text-slate-500">Record a rent payment</p>
          </div>
        </div>
      </div>
      <CollectRent />
    </div>
  )
}
