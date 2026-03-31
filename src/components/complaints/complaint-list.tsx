'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Plus,
  Zap,
  Droplets,
  Sofa,
  SprayCan,
  AlertTriangle,
  ChevronRight,
  Clock,
  CheckCircle,
  Loader2,
  Filter,
} from 'lucide-react'
import { mockComplaints, mockTenants, mockRooms } from '@/lib/mock-data'
import type { ComplaintStatus } from '@/lib/types'

const categoryIcons: Record<string, typeof Zap> = {
  Electrical: Zap,
  Plumbing: Droplets,
  Furniture: Sofa,
  Cleaning: SprayCan,
}

const categoryColors: Record<string, string> = {
  Electrical: 'bg-yellow-50 text-yellow-600',
  Plumbing: 'bg-blue-50 text-blue-600',
  Furniture: 'bg-orange-50 text-orange-600',
  Cleaning: 'bg-teal-50 text-teal-600',
}

const statusConfig: Record<ComplaintStatus, { icon: typeof Clock; label: string; color: string; bg: string }> = {
  open: { icon: AlertTriangle, label: 'Open', color: 'text-red-600', bg: 'bg-red-50' },
  in_progress: { icon: Loader2, label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-50' },
  resolved: { icon: CheckCircle, label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  closed: { icon: CheckCircle, label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100' },
}

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-blue-50 text-blue-600' },
  high: { label: 'High', color: 'bg-amber-50 text-amber-600' },
  urgent: { label: 'Urgent', color: 'bg-red-50 text-red-600' },
}

type StatusFilter = 'all' | ComplaintStatus

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export default function ComplaintList() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const enriched = mockComplaints.map((c) => ({
    complaint: c,
    tenant: c.tenant_id ? mockTenants.find((t) => t.id === c.tenant_id) : undefined,
    room: c.room_id ? mockRooms.find((r) => r.id === c.room_id) : undefined,
  }))

  const filtered = enriched.filter(({ complaint, tenant, room }) => {
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter
    const matchesSearch = !search ||
      complaint.description.toLowerCase().includes(search.toLowerCase()) ||
      tenant?.full_name.toLowerCase().includes(search.toLowerCase()) ||
      room?.name.toLowerCase().includes(search.toLowerCase()) ||
      complaint.category.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const openCount = mockComplaints.filter((c) => c.status === 'open').length
  const inProgressCount = mockComplaints.filter((c) => c.status === 'in_progress').length
  const resolvedCount = mockComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-red-600">{openCount}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Open</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-amber-600">{inProgressCount}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">In Progress</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center">
          <p className="text-xl font-bold text-emerald-600">{resolvedCount}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Resolved</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search issues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scroll-touch -mx-4 px-4 md:mx-0 md:px-0">
        {[
          { key: 'all' as const, label: 'All', count: mockComplaints.length },
          { key: 'open' as const, label: 'Open', count: openCount },
          { key: 'in_progress' as const, label: 'In Progress', count: inProgressCount },
          { key: 'resolved' as const, label: 'Resolved', count: resolvedCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              statusFilter === item.key
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {/* Complaint cards */}
      <div className="space-y-2">
        {filtered.map(({ complaint, tenant, room }) => {
          const Icon = categoryIcons[complaint.category] || AlertTriangle
          const catColor = categoryColors[complaint.category] || 'bg-slate-50 text-slate-500'
          const stCfg = statusConfig[complaint.status]
          const StatusIcon = stCfg.icon
          const priCfg = priorityConfig[complaint.priority] || priorityConfig.medium

          return (
            <Link
              key={complaint.id}
              href={`/more/complaints/${complaint.id}`}
              className="block bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm hover:shadow-md active:bg-slate-50 transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${catColor} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {complaint.description}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {room?.name || 'Unknown'}
                    </span>
                    {tenant && (
                      <>
                        <span className="text-slate-300">&middot;</span>
                        <span className="text-[11px] text-slate-500">{tenant.full_name}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${stCfg.bg} ${stCfg.color}`}>
                      <StatusIcon className="w-2.5 h-2.5" />
                      {stCfg.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priCfg.color}`}>
                      {priCfg.label}
                    </span>
                    {complaint.assigned_to && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        → {complaint.assigned_to}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-slate-400">{timeAgo(complaint.created_at)}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-slate-400">No complaints found</p>
          </div>
        )}
      </div>
    </div>
  )
}
