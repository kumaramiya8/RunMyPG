'use client'

import Link from 'next/link'
import {
  Wrench,
  UtensilsCrossed,
  MessageSquare,
  UserCog,
  FileBarChart,
  Building2,
  Settings,
  HelpCircle,
  ChevronRight,
} from 'lucide-react'

const sections = [
  {
    title: 'Operations',
    items: [
      { href: '/more/complaints', label: 'Complaints', desc: 'Track maintenance issues', icon: Wrench, color: 'bg-red-50 text-red-500' },
      { href: '/more/meals', label: 'Meal Tracker', desc: 'Manage food opt-outs', icon: UtensilsCrossed, color: 'bg-orange-50 text-orange-500' },
      { href: '/more/messages', label: 'Messages', desc: 'WhatsApp broadcasts & reminders', icon: MessageSquare, color: 'bg-blue-50 text-blue-500' },
    ],
  },
  {
    title: 'Management',
    items: [
      { href: '/more/staff', label: 'Staff Access', desc: 'Manage team permissions', icon: UserCog, color: 'bg-purple-50 text-purple-500' },
      { href: '/more/reports', label: 'Reports', desc: 'Download business reports', icon: FileBarChart, color: 'bg-emerald-50 text-emerald-500' },
      { href: '/more/property', label: 'Property Setup', desc: 'Buildings, floors, and rooms', icon: Building2, color: 'bg-indigo-50 text-indigo-500' },
    ],
  },
  {
    title: 'App',
    items: [
      { href: '/more/settings', label: 'Settings', desc: 'GST, notifications, profile', icon: Settings, color: 'bg-slate-100 text-slate-500' },
      { href: '/more/support', label: 'Help & Support', desc: 'Chat with our support team', icon: HelpCircle, color: 'bg-amber-50 text-amber-500' },
    ],
  },
]

export default function MorePage() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-7xl mx-auto">
      <div className="md:hidden mb-4">
        <h1 className="text-lg font-bold text-slate-900">More</h1>
      </div>

      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
              {section.title}
            </p>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-50">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50/50 active:bg-slate-100 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
