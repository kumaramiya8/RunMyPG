'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

type UserRole = 'owner' | 'manager' | 'warden' | 'accountant' | 'cook' | 'tenant'

interface AuthState {
  user: User | null
  session: Session | null
  orgId: string | null
  orgName: string | null
  accountSlug: string | null
  accountType: string | null
  staffRole: string | null
  staffName: string | null
  tenantId: string | null  // non-null if logged in as tenant
  userRole: UserRole | null  // 'tenant' or staff role
  loading: boolean
}

interface AuthContextValue extends AuthState {
  isMaster: boolean
  isTenant: boolean
  isStaff: boolean
  signIn: (accountSlug: string, email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const STORAGE_KEY = 'runmypg_account_slug'
const ROLE_KEY = 'runmypg_user_role'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, session: null, orgId: null, orgName: null,
    accountSlug: null, accountType: null, staffRole: null,
    staffName: null, tenantId: null, userRole: null, loading: true,
  })

  const fetchUserInfo = useCallback(async (userId: string, slug?: string) => {
    const accountSlug = slug || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
    const savedRole = typeof window !== 'undefined' ? localStorage.getItem(ROLE_KEY) : null

    if (!accountSlug) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    // Try staff first
    const { data: staffRows } = await supabase.rpc('get_my_staff_info', { p_user_id: userId })
    const staffInfo = staffRows?.[0] ?? null

    if (staffInfo && staffInfo.account_slug === accountSlug) {
      setState((prev) => ({
        ...prev,
        orgId: staffInfo.org_id, orgName: staffInfo.org_name,
        accountSlug: staffInfo.account_slug, accountType: staffInfo.account_type,
        staffRole: staffInfo.staff_role, staffName: staffInfo.staff_name,
        tenantId: null, userRole: staffInfo.staff_role as UserRole,
      }))
      return
    }

    // Try tenant
    const { data: orgRows } = await supabase.rpc('get_org_by_slug', { p_slug: accountSlug })
    const org = orgRows?.[0] ?? null
    if (org) {
      const { data: tenantRows } = await supabase.rpc('get_tenant_info', {
        p_user_id: userId, p_org_id: org.id,
      })
      const tenantInfo = tenantRows?.[0] ?? null
      if (tenantInfo) {
        setState((prev) => ({
          ...prev,
          orgId: org.id, orgName: tenantInfo.org_name,
          accountSlug: tenantInfo.account_slug, accountType: 'pg',
          staffRole: null, staffName: tenantInfo.tenant_name,
          tenantId: tenantInfo.tenant_id, userRole: 'tenant',
        }))
        return
      }
    }

    setState((prev) => ({ ...prev, loading: false }))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev, user: session?.user ?? null, session,
        loading: session?.user ? true : false,
      }))
      if (session?.user) {
        fetchUserInfo(session.user.id).then(() => {
          setState((prev) => ({ ...prev, loading: false }))
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({ ...prev, user: session?.user ?? null, session }))
      if (session?.user) {
        fetchUserInfo(session.user.id)
      } else {
        setState((prev) => ({
          ...prev, orgId: null, orgName: null, accountSlug: null, accountType: null,
          staffRole: null, staffName: null, tenantId: null, userRole: null, loading: false,
        }))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchUserInfo])

  const signIn = async (accountSlug: string, email: string, password: string) => {
    const { data: orgRows } = await supabase.rpc('get_org_by_slug', {
      p_slug: accountSlug.toLowerCase().trim(),
    })
    const org = orgRows?.[0] ?? null
    if (!org) return { error: 'Account not found. Check the account name.' }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) return { error: authError.message }
    if (!authData.user) return { error: 'Login failed' }

    // Check staff access first
    const { data: staffRows } = await supabase.rpc('get_staff_for_org', {
      p_user_id: authData.user.id, p_org_id: org.id,
    })

    if (staffRows?.length) {
      localStorage.setItem(STORAGE_KEY, accountSlug.toLowerCase().trim())
      localStorage.setItem(ROLE_KEY, 'staff')
      await fetchUserInfo(authData.user.id, accountSlug.toLowerCase().trim())
      return { error: null }
    }

    // Check tenant access
    const { data: tenantRows } = await supabase.rpc('get_tenant_info', {
      p_user_id: authData.user.id, p_org_id: org.id,
    })

    if (tenantRows?.length) {
      localStorage.setItem(STORAGE_KEY, accountSlug.toLowerCase().trim())
      localStorage.setItem(ROLE_KEY, 'tenant')
      await fetchUserInfo(authData.user.id, accountSlug.toLowerCase().trim())
      return { error: null }
    }

    await supabase.auth.signOut()
    return { error: 'You do not have access to this account.' }
  }

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ROLE_KEY)
    await supabase.auth.signOut()
    setState({
      user: null, session: null, orgId: null, orgName: null,
      accountSlug: null, accountType: null, staffRole: null,
      staffName: null, tenantId: null, userRole: null, loading: false,
    })
  }

  const isMaster = state.accountType === 'master'
  const isTenant = state.userRole === 'tenant'
  const isStaff = !isTenant && !!state.staffRole

  return (
    <AuthContext.Provider value={{ ...state, isMaster, isTenant, isStaff, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
