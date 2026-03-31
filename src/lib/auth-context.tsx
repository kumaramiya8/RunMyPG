'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  orgId: string | null
  staffRole: string | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, orgName: string, ownerName: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    orgId: null,
    staffRole: null,
    loading: true,
  })

  const fetchStaffInfo = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('staff_members')
      .select('org_id, role')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (data) {
      setState((prev) => ({ ...prev, orgId: data.org_id, staffRole: data.role }))
    }
  }, [])

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: false,
      }))
      if (session?.user) {
        fetchStaffInfo(session.user.id)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        session,
        loading: false,
      }))
      if (session?.user) {
        fetchStaffInfo(session.user.id)
      } else {
        setState((prev) => ({ ...prev, orgId: null, staffRole: null }))
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchStaffInfo])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, orgName: string, ownerName: string) => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) return { error: authError.message }
    if (!authData.user) return { error: 'Failed to create account' }

    // 2. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName, owner_id: authData.user.id })
      .select('id')
      .single()

    if (orgError) return { error: orgError.message }

    // 3. Create owner staff record
    const { error: staffError } = await supabase
      .from('staff_members')
      .insert({
        org_id: org.id,
        user_id: authData.user.id,
        name: ownerName,
        role: 'owner',
        can_view_beds: true,
        can_manage_checkins: true,
        can_view_complaints: true,
        can_view_finances: true,
        can_manage_expenses: true,
        can_view_reports: true,
        is_active: true,
      })

    if (staffError) return { error: staffError.message }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setState({ user: null, session: null, orgId: null, staffRole: null, loading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
