'use client'

import { Bell } from 'lucide-react'
import { LogoIcon } from './logo'
import { useAuth } from '@/lib/auth-context'

export default function MobileHeader() {
  const { orgName } = useAuth()

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2.5">
          <LogoIcon size={32} />
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">RunMyPG</h1>
            <p className="text-[10px] text-slate-400 font-medium">{orgName || 'My Property'}</p>
          </div>
        </div>

        <button className="relative p-2 rounded-full hover:bg-slate-100 active:bg-slate-200 transition-colors">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
      </div>
    </header>
  )
}
