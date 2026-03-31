'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import AuthGuard from './auth-guard'
import Sidebar from './sidebar'
import BottomNav from './bottom-nav'
import MobileHeader from './mobile-header'
import TenantNav from './tenant/tenant-nav'
import TenantHeader from './tenant/tenant-header'

const publicPaths = ['/login', '/signup']

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isTenant } = useAuth()
  const isPublicPage = publicPaths.includes(pathname)
  const isAdminPage = pathname.startsWith('/admin')
  const isTenantPage = pathname === '/tenant' || pathname.startsWith('/tenant/')

  if (isPublicPage) return <>{children}</>

  if (isAdminPage) {
    return <AuthGuard>{children}</AuthGuard>
  }

  // Tenant portal — custom nav
  if (isTenant || isTenantPage) {
    return (
      <AuthGuard>
        <TenantHeader />
        <main className="flex-1 pb-20">
          {children}
        </main>
        <TenantNav />
      </AuthGuard>
    )
  }

  // Owner/Staff portal
  return (
    <AuthGuard>
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-full">
        <MobileHeader />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
    </AuthGuard>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ShellContent>{children}</ShellContent>
    </AuthProvider>
  )
}
