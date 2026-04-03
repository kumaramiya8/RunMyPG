'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { LogoIcon } from './logo'
import { useAuth } from '@/lib/auth-context'
import { BuildingSelectorCompact } from './building-selector'
import { supabase } from '@/lib/supabase'

export default function MobileHeader() {
  const { orgName, orgId } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!orgId) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('read', false)
      .then(({ count }) => {
        setUnreadCount(count || 0)
      })
  }, [orgId])

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2.5">
          <LogoIcon size={32} />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">RunMyPG</h1>
            <BuildingSelectorCompact />
          </div>
        </div>

        <Link href="/more/messages" className="relative p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
