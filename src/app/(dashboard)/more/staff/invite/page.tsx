'use client'

import { ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'
import InviteStaff from '@/components/staff/invite-staff'

export default function InviteStaffPage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/more/staff"
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Invite Staff</h1>
            <p className="text-xs text-slate-500">Add a team member</p>
          </div>
        </div>
      </div>
      <InviteStaff />
    </div>
  )
}
