'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Plus, Trash2, Users, BedDouble, Search,
  X, User, Mail, Lock, Eye, EyeOff, LogOut,
  ChevronDown, ChevronUp, Pencil, Power, MapPin,
  Check, Loader2,
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
  owner_user_id: string | null
  created_at: string
  tenant_count: number
  building_count: number
  is_active: boolean
}

interface Property {
  id: string
  name: string
  address: string | null
  city: string | null
  created_at: string
  floor_count: number
  room_count: number
  bed_count: number
}

export default function AdminDashboard() {
  const { user, isMaster, signOut, staffName } = useAuth()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Expanded account state
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create form state
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newOwnerName, setNewOwnerName] = useState('')
  const [newOwnerEmail, setNewOwnerEmail] = useState('')
  const [newOwnerPassword, setNewOwnerPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Inline edit state
  const [editingField, setEditingField] = useState<{ id: string; field: 'name' | 'slug' } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Change password state
  const [changePwId, setChangePwId] = useState<string | null>(null)
  const [newPwValue, setNewPwValue] = useState('')
  const [showNewPw, setShowNewPw] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [pwMessage, setPwMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Properties state
  const [properties, setProperties] = useState<Record<string, Property[]>>({})
  const [loadingProperties, setLoadingProperties] = useState<string | null>(null)
  const [addPropertyId, setAddPropertyId] = useState<string | null>(null)
  const [newPropName, setNewPropName] = useState('')
  const [newPropAddress, setNewPropAddress] = useState('')
  const [newPropCity, setNewPropCity] = useState('')
  const [addingProperty, setAddingProperty] = useState(false)
  const [removePropertyId, setRemovePropertyId] = useState<string | null>(null)

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null)

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

  // Fetch properties for an account
  const fetchProperties = useCallback(async (orgId: string) => {
    setLoadingProperties(orgId)
    try {
      const res = await fetch('/api/admin/manage-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list', orgId }),
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setProperties((prev) => ({ ...prev, [orgId]: data }))
      }
    } catch (err) {
      console.error('Error fetching properties:', err)
    }
    setLoadingProperties(null)
  }, [])

  // Expand/collapse account
  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      if (!properties[id]) {
        fetchProperties(id)
      }
    }
    // Reset inline states
    setEditingField(null)
    setChangePwId(null)
    setAddPropertyId(null)
    setPwMessage(null)
  }

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
    if (expandedId === orgId) setExpandedId(null)
    fetchAccounts()
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  // Inline edit save
  const handleSaveEdit = async (account: Account) => {
    if (!editingField) return
    setSaving(true)

    const payload: Record<string, unknown> = { orgId: account.id, action: 'update' }
    if (editingField.field === 'name') {
      payload.name = editValue.trim()
    } else {
      payload.account_slug = editValue.toLowerCase().trim().replace(/[^a-z0-9-]/g, '')
    }

    try {
      const res = await fetch('/api/admin/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id
              ? {
                  ...a,
                  ...(editingField.field === 'name'
                    ? { name: editValue.trim() }
                    : { account_slug: editValue.toLowerCase().trim().replace(/[^a-z0-9-]/g, '') }),
                }
              : a
          )
        )
      }
    } catch (err) {
      console.error('Error updating account:', err)
    }
    setSaving(false)
    setEditingField(null)
  }

  // Toggle enable/disable
  const handleToggleActive = async (account: Account) => {
    setTogglingId(account.id)
    const action = account.is_active ? 'disable' : 'enable'
    try {
      const res = await fetch('/api/admin/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: account.id, action }),
      })
      if (res.ok) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, is_active: !a.is_active } : a))
        )
      }
    } catch (err) {
      console.error('Error toggling account:', err)
    }
    setTogglingId(null)
  }

  // Change password
  const handleChangePassword = async (account: Account) => {
    if (!newPwValue || newPwValue.length < 6) {
      setPwMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setChangingPw(true)
    setPwMessage(null)
    try {
      const res = await fetch('/api/admin/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: account.id,
          action: 'change_password',
          userId: account.owner_user_id,
          newPassword: newPwValue,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setPwMessage({ type: 'success', text: 'Password changed successfully' })
        setNewPwValue('')
        setTimeout(() => {
          setChangePwId(null)
          setPwMessage(null)
        }, 2000)
      } else {
        setPwMessage({ type: 'error', text: result.error || 'Failed to change password' })
      }
    } catch {
      setPwMessage({ type: 'error', text: 'Network error' })
    }
    setChangingPw(false)
  }

  // Add property
  const handleAddProperty = async (orgId: string) => {
    if (!newPropName.trim()) return
    setAddingProperty(true)
    try {
      const res = await fetch('/api/admin/manage-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          orgId,
          name: newPropName.trim(),
          address: newPropAddress.trim() || null,
          city: newPropCity.trim() || null,
        }),
      })
      if (res.ok) {
        setNewPropName('')
        setNewPropAddress('')
        setNewPropCity('')
        setAddPropertyId(null)
        fetchProperties(orgId)
        // Update building count in accounts
        setAccounts((prev) =>
          prev.map((a) => (a.id === orgId ? { ...a, building_count: a.building_count + 1 } : a))
        )
      }
    } catch (err) {
      console.error('Error adding property:', err)
    }
    setAddingProperty(false)
  }

  // Remove property
  const handleRemoveProperty = async (buildingId: string, orgId: string) => {
    try {
      const res = await fetch('/api/admin/manage-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', buildingId }),
      })
      if (res.ok) {
        setProperties((prev) => ({
          ...prev,
          [orgId]: (prev[orgId] || []).filter((p) => p.id !== buildingId),
        }))
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === orgId ? { ...a, building_count: Math.max(0, a.building_count - 1) } : a
          )
        )
      }
    } catch (err) {
      console.error('Error removing property:', err)
    }
    setRemovePropertyId(null)
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
            {filtered.map((account) => {
              const isExpanded = expandedId === account.id
              const accountProps = properties[account.id] || []
              const isLoadingProps = loadingProperties === account.id

              return (
                <div
                  key={account.id}
                  className={`bg-white rounded-xl shadow-sm border transition-all ${
                    !account.is_active ? 'border-slate-200 opacity-60' : 'border-slate-100'
                  }`}
                >
                  {/* Account Card Header */}
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => toggleExpand(account.id)}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      account.is_active ? 'bg-primary/10' : 'bg-slate-100'
                    }`}>
                      <Building2 className={`w-6 h-6 ${account.is_active ? 'text-primary' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900">{account.name}</p>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          {account.account_slug}
                        </span>
                        {!account.is_active && (
                          <span className="text-[10px] font-semibold bg-red-50 text-red-500 px-1.5 py-0.5 rounded">
                            Disabled
                          </span>
                        )}
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
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteId(account.id)
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 px-4 pb-4">
                      {/* Account Details Section */}
                      <div className="pt-4 pb-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account Details</p>
                        <div className="space-y-2">
                          {/* Editable Name */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16 shrink-0">Name</span>
                            {editingField?.id === account.id && editingField.field === 'name' ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(account)
                                    if (e.key === 'Escape') setEditingField(null)
                                  }}
                                  onBlur={() => handleSaveEdit(account)}
                                  className="flex-1 px-2 py-1 rounded-lg border border-primary/30 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {saving && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group">
                                <span className="text-sm text-slate-900 font-medium">{account.name}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingField({ id: account.id, field: 'name' })
                                    setEditValue(account.name)
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Editable Slug */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16 shrink-0">Slug</span>
                            {editingField?.id === account.id && editingField.field === 'slug' ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(account)
                                    if (e.key === 'Escape') setEditingField(null)
                                  }}
                                  onBlur={() => handleSaveEdit(account)}
                                  className="flex-1 px-2 py-1 rounded-lg border border-primary/30 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {saving && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 group">
                                <span className="text-sm text-slate-700 font-mono">{account.account_slug}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingField({ id: account.id, field: 'slug' })
                                    setEditValue(account.account_slug)
                                  }}
                                  className="p-1 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Pencil className="w-3 h-3 text-slate-400" />
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Enable/Disable Toggle */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-xs text-slate-500 w-16 shrink-0">Status</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive(account)
                              }}
                              disabled={togglingId === account.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                account.is_active
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-500 hover:bg-red-100'
                              } disabled:opacity-50`}
                            >
                              {togglingId === account.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                              {account.is_active ? 'Active' : 'Disabled'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Owner Section */}
                      <div className="pt-3 pb-3 border-t border-slate-50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Owner</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">{account.owner_name || 'No owner assigned'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">{account.owner_email || 'N/A'}</span>
                          </div>
                          {/* Change Password */}
                          {account.owner_user_id && (
                            <div className="pt-1">
                              {changePwId === account.id ? (
                                <div className="space-y-2">
                                  <div className="relative">
                                    <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <input
                                      autoFocus
                                      type={showNewPw ? 'text' : 'password'}
                                      value={newPwValue}
                                      onChange={(e) => setNewPwValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleChangePassword(account)
                                        if (e.key === 'Escape') {
                                          setChangePwId(null)
                                          setPwMessage(null)
                                        }
                                      }}
                                      placeholder="New password (min 6 chars)"
                                      className="w-full max-w-xs pl-8 pr-16 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => setShowNewPw(!showNewPw)}
                                        className="p-1 rounded hover:bg-slate-100"
                                      >
                                        {showNewPw ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                      <button
                                        onClick={() => handleChangePassword(account)}
                                        disabled={changingPw}
                                        className="p-1 rounded hover:bg-primary/10 text-primary disabled:opacity-50"
                                      >
                                        {changingPw ? (
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setChangePwId(null)
                                          setNewPwValue('')
                                          setPwMessage(null)
                                        }}
                                        className="p-1 rounded hover:bg-slate-100 text-slate-400"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                  {pwMessage && (
                                    <p className={`text-xs font-medium ${
                                      pwMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'
                                    }`}>
                                      {pwMessage.text}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setChangePwId(account.id)
                                    setNewPwValue('')
                                    setShowNewPw(false)
                                    setPwMessage(null)
                                  }}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                  Change Owner Password
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Properties Section */}
                      <div className="pt-3 border-t border-slate-50">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Properties ({accountProps.length})
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddPropertyId(addPropertyId === account.id ? null : account.id)
                              setNewPropName('')
                              setNewPropAddress('')
                              setNewPropCity('')
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Property
                          </button>
                        </div>

                        {/* Add Property Form */}
                        {addPropertyId === account.id && (
                          <div className="bg-slate-50 rounded-xl p-3 mb-3 space-y-2">
                            <input
                              autoFocus
                              value={newPropName}
                              onChange={(e) => setNewPropName(e.target.value)}
                              placeholder="Property name *"
                              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                            <div className="flex gap-2">
                              <input
                                value={newPropAddress}
                                onChange={(e) => setNewPropAddress(e.target.value)}
                                placeholder="Address"
                                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                              <input
                                value={newPropCity}
                                onChange={(e) => setNewPropCity(e.target.value)}
                                placeholder="City"
                                className="w-32 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddProperty(account.id)}
                                disabled={addingProperty || !newPropName.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark disabled:opacity-50 transition-all"
                              >
                                {addingProperty ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Plus className="w-3.5 h-3.5" />
                                )}
                                Add
                              </button>
                              <button
                                onClick={() => setAddPropertyId(null)}
                                className="px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Properties List */}
                        {isLoadingProps ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 text-primary animate-spin" />
                          </div>
                        ) : accountProps.length === 0 ? (
                          <div className="text-center py-6">
                            <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                            <p className="text-xs text-slate-400">No properties yet</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {accountProps.map((prop) => (
                              <div
                                key={prop.id}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 group"
                              >
                                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-800">{prop.name}</p>
                                  {(prop.address || prop.city) && (
                                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3" />
                                      {[prop.address, prop.city].filter(Boolean).join(', ')}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                    <span>{prop.floor_count} floors</span>
                                    <span>{prop.room_count} rooms</span>
                                    <span>{prop.bed_count} beds</span>
                                  </div>
                                </div>
                                {removePropertyId === prop.id ? (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRemoveProperty(prop.id, account.id)
                                      }}
                                      className="px-2 py-1 bg-red-600 text-white rounded-md text-[10px] font-semibold hover:bg-red-700"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setRemovePropertyId(null)
                                      }}
                                      className="px-2 py-1 bg-slate-200 text-slate-600 rounded-md text-[10px] font-semibold hover:bg-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRemovePropertyId(prop.id)
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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

      {/* Remove Property confirmation */}
      {/* Inline confirmation is shown directly on the property row */}
    </div>
  )
}
