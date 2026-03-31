'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogoFull } from './logo'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  BedDouble,
  Users,
  IndianRupee,
  Wrench,
  UtensilsCrossed,
  MessageSquare,
  UserCog,
  FileBarChart,
  Settings,
  Building2,
} from 'lucide-react'

const mainNav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/beds', label: 'Bed Map', icon: BedDouble },
  { href: '/tenants', label: 'Tenants', icon: Users },
  { href: '/bills', label: 'Bills & Rent', icon: IndianRupee },
]

const operationsNav = [
  { href: '/more/complaints', label: 'Complaints', icon: Wrench },
  { href: '/more/meals', label: 'Meal Tracker', icon: UtensilsCrossed },
  { href: '/more/messages', label: 'Messages', icon: MessageSquare },
]

const managementNav = [
  { href: '/more/staff', label: 'Staff Access', icon: UserCog },
  { href: '/more/reports', label: 'Reports', icon: FileBarChart },
  { href: '/more/property', label: 'Property Setup', icon: Building2 },
  { href: '/more/settings', label: 'Settings', icon: Settings },
]

function NavSection({ title, items }: { title: string; items: typeof mainNav }) {
  const pathname = usePathname()

  return (
    <div className="mb-6">
      <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SidebarUser() {
  const { staffName, staffRole } = useAuth()
  const name = staffName || 'User'
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const role = staffRole ? staffRole.charAt(0).toUpperCase() + staffRole.slice(1) : 'Staff'

  return (
    <div className="p-3 border-t border-slate-200">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-xs font-bold text-primary">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{name}</p>
          <p className="text-[11px] text-slate-400">{role}</p>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200">
        <LogoFull className="h-10 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scroll-touch">
        <NavSection title="Main" items={mainNav} />
        <NavSection title="Operations" items={operationsNav} />
        <NavSection title="Management" items={managementNav} />
      </nav>

      {/* Bottom user area */}
      <SidebarUser />
    </aside>
  )
}
