'use client'

import { usePathname } from 'next/navigation'
import { AuthProvider } from '@/lib/auth-context'
import AuthGuard from './auth-guard'
import Sidebar from './sidebar'
import BottomNav from './bottom-nav'
import MobileHeader from './mobile-header'

const publicPaths = ['/login', '/signup']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicPage = publicPaths.includes(pathname)
  const isAdminPage = pathname.startsWith('/admin')

  return (
    <AuthProvider>
      {isPublicPage ? (
        <>{children}</>
      ) : isAdminPage ? (
        <AuthGuard>
          {children}
        </AuthGuard>
      ) : (
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
      )}
    </AuthProvider>
  )
}
