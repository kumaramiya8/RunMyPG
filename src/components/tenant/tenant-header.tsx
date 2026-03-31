'use client'

import { LogoIcon } from '../logo'
import { useAuth } from '@/lib/auth-context'

export default function TenantHeader() {
  const { orgName, staffName } = useAuth()

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

        {staffName && (
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-700">{staffName}</p>
            <p className="text-[10px] text-slate-400">Tenant</p>
          </div>
        )}
      </div>
    </header>
  )
}
