'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { LogoIcon } from './logo'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isTenant, userRole } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user && pathname !== '/login' && pathname !== '/signup') {
      router.replace('/login')
      return
    }

    // Redirect tenant away from owner pages
    if (user && isTenant && !pathname.startsWith('/tenant') && pathname !== '/login') {
      router.replace('/tenant')
    }

    // Redirect staff away from tenant pages
    if (user && !isTenant && userRole && pathname.startsWith('/tenant')) {
      router.replace('/')
    }
  }, [user, loading, isTenant, userRole, pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-3">
          <LogoIcon size={48} />
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!user && pathname !== '/login' && pathname !== '/signup') {
    return null
  }

  return <>{children}</>
}
