'use client'

import Link from 'next/link'
import {
  UserCog,
  Shield,
  Eye,
  ChevronRight,
  Phone,
  Crown,
  ShieldCheck,
  ShieldAlert,
  ChefHat,
} from 'lucide-react'
import type { StaffRole } from '@/lib/types'

import { mockStaff } from '@/lib/mock-data'
import type { MockStaff } from '@/lib/mock-data'

const roleConfig: Record<StaffRole, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  owner: { label: 'Owner', icon: Crown, color: 'text-amber-600', bg: 'bg-amber-50' },
  manager: { label: 'Manager', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  warden: { label: 'Warden', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  accountant: { label: 'Accountant', icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cook: { label: 'Cook', icon: ChefHat, color: 'text-orange-600', bg: 'bg-orange-50' },
}

function permissionCount(staff: MockStaff): number {
  return [staff.can_view_beds, staff.can_manage_checkins, staff.can_view_complaints, staff.can_view_finances, staff.can_manage_expenses, staff.can_view_reports].filter(Boolean).length
}

export default function StaffList() {
  const activeStaff = mockStaff.filter((s) => s.is_active)
  const inactiveStaff = mockStaff.filter((s) => !s.is_active)

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-primary">{activeStaff.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Active</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-400">{inactiveStaff.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Inactive</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-slate-900">{mockStaff.length}</p>
          <p className="text-[10px] text-slate-400 font-medium">Total</p>
        </div>
      </div>

      {/* Roles explainer */}
      <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 mb-4">
        <p className="text-xs font-semibold text-blue-700 mb-1">Role-Based Access</p>
        <p className="text-[11px] text-blue-600 leading-relaxed">
          Each staff member can only see what their permissions allow. Wardens see beds &amp; complaints.
          Accountants see finances. Only owners see everything.
        </p>
      </div>

      {/* Active staff */}
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
        Active Staff
      </p>
      <div className="space-y-2 mb-5">
        {activeStaff.map((staff) => {
          const rc = roleConfig[staff.role]
          const RoleIcon = rc.icon
          return (
            <Link
              key={staff.id}
              href={`/more/staff/${staff.id}`}
              className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all"
            >
              <div className={`w-11 h-11 rounded-full ${rc.bg} flex items-center justify-center shrink-0`}>
                <span className={`text-sm font-bold ${rc.color}`}>{staff.initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">{staff.name}</p>
                  {staff.role === 'owner' && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${rc.bg} ${rc.color}`}>
                    <RoleIcon className="w-2.5 h-2.5" />
                    {rc.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {permissionCount(staff)}/6 permissions
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </Link>
          )
        })}
      </div>

      {/* Inactive staff */}
      {inactiveStaff.length > 0 && (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Inactive
          </p>
          <div className="space-y-2">
            {inactiveStaff.map((staff) => {
              const rc = roleConfig[staff.role]
              return (
                <Link
                  key={staff.id}
                  href={`/more/staff/${staff.id}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm opacity-60 hover:opacity-80 active:bg-slate-50 transition-all"
                >
                  <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-slate-400">{staff.initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-500 truncate">{staff.name}</p>
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rc.label} — Deactivated
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
