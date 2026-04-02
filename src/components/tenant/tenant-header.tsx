'use client'

import { useEffect, useState } from 'react'
import { Bell, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { LogoIcon } from '../logo'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const desktopNavItems = [
  { href: '/tenant', label: 'Home' },
  { href: '/tenant/payments', label: 'Payments' },
  { href: '/tenant/complaints', label: 'Complaints' },
  { href: '/tenant/meals', label: 'Meals' },
  { href: '/tenant/notifications', label: 'Notifications' },
]

export default function TenantHeader() {
  const { orgName, staffName, tenantId, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!tenantId) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', tenantId)
      .eq('read', false)
      .then(({ count }) => {
        setUnreadCount(count || 0)
      })
  }, [tenantId])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      <div className="flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <LogoIcon size={32} />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">RunMyPG</h1>
            <p className="text-[10px] text-slate-400 font-medium">{orgName || 'My Property'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 mr-4">
            {desktopNavItems.map((item) => {
              const isActive = item.href === '/tenant'
                ? pathname === '/tenant'
                : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Notification bell */}
          <Link href="/tenant/notifications" className="relative p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Name on desktop */}
          {staffName && (
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-700">{staffName}</p>
              <p className="text-[10px] text-slate-400">Tenant</p>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
