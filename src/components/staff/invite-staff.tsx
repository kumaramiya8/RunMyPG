'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  User,
  Phone,
  Crown,
  ShieldCheck,
  Shield,
  Eye,
  ChefHat,
  Check,
  BedDouble,
  UserPlus,
  Wrench,
  IndianRupee,
  Receipt,
  FileBarChart,
} from 'lucide-react'
import type { StaffRole } from '@/lib/types'

const roles: { key: StaffRole; label: string; desc: string; icon: typeof Crown; color: string }[] = [
  { key: 'manager', label: 'Manager', desc: 'Full access except owner settings', icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600' },
  { key: 'warden', label: 'Warden', desc: 'Beds, check-ins, complaints', icon: Shield, color: 'bg-blue-50 text-blue-600' },
  { key: 'accountant', label: 'Accountant', desc: 'Rent, expenses, reports', icon: Eye, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'cook', label: 'Cook', desc: 'Meal tracker only', icon: ChefHat, color: 'bg-orange-50 text-orange-600' },
]

const permissions = [
  { key: 'can_view_beds', label: 'View Bed Map', icon: BedDouble, desc: 'See bed availability and room details' },
  { key: 'can_manage_checkins', label: 'Manage Check-ins', icon: UserPlus, desc: 'Check in and check out tenants' },
  { key: 'can_view_complaints', label: 'View Complaints', icon: Wrench, desc: 'See and manage maintenance issues' },
  { key: 'can_view_finances', label: 'View Finances', icon: IndianRupee, desc: 'See rent collection and invoices' },
  { key: 'can_manage_expenses', label: 'Manage Expenses', icon: Receipt, desc: 'Log and view daily expenses' },
  { key: 'can_view_reports', label: 'View Reports', icon: FileBarChart, desc: 'Access monthly profit reports' },
]

const roleDefaults: Record<StaffRole, Record<string, boolean>> = {
  owner: { can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: true, can_manage_expenses: true, can_view_reports: true },
  manager: { can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: true, can_manage_expenses: true, can_view_reports: true },
  warden: { can_view_beds: true, can_manage_checkins: true, can_view_complaints: true, can_view_finances: false, can_manage_expenses: false, can_view_reports: false },
  accountant: { can_view_beds: false, can_manage_checkins: false, can_view_complaints: false, can_view_finances: true, can_manage_expenses: true, can_view_reports: true },
  cook: { can_view_beds: false, can_manage_checkins: false, can_view_complaints: false, can_view_finances: false, can_manage_expenses: false, can_view_reports: false },
}

export default function InviteStaff() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<StaffRole | ''>('')
  const [perms, setPerms] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState(false)

  const selectRole = (r: StaffRole) => {
    setRole(r)
    setPerms({ ...roleDefaults[r] })
  }

  const togglePerm = (key: string) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (saved) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Invite Sent!</h3>
        <p className="text-sm text-slate-500 mt-1">
          {name} will receive a WhatsApp link to join as {role}
        </p>
        <div className="flex gap-2 mt-6 max-w-xs mx-auto">
          <button
            onClick={() => { setSaved(false); setName(''); setPhone(''); setRole(''); setPerms({}) }}
            className="flex-1 py-2.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all"
          >
            Invite Another
          </button>
          <Link
            href="/more/staff"
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm text-center hover:bg-slate-200"
          >
            View Team
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Name & Phone */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Staff member's name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="tel"
            placeholder="+91 XXXXX XXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Role selector */}
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-2 block">Role</label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => {
            const Icon = r.icon
            const isSelected = role === r.key
            return (
              <button
                key={r.key}
                onClick={() => selectRole(r.key)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${r.color.split(' ')[0]} inline-flex mb-1.5`}>
                  <Icon className={`w-4 h-4 ${r.color.split(' ')[1]}`} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{r.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{r.desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Permissions */}
      {role && (
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-2 block">
            Permissions
            <span className="text-slate-400 font-normal ml-1">(customize for this person)</span>
          </label>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
            {permissions.map((perm) => {
              const Icon = perm.icon
              const enabled = perms[perm.key] ?? false
              return (
                <div key={perm.key} className="flex items-center gap-3 px-4 py-3">
                  <div className={`p-1.5 rounded-lg ${enabled ? 'bg-primary/10' : 'bg-slate-100'}`}>
                    <Icon className={`w-4 h-4 ${enabled ? 'text-primary' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                      {perm.label}
                    </p>
                    <p className="text-[10px] text-slate-400">{perm.desc}</p>
                  </div>
                  <button
                    onClick={() => togglePerm(perm.key)}
                    className={`w-11 h-6 rounded-full flex items-center transition-all ${
                      enabled ? 'bg-primary justify-end pr-0.5' : 'bg-slate-200 justify-start pl-0.5'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Submit */}
      {role && (
        <button
          onClick={() => setSaved(true)}
          disabled={!name || !phone}
          className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl text-sm hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Send Invite via WhatsApp
        </button>
      )}
    </div>
  )
}
