'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  orgId: string | null
  orgName: string | null
  accountSlug: string | null
  accountType: string | null // 'master' or 'pg'
  staffRole: string | null
  staffName: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  isMaster: boolean
  signIn: (accountSlug: string, email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const STORAGE_KEY = 'runmypg_account_slug'

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    orgId: null,
    orgName: null,
    accountSlug: null,
    accountType: null,
    staffRole: null,
    staffName: null,
    loading: true,
  })

  const fetchOrgAndStaff = useCallback(async (userId: string, slug?: string) => {
    // Get the slug from storage if not provided
    const accountSlug = slug || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
    if (!accountSlug) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    // Use SECURITY DEFINER function to get staff+org info (bypasses RLS)
    const { data: staffRows } = await supabase.rpc('get_my_staff_info', {
      p_user_id: userId,
    })
    const info = staffRows?.[0] ?? null

    if (!info || info.account_slug !== accountSlug) {
      setState((prev) => ({ ...prev, loading: false }))
      return
    }

    setState((prev) => ({
      ...prev,
      orgId: info.org_id,
      orgName: info.org_name,
      accountSlug: info.account_slug,
      accountType: info.account_type,
      staffRole: info.staff_role,
      staffName: info.staff_name,
    }))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: session?.user ? true : false, // keep loading if we need to fetch org
      }))
      if (session?.user) {
        fetchOrgAndStaff(session.user.id).then(() => {
          setState((prev) => ({ ...prev, loading: false }))
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
      }))
      if (session?.user) {
        fetchOrgAndStaff(session.user.id)
      } else {
        setState((prev) => ({
          ...prev,
          orgId: null, orgName: null, accountSlug: null, accountType: null,
          staffRole: null, staffName: null, loading: false,
        }))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchOrgAndStaff])

  const signIn = async (accountSlug: string, email: string, password: string) => {
    // 1. Verify the account slug exists (uses SECURITY DEFINER function to bypass RLS)
    const { data: orgRows } = await supabase.rpc('get_org_by_slug', {
      p_slug: accountSlug.toLowerCase().trim(),
    })
    const org = orgRows?.[0] ?? null

    if (!org) return { error: 'Account not found. Check the account name.' }

    // 2. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) return { error: authError.message }
    if (!authData.user) return { error: 'Login failed' }

    // 3. Verify user belongs to this org (using SECURITY DEFINER function)
    const { data: staffRows } = await supabase.rpc('get_staff_for_org', {
      p_user_id: authData.user.id,
      p_org_id: org.id,
    })

    if (!staffRows?.length) {
      await supabase.auth.signOut()
      return { error: 'You do not have access to this account.' }
    }

    // 4. Store slug and fetch org info
    localStorage.setItem(STORAGE_KEY, accountSlug.toLowerCase().trim())
    await fetchOrgAndStaff(authData.user.id, accountSlug.toLowerCase().trim())

    return { error: null }
  }

  const signOut = async () => {
    localStorage.removeItem(STORAGE_KEY)
    await supabase.auth.signOut()
    setState({
      user: null, session: null, orgId: null, orgName: null,
      accountSlug: null, accountType: null, staffRole: null, staffName: null, loading: false,
    })
  }

  const isMaster = state.accountType === 'master'

  return (
    <AuthContext.Provider value={{ ...state, isMaster, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
