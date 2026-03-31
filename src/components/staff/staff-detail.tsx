'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Phone,
  Crown,
  ShieldCheck,
  Shield,
  Eye,
  ChefHat,
  BedDouble,
  UserPlus,
  Wrench,
  IndianRupee,
  Receipt,
  FileBarChart,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Power,
} from 'lucide-react'
import type { StaffRole } from '@/lib/types'
import { useQuery, useMutation } from '@/lib/hooks/use-query'
import { getStaffById, updatePermissions, toggleStaffActive } from '@/lib/services/staff'
import { ListSkeleton } from '@/components/loading-skeleton'

const roleConfig: Record<StaffRole, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
  manager: { label: 'Manager', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  warden: { label: 'Warden', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  accountant: { label: 'Accountant', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cook: { label: 'Cook', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-50' },
}

const permissionDefs = [
  { key: 'can_view_beds' as const, label: 'View Bed Map', icon: BedDouble, desc: 'See bed availability and room details' },
  { key: 'can_manage_checkins' as const, label: 'Manage Check-ins', icon: UserPlus, desc: 'Check in and check out tenants' },
  { key: 'can_view_complaints' as const, label: 'View Complaints', icon: Wrench, desc: 'See and manage maintenance issues' },
  { key: 'can_view_finances' as const, label: 'View Finances', icon: IndianRupee, desc: 'See rent collection and invoices' },
  { key: 'can_manage_expenses' as const, label: 'Manage Expenses', icon: Receipt, desc: 'Log and view daily expenses' },
  { key: 'can_view_reports' as const, label: 'View Reports', icon: FileBarChart, desc: 'Access monthly profit reports' },
]

type PermKey = typeof permissionDefs[number]['key']

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function StaffDetail({ staffId }: { staffId: string }) {
  const { data: staff, loading, error, refetch } = useQuery(
    () => getStaffById(staffId),
    [staffId]
  )

  const updatePermsMut = useMutation(updatePermissions)
  const toggleActiveMut = useMutation(toggleStaffActive)

  const [perms, setPerms] = useState<Record<PermKey, boolean>>({
    can_view_beds: false,
    can_manage_checkins: false,
    can_view_complaints: false,
    can_view_finances: false,
    can_manage_expenses: false,
    can_view_reports: false,
  })

  useEffect(() => {
    if (staff) {
      setPerms({
        can_view_beds: staff.can_view_beds,
        can_manage_checkins: staff.can_manage_checkins,
        can_view_complaints: staff.can_view_complaints,
        can_view_finances: staff.can_view_finances,
        can_manage_expenses: staff.can_manage_expenses,
        can_view_reports: staff.can_view_reports,
      })
    }
  }, [staff])

  if (loading) return <ListSkeleton rows={3} />
  if (error) return <div className="text-center py-10"><p className="text-sm text-red-500">Error: {error}</p></div>

  if (!staff) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-slate-400">Staff member not found</p>
      </div>
    )
  }

  const rc = roleConfig[staff.role as StaffRole] || roleConfig.warden
  const RoleIcon = rc.icon
  const isOwner = staff.role === 'owner'
  const enabledCount = Object.values(perms).filter(Boolean).length
  const initials = getInitials(staff.name)

  const togglePerm = (key: PermKey) => {
    if (isOwner) return
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    await updatePermsMut.mutate(staffId, perms)
    refetch()
  }

  const handleToggleActive = async () => {
    await toggleActiveMut.mutate(staffId, !staff.is_active)
    refetch()
  }

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center">
        <div className={`w-20 h-20 rounded-full ${rc.bg} flex items-center justify-center mx-auto mb-3`}>
          <span className={`text-2xl font-bold ${rc.color}`}>{initials}</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900">{staff.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${rc.bg} ${rc.color}`}>
            <RoleIcon className="w-3 h-3" />
            {rc.label}
          </span>
          {staff.is_active ? (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          ) : (
            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Inactive</span>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-xs text-slate-500">
          <Phone className="w-3 h-3" />
          {staff.phone}
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-4 py-3 border-b border-slate-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Permissions</h3>
            <span className="text-xs font-medium text-primary">{enabledCount}/6 enabled</span>
          </div>
          {isOwner && (
            <p className="text-[10px] text-slate-400 mt-0.5">Owner has all permissions by default</p>
          )}
        </div>

        <div className="divide-y divide-slate-50">
          {permissionDefs.map((perm) => {
            const Icon = perm.icon
            const enabled = perms[perm.key]
            return (
              <div key={perm.key} className="flex items-center gap-3 px-4 py-3">
                <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/10' : 'bg-slate-100'}`}>
                  <Icon className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                    {perm.label}
                  </p>
                  <p className="text-[10px] text-slate-400">{perm.desc}</p>
                </div>
                {isOwner ? (
                  <div className="w-11 h-6 rounded-full bg-primary flex items-center justify-end pr-0.5">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </div>
                ) : (
                  <button
                    onClick={() => togglePerm(perm.key)}
                    className={`w-11 h-6 rounded-full flex items-center transition-all ${
                      enabled ? 'bg-primary justify-end pr-0.5' : 'bg-slate-200 justify-start pl-0.5'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* What they can see */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
        <h4 className="text-xs font-semibold text-slate-500 mb-2">What {staff.name.split(' ')[0]} sees in the app</h4>
        <div className="flex flex-wrap gap-1.5">
          {perms.can_view_beds && <Tag label="Bed Map" />}
          {perms.can_manage_checkins && <Tag label="Check-in/out" />}
          {perms.can_view_complaints && <Tag label="Complaints" />}
          {perms.can_view_finances && <Tag label="Bills & Rent" />}
          {perms.can_manage_expenses && <Tag label="Expenses" />}
          {perms.can_view_reports && <Tag label="Reports" />}
          <Tag label="Meal Tracker" />
          {enabledCount === 0 && !isOwner && (
            <span className="text-[11px] text-slate-400">Only meal tracker (no other access)</span>
          )}
        </div>
      </div>

      {/* Actions */}
      {!isOwner && (
        <div className="space-y-2">
          <button
            onClick={handleSave}
            disabled={updatePermsMut.loading}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {updatePermsMut.loading ? 'Saving...' : 'Save Changes'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleToggleActive}
              disabled={toggleActiveMut.loading}
              className="flex-1 py-2.5 bg-amber-50 text-amber-700 font-semibold rounded-xl text-xs border border-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Power className="w-3.5 h-3.5" />
              {staff.is_active ? 'Deactivate' : 'Reactivate'}
            </button>
            <button className="flex-1 py-2.5 bg-red-50 text-red-700 font-semibold rounded-xl text-xs border border-red-200 hover:bg-red-100 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-white border border-slate-200 text-[10px] font-medium text-slate-600">
      {label}
    </span>
  )
}
