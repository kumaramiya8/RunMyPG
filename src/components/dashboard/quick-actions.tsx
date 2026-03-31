'use client'

import { UserPlus, BedDouble, IndianRupee, Wrench, UtensilsCrossed, Send } from 'lucide-react'
import Link from 'next/link'

const actions = [
  { href: '/tenants/checkin', label: 'Check In', icon: UserPlus, color: 'bg-emerald-500' },
  { href: '/beds', label: 'Bed Map', icon: BedDouble, color: 'bg-primary' },
  { href: '/bills/collect', label: 'Collect Rent', icon: IndianRupee, color: 'bg-amber-500' },
  { href: '/more/complaints/new', label: 'New Issue', icon: Wrench, color: 'bg-red-500' },
  { href: '/more/meals', label: 'Meals', icon: UtensilsCrossed, color: 'bg-orange-500' },
  { href: '/more/messages/new', label: 'Broadcast', icon: Send, color: 'bg-blue-500' },
]

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className={`p-2.5 rounded-xl ${action.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-slate-600 text-center leading-tight">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
