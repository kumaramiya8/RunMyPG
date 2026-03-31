'use client'

import { ArrowLeft, Wrench, Plus } from 'lucide-react'
import Link from 'next/link'
import ComplaintList from '@/components/complaints/complaint-list'

export default function ComplaintsPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/more"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-red-50">
              <Wrench className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Complaints</h1>
              <p className="text-xs text-slate-500">Track maintenance issues</p>
            </div>
          </div>
        </div>
        <Link
          href="/more/complaints/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white font-semibold rounded-xl text-xs hover:bg-red-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New
        </Link>
      </div>
      <ComplaintList />
    </div>
  )
}
