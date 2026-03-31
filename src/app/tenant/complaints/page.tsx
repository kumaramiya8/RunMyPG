'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Wrench,
  Plus,
  Zap,
  Droplets,
  Sofa,
  SprayCan,
  AlertTriangle,
  ChevronRight,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useQuery } from '@/lib/hooks/use-query'
import { supabase } from '@/lib/supabase'
import { CardSkeleton, ListSkeleton } from '@/components/loading-skeleton'
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

const statusConfig: Record<ComplaintStatus, { icon: typeof AlertTriangle; label: string; color: string; bg: string }> = {
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

async function fetchTenantComplaints(tenantId: string) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, room:rooms(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Could not load complaints')
  return data || []
}

export default function TenantComplaintsPage() {
  const { tenantId } = useAuth()

  const { data: complaints, loading } = useQuery(
    () => fetchTenantComplaints(tenantId!),
    [tenantId]
  )

  if (!tenantId || loading) {
    return (
      <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-red-50">
              <Wrench className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Complaints</h1>
              <p className="text-xs text-slate-500">Track your issues</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <ListSkeleton rows={4} />
      </div>
    )
  }

  const allComplaints = complaints || []
  const openCount = allComplaints.filter((c: any) => c.status === 'open').length
  const inProgressCount = allComplaints.filter((c: any) => c.status === 'in_progress').length
  const resolvedCount = allComplaints.filter((c: any) => c.status === 'resolved' || c.status === 'closed').length

  return (
    <div className="px-4 py-4 md:px-8 md:py-6 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/tenant"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors md:hidden"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-red-50">
              <Wrench className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Complaints</h1>
              <p className="text-xs text-slate-500">Track your issues</p>
            </div>
          </div>
        </div>
        <Link
          href="/tenant/complaints/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white font-semibold rounded-xl text-xs hover:bg-red-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Raise
        </Link>
      </div>

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

      {/* Complaint List */}
      <div className="space-y-2">
        {allComplaints.length === 0 && (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-500">No complaints yet</p>
            <p className="text-xs text-slate-400 mt-1">Raise a complaint if you face any issue</p>
            <Link
              href="/tenant/complaints/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl text-xs hover:bg-red-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Raise Complaint
            </Link>
          </div>
        )}

        {allComplaints.map((complaint: any) => {
          const roomName = complaint.room?.name || ''
          const Icon = categoryIcons[complaint.category] || AlertTriangle
          const catColor = categoryColors[complaint.category] || 'bg-slate-50 text-slate-500'
          const stCfg = statusConfig[complaint.status as ComplaintStatus]
          const StatusIcon = stCfg?.icon || AlertTriangle
          const priCfg = priorityConfig[complaint.priority] || priorityConfig.medium

          return (
            <div
              key={complaint.id}
              className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${catColor} shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {complaint.description}
                  </p>
                  {roomName && (
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                      {roomName}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {stCfg && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${stCfg.bg} ${stCfg.color}`}>
                        <StatusIcon className="w-2.5 h-2.5" />
                        {stCfg.label}
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${priCfg.color}`}>
                      {priCfg.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5">
                      {complaint.category}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className="text-[10px] text-slate-400">{timeAgo(complaint.created_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
