'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Plus, Trash2, Users, BedDouble, Search,
  X, User, Mail, Lock, Eye, EyeOff, Check, LogOut,
  Shield, Calendar, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { LogoFull } from '@/components/logo'

interface Account {
  id: string
  name: string
  account_slug: string
  account_type: string
  owner_name: string | null
  owner_email: string | null
  created_at: string
  tenant_count: number
  bed_count: number
  building_count: number
}

export default function AdminDashboard() {
  const { user, isMaster, signOut, staffName } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Create form state
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [newOwnerPassword, setNewOwnerPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Redirect non-master users
  useEffect(() => {
    if (!isMaster && user) {
      router.replace('/')
    }
  }, [isMaster, user, router])

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/list-accounts')
      const data = await res.json()
      if (Array.isArray(data)) {
        setAccounts(data)
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isMaster) fetchAccounts()
  }, [isMaster, fetchAccounts])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    const slug = newSlug.toLowerCase().trim()
    if (!slug || !newName || !newOwnerName || !newOwnerEmail || !newOwnerPassword) {
      setCreateError('All fields are required')
      setCreating(false)
      return
    }

    if (newOwnerPassword.length < 6) {
      setCreateError('Password must be at least 6 characters')
      setCreating(false)
      return
    }

    const res = await fetch('/api/admin/create-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountSlug: slug,
        orgName: newName,
        ownerName: newOwnerName,
        ownerEmail: newOwnerEmail,
        ownerPassword: newOwnerPassword,
      }),
    })
    const result = await res.json()

    if (!res.ok) {
      setCreateError(result.error || 'Failed to create account')
      setCreating(false)
      return
    }

    setShowCreate(false)
    setNewSlug('')
    setNewName('')
    setNewOwnerName('')
    setNewOwnerEmail('')
    setNewOwnerPassword('')
    setCreating(false)
    fetchAccounts()
  }

  const handleDelete = async (orgId: string) => {
    await fetch('/api/admin/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    })
    setDeleteId(null)
    fetchAccounts()
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const filtered = search
    ? accounts.filter((a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.account_slug.toLowerCase().includes(search.toLowerCase()) ||
        a.owner_email?.toLowerCase().includes(search.toLowerCase())
      )
    : accounts

  if (!isMaster) return null

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <LogoFull className="h-9 w-auto" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">{staffName || 'Master Admin'}</p>
              <p className="text-[10px] text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6">
        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Master Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage all PG accounts on RunMyPG</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Account
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <Building2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold text-slate-900">{accounts.length}</p>
            <p className="text-xs text-slate-500">PG Accounts</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <BedDouble className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{accounts.reduce((s, a) => s + (a.building_count || 0), 0)}</p>
            <p className="text-xs text-slate-500">Total Properties</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hidden md:block">
            <Users className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-slate-900">{accounts.reduce((s, a) => s + a.tenant_count, 0)}</p>
            <p className="text-xs text-slate-500">Total Tenants</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Accounts list */}
        {loading ? (
          <div className="text-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100 text-center">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">{search ? 'No accounts match your search' : 'No PG accounts yet'}</p>
            <p className="text-xs text-slate-400 mt-1">Create your first PG account to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((account) => (
              <div
                key={account.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900">{account.name}</p>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {account.account_slug}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {account.owner_name || 'No owner'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {account.owner_email || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>{account.building_count || 0} properties</span>
                    <span>{account.tenant_count} tenants</span>
                    <span>Created {new Date(account.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(account.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setShowCreate(false)}>
          <div className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Create PG Account</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
                <p className="text-xs text-red-600 font-medium">{createError}</p>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Account Name (slug)</label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="sunrise-pg"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Unique identifier. Only lowercase letters, numbers, hyphens.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">PG Display Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Sunrise PG - Koramangala"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="border-t border-slate-100 pt-3 mt-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Owner Credentials</p>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={newOwnerName}
                        onChange={(e) => setNewOwnerName(e.target.value)}
                        placeholder="PG Owner's full name"
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={newOwnerEmail}
                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                        placeholder="owner@example.com"
                        required
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Owner Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={newOwnerPassword}
                        onChange={(e) => setNewOwnerPassword(e.target.value)}
                        placeholder="Min 6 characters"
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showPw ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Plus className="w-4 h-4" /> Create Account</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl p-5 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will permanently delete the PG account and all its data including tenants, beds, and financial records. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
