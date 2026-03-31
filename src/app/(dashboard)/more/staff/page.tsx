'use client'

import { ArrowLeft, UserCog, UserPlus } from 'lucide-react'
import Link from 'next/link'
import StaffList from '@/components/staff/staff-list'

export default function StaffPage() {
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
            <div className="p-2.5 rounded-xl bg-purple-50">
              <UserCog className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Staff Access</h1>
              <p className="text-xs text-slate-500">Manage team & permissions</p>
            </div>
          </div>
        </div>
        <Link
          href="/more/staff/invite"
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white font-semibold rounded-xl text-xs hover:bg-primary-dark active:scale-[0.98] transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite
        </Link>
      </div>
      <StaffList />
    </div>
  )
}
